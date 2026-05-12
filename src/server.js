const restify = require('restify');
require('dotenv').config();

const server = restify.createServer({
    name: 'microsservico_relatorio'
});

server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// Registrando rotas
const relatorioRoutes = require('./routes/relatorio.routes');
relatorioRoutes(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
