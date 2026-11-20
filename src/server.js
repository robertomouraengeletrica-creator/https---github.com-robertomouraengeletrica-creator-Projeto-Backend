
require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/database');

// Importa os Models e registra os relacionamentos
require('./models');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Testa a conexão
    await sequelize.authenticate();

    console.log('MySQL conectado com sucesso!');

    // Cria as tabelas que ainda não existem
    await sequelize.sync();

    console.log('Tabelas criadas com sucesso!');

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });

  } catch (error) {
    console.error('Erro ao iniciar aplicação:');
    console.error(error.message);

    process.exit(1);
  }
}

startServer();
