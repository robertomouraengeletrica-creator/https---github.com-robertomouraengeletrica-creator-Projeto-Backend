
const express = require('express');
const cors = require('cors');

const UserRoutes = require('./routes/UserRoutes');
const CategoryRoutes = require('./routes/CategoryRoutes');
const ProductRoutes = require('./routes/ProductRoutes');


const app = express();

app.use(cors());


app.use(express.json());

// Rota inicial
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'ActiveMove API funcionando!'
  });
});

// Verificação da API
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando corretamente'
  });
});

// Rotas de usuários
app.use('/v1/user', UserRoutes);
app.use('/v1/category', CategoryRoutes);
app.use('/v1/product', ProductRoutes);


module.exports = app;
