const service = require('../services/relatorio.service');

async function gerarSnapshotLivro(req, res) {
    const data = await service.gerarSnapshotLivro(req.body);
    res.send(201, { success: true, data });
}

async function dashboardKpis(req, res) {
    const data = await service.dashboardKpis();
    res.send(200, { success: true, data });
}

async function topLivrosLidos(req, res) {
    const data = await service.topLivrosLidos();
    res.send(200, { success: true, data });
}

async function usuariosInadimplentes(req, res) {
    const data = await service.usuariosInadimplentes();
    res.send(200, { success: true, data });
}

async function criar(req, res) {
    const data = await service.criar(req.body);
    res.send(201, { success: true, data });
}

async function listar(req, res) {
    const data = await service.listar();
    res.send(200, { success: true, data });
}

async function buscarPorId(req, res) {
    const data = await service.buscarPorId(req.params.id);
    res.send(200, { success: true, data });
}

async function deletar(req, res) {
    await service.deletar(req.params.id);
    res.send(204);
}

async function alterarStatus(req, res) {
    const data = await service.alterarStatus(req.params.id, req.body);
    res.send(200, { success: true, data });
}

async function limparAntigos(req, res) {
    const data = await service.limparAntigos();
    res.send(200, { success: true, data });
}

async function exportarCSV(req, res) {
    const data = await service.exportarCSV();
    res.send(200, { success: true, data });
}

async function listarSnapshotLivros(req, res) {
    const data = await service.listarSnapshotLivros();
    res.send(200, { success: true, data });
}

async function buscarSnapshotLivroId(req, res) {
    const data = await service.buscarSnapshotLivroId(req.params.id);
    res.send(200, { success: true, data });
}

async function gerarSnapshotUsuario(req, res) {
    const data = await service.gerarSnapshotUsuario(req.body);
    res.send(201, { success: true, data });
}

async function listarSnapshotUsuarios(req, res) {
    const data = await service.listarSnapshotUsuarios();
    res.send(200, { success: true, data });
}

async function buscarSnapshotUsuarioId(req, res) {
    const data = await service.buscarSnapshotUsuarioId(req.params.id);
    res.send(200, { success: true, data });
}

async function gerarSnapshotEmprestimo(req, res) {
    const data = await service.gerarSnapshotEmprestimo(req.body);
    res.send(201, { success: true, data });
}

async function listarSnapshotEmprestimos(req, res) {
    const data = await service.listarSnapshotEmprestimos();
    res.send(200, { success: true, data });
}

async function buscarSnapshotEmprestimoId(req, res) {
    const data = await service.buscarSnapshotEmprestimoId(req.params.id);
    res.send(200, { success: true, data });
}

async function totalMultas(req, res) {
    const data = await service.totalMultas();
    res.send(200, { success: true, data });
}

module.exports = {
    gerarSnapshotLivro, dashboardKpis, topLivrosLidos, usuariosInadimplentes,
    criar, listar, buscarPorId, deletar, alterarStatus, limparAntigos, exportarCSV,
    listarSnapshotLivros, buscarSnapshotLivroId,
    gerarSnapshotUsuario, listarSnapshotUsuarios, buscarSnapshotUsuarioId,
    gerarSnapshotEmprestimo, listarSnapshotEmprestimos, buscarSnapshotEmprestimoId,
    totalMultas
};
