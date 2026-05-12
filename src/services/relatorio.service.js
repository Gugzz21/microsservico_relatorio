const prisma = require('../config/prisma');

async function gerarSnapshotLivro(data) {
    // Salva snapshot estatístico de um livro
    return prisma.relatorioLivro.create({
        data: {
            relatorio_livro_titulo: data.titulo,
            relatorio_livro_total_emprestimos: Number(data.total),
            relatorio_livro_periodo_inicio: new Date(data.inicio),
            relatorio_livro_periodo_fim: new Date(data.fim)
        }
    });
}

async function dashboardKpis() {
    // Recolhe as volumetrias globais do sistema de forma paralela
    const [totalLivros, totalUsuarios, totalEmprestimos] = await Promise.all([
        prisma.relatorioLivro.count(),
        prisma.relatorioUsuario.count(),
        prisma.relatorioEmprestimo.count()
    ]);

    return {
        total_livros: totalLivros,
        total_usuarios: totalUsuarios,
        total_emprestimos: totalEmprestimos
    };
}

async function topLivrosLidos() {
    // Ordenação dos livros mais lidos no acervo (Top 10)
    const top = await prisma.relatorioLivro.groupBy({
        by: ['relatorio_livro_titulo'],
        _sum: { relatorio_livro_total_emprestimos: true },
        orderBy: { _sum: { relatorio_livro_total_emprestimos: 'desc' } },
        take: 10
    });

    return top.map(item => ({
        titulo: item.relatorio_livro_titulo,
        total: item._sum.relatorio_livro_total_emprestimos
    }));
}

async function usuariosInadimplentes() {
    return prisma.relatorioUsuario.findMany({
        where: { relatorio_usuario_total_multas: { gt: 0 } },
        orderBy: { relatorio_usuario_total_multas: 'desc' },
        select: { relatorio_usuario_nome: true, relatorio_usuario_total_multas: true }
    });
}

async function criar(data) {
    return prisma.relatorio.create({
        data: {
            relatorio_emprestimo_id: data.relatorio_emprestimo_id,
            relatorio_livro_id: data.relatorio_livro_id,
            relatorio_usuario_id: data.relatorio_usuario_id,
            relatorio_status: data.relatorio_status || 1
        }
    });
}

async function listar() {
    return prisma.relatorio.findMany({
        where: { relatorio_status: { not: 0 } },
        orderBy: { relatorio_data_geracao: 'desc' }
    });
}

async function buscarPorId(id) {
    return prisma.relatorio.findFirst({
        where: { relatorio_id: Number(id), relatorio_status: { not: 0 } }
    });
}

async function deletar(id) {
    return prisma.relatorio.update({
        where: { relatorio_id: Number(id) },
        data: { relatorio_status: 0 }
    });
}

async function alterarStatus(id, { relatorio_status }) {
    return prisma.relatorio.update({
        where: { relatorio_id: Number(id) },
        data: { relatorio_status: Number(relatorio_status) }
    });
}

async function limparAntigos() {
    const doisAnosAtras = new Date();
    doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);

    return prisma.relatorio.updateMany({
        where: { relatorio_data_geracao: { lt: doisAnosAtras } },
        data: { relatorio_status: 0 }
    });
}

async function exportarCSV() {
    return prisma.relatorio.findMany({
        where: { relatorio_status: { not: 0 } }
    });
}

async function listarSnapshotLivros() {
    return prisma.relatorioLivro.findMany({
        orderBy: { relatorio_livro_data_geracao: 'desc' }
    });
}

async function buscarSnapshotLivroId(id) {
    return prisma.relatorioLivro.findUnique({
        where: { relatorio_livro_id: Number(id) }
    });
}

async function gerarSnapshotUsuario(data) {
    return prisma.relatorioUsuario.create({
        data: {
            relatorio_usuario_nome: data.nome,
            relatorio_usuario_total_emprestimos: Number(data.emprestimos),
            relatorio_usuario_total_atrasos: Number(data.atrasos),
            relatorio_usuario_total_multas: Number(data.multas)
        }
    });
}

async function listarSnapshotUsuarios() {
    return prisma.relatorioUsuario.findMany({
        orderBy: { relatorio_usuario_data_geracao: 'desc' }
    });
}

async function buscarSnapshotUsuarioId(id) {
    return prisma.relatorioUsuario.findUnique({
        where: { relatorio_usuario_id: Number(id) }
    });
}

async function gerarSnapshotEmprestimo(data) {
    return prisma.relatorioEmprestimo.create({
        data: {
            relatorio_emprestimo_data_emprestimo: new Date(data.data_emp),
            relatorio_emprestimo_data_prevista: new Date(data.data_prev),
            relatorio_emprestimo_data_devolucao: data.data_dev ? new Date(data.data_dev) : null,
            relatorio_emprestimo_multa_aplicada: Number(data.multa)
        }
    });
}

async function listarSnapshotEmprestimos() {
    return prisma.relatorioEmprestimo.findMany({
        orderBy: { relatorio_emprestimo_data_geracao: 'desc' }
    });
}

async function buscarSnapshotEmprestimoId(id) {
    return prisma.relatorioEmprestimo.findUnique({
        where: { relatorio_emprestimo_id: Number(id) }
    });
}

async function totalMultas() {
    const result = await prisma.relatorioEmprestimo.aggregate({
        _sum: { relatorio_emprestimo_multa_aplicada: true }
    });
    return { arrecadacao_total: result._sum.relatorio_emprestimo_multa_aplicada || 0 };
}

module.exports = {
    gerarSnapshotLivro, dashboardKpis, topLivrosLidos, usuariosInadimplentes,
    criar, listar, buscarPorId, deletar, alterarStatus, limparAntigos, exportarCSV,
    listarSnapshotLivros, buscarSnapshotLivroId,
    gerarSnapshotUsuario, listarSnapshotUsuarios, buscarSnapshotUsuarioId,
    gerarSnapshotEmprestimo, listarSnapshotEmprestimos, buscarSnapshotEmprestimoId,
    totalMultas
};