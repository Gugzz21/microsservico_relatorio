const ctrl = require('../controllers/relatorios.controller');

function relatorioRoutes(server) {
    // Endpoints Centrais de Relatórios
    server.post('/', ctrl.criar);
    server.get('/', ctrl.listar);
    server.get('/:id', ctrl.buscarPorId);
    server.del('/:id', ctrl.deletar);
    server.patch('/:id/status', ctrl.alterarStatus);
    server.del('/limpar-antigos', ctrl.limparAntigos);
    server.get('/exportar/csv', ctrl.exportarCSV);

    // Endpoints de Livros
    server.post('/livros', ctrl.gerarSnapshotLivro);
    server.get('/livros', ctrl.listarSnapshotLivros);
    server.get('/livros/:id', ctrl.buscarSnapshotLivroId);
    server.get('/livros/top', ctrl.topLivrosLidos);

    // Endpoints de Usuários
    server.post('/usuarios', ctrl.gerarSnapshotUsuario);
    server.get('/usuarios', ctrl.listarSnapshotUsuarios);
    server.get('/usuarios/:id', ctrl.buscarSnapshotUsuarioId);
    server.get('/usuarios/inadimplentes', ctrl.usuariosInadimplentes);

    // Endpoints de Empréstimos
    server.post('/emprestimos', ctrl.gerarSnapshotEmprestimo);
    server.get('/emprestimos', ctrl.listarSnapshotEmprestimos);
    server.get('/emprestimos/:id', ctrl.buscarSnapshotEmprestimoId);

    // Dashboards e Financeiro
    server.get('/dashboard/kpis', ctrl.dashboardKpis);
    server.get('/financeiro/multas-total', ctrl.totalMultas);
}

module.exports = relatorioRoutes;