/**
 * src/config/rabbitmq.js
 *
 * Gerencia a conexão persistente com o RabbitMQ.
 * Reconecta automaticamente em caso de queda.
 *
 * Uso:
 *   const { publish } = require('../config/rabbitmq');
 *   await publish('biblioteca.relatorio.criado', { relatorioId: 1 });
 */

const amqplib = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@10.136.38.50:5672';
const RECONNECT_DELAY_MS = Number(process.env.RABBITMQ_RECONNECT_DELAY) || 5000;
const EXCHANGE = 'biblioteca';        // exchange fanout principal
const EXCHANGE_TYPE = 'topic';             // topic para roteamento por serviço

let connection = null;
let channel = null;
let connecting = false;

// ─── Conecta e declara o exchange ────────────────────────────────────────────
async function connect() {
    if (connecting) return;
    connecting = true;

    try {
        console.log('[RabbitMQ] Conectando em', RABBITMQ_URL.replace(/:\/\/.*@/, '://***@'));
        connection = await amqplib.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        // Declara o exchange (idempotente — OK se já existir)
        await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });

        console.log('[RabbitMQ] Conectado. Exchange:', EXCHANGE);
        connecting = false;

        // Inicia os consumidores das filas
        await iniciarConsumidores();

        // Reconecta se a conexão cair
        connection.on('close', () => {
            console.warn('[RabbitMQ] Conexão encerrada. Reconectando em', RECONNECT_DELAY_MS, 'ms...');
            connection = null;
            channel = null;
            connecting = false;
            setTimeout(connect, RECONNECT_DELAY_MS);
        });

        connection.on('error', (err) => {
            console.error('[RabbitMQ] Erro na conexão:', err.message);
        });

    } catch (err) {
        connecting = false;
        console.error('[RabbitMQ] Falha ao conectar:', err.message, '— tentando novamente em', RECONNECT_DELAY_MS, 'ms');
        setTimeout(connect, RECONNECT_DELAY_MS);
    }
}

// ─── Publica um evento ────────────────────────────────────────────────────────
/**
 * @param {string} routingKey  Ex: "biblioteca.emprestimo.criado"
 * @param {object} payload     Objeto JS — será serializado em JSON
 * @returns {boolean}          true se publicou, false se canal indisponível
 */
async function publish(routingKey, payload) {
    if (!channel) {
        console.warn('[RabbitMQ] Canal indisponível. Evento não publicado:', routingKey);
        return false;
    }

    try {
        const buffer = Buffer.from(JSON.stringify(payload));
        channel.publish(EXCHANGE, routingKey, buffer, {
            persistent: true,           // sobrevive a reinicialização do broker
            contentType: 'application/json',
            timestamp: Math.floor(Date.now() / 1000),
            appId: 'biblioteca-relatorio',
        });
        console.log('[RabbitMQ] Publicado:', routingKey, payload);
        return true;
    } catch (err) {
        console.error('[RabbitMQ] Erro ao publicar:', err.message);
        return false;
    }
}

// ─── Fecha a conexão (para graceful shutdown) ─────────────────────────────────
async function close() {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        console.log('[RabbitMQ] Conexão encerrada com segurança.');
    } catch (_) { }
}

// ─── Chaves de roteamento dos eventos deste microsserviço ────────────────────
const EVENTS = {
    RELATORIO_CRIADO: 'biblioteca.relatorio.criado',
    RELATORIO_ATUALIZADO: 'biblioteca.relatorio.atualizado',
    RELATORIO_DELETADO: 'biblioteca.relatorio.deletado',
    SNAPSHOT_LIVRO_GERADO: 'biblioteca.relatorio.snapshot_livro.gerado',
    SNAPSHOT_USUARIO_GERADO: 'biblioteca.relatorio.snapshot_usuario.gerado',
    SNAPSHOT_EMPRESTIMO_GERADO: 'biblioteca.relatorio.snapshot_emprestimo.gerado',
};

async function iniciarConsumidores() {
    const prisma = require('./prisma'); // singleton

    // ── Fila 1: empréstimo criado → snapshot de empréstimo ─────────────────
    const qEmprestimo = 'relatorio.fila.emprestimo.criado';
    await channel.assertQueue(qEmprestimo, { durable: true });
    await channel.bindQueue(qEmprestimo, EXCHANGE, 'biblioteca.emprestimo.criado');

    channel.consume(qEmprestimo, async (msg) => {
        if (!msg) return;
        try {
            const payload = JSON.parse(msg.content.toString());

            await prisma.relatorioEmprestimo.create({
                data: {
                    relatorio_emprestimo_data_emprestimo: new Date(payload.timestamp || Date.now()),
                    relatorio_emprestimo_data_prevista: new Date(payload.dataPrazo),
                    relatorio_emprestimo_multa_aplicada: 0
                }
            });

            console.log(`[RabbitMQ Consumer] Snapshot de empréstimo ${payload.emprestimoId} salvo no Relatório.`);
            channel.ack(msg);
        } catch (err) {
            console.error('[RabbitMQ Consumer] Erro ao processar biblioteca.emprestimo.criado:', err.message);
            channel.nack(msg, false, false);
        }
    });

    // ── Fila 2: devolução registrada → snapshot com data de devolução ──────
    const qDevolucao = 'relatorio.fila.devolucao.registrada';
    await channel.assertQueue(qDevolucao, { durable: true });
    await channel.bindQueue(qDevolucao, EXCHANGE, 'biblioteca.devolucao.registrada');

    channel.consume(qDevolucao, async (msg) => {
        if (!msg) return;
        try {
            const payload = JSON.parse(msg.content.toString());

            // Cria registro principal de relatório vinculado ao empréstimo/usuário/livro
            await prisma.relatorio.create({
                data: {
                    relatorio_emprestimo_id: payload.emprestimoId || null,
                    relatorio_livro_id: payload.livroId || null,
                    relatorio_usuario_id: payload.usuarioId || null,
                    relatorio_status: 1
                }
            });

            console.log(`[RabbitMQ Consumer] Relatório de devolução ${payload.devolucaoId} salvo.`);
            channel.ack(msg);
        } catch (err) {
            console.error('[RabbitMQ Consumer] Erro ao processar biblioteca.devolucao.registrada:', err.message);
            channel.nack(msg, false, false);
        }
    });

    // ── Fila 3: multa criada → snapshot de usuário inadimplente ────────────
    const qMulta = 'relatorio.fila.multa.criada';
    await channel.assertQueue(qMulta, { durable: true });
    await channel.bindQueue(qMulta, EXCHANGE, 'biblioteca.multa.criada');

    channel.consume(qMulta, async (msg) => {
        if (!msg) return;
        try {
            const payload = JSON.parse(msg.content.toString());

            await prisma.relatorioUsuario.create({
                data: {
                    relatorio_usuario_nome: `Usuário ${payload.usuarioId}`,
                    relatorio_usuario_total_emprestimos: 1,
                    relatorio_usuario_total_atrasos: 1,
                    relatorio_usuario_total_multas: payload.valor || 0
                }
            });

            console.log(`[RabbitMQ Consumer] Snapshot de multa para usuário ${payload.usuarioId} salvo.`);
            channel.ack(msg);
        } catch (err) {
            console.error('[RabbitMQ Consumer] Erro ao processar biblioteca.multa.criada:', err.message);
            channel.nack(msg, false, false);
        }
    });

    console.log('[RabbitMQ] Consumidores do Relatório iniciados com sucesso.');
}

module.exports = { connect, publish, close, EVENTS, iniciarConsumidores };