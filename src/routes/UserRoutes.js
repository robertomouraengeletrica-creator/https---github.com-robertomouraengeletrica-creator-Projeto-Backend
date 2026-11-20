
const express = require('express');

const UserController = require('../controllers/UserController');

const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

// Login
router.post('/token', UserController.login);

// Cadastro
router.post('/', UserController.create);

// Consulta por ID
router.get('/:id', UserController.findById);

// Atualização protegida
router.put('/:id', authMiddleware, UserController.update);

// Exclusão protegida
router.delete('/:id', authMiddleware, UserController.remove);

module.exports = router;
