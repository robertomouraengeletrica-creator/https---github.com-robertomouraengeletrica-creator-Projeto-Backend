
const express = require('express');

const CategoryController = require('../controllers/CategoryController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

// Rotas públicas
router.get('/search', CategoryController.search);
router.get('/:id', CategoryController.findById);

// Rotas protegidas por JWT
router.post('/', authMiddleware, CategoryController.create);
router.put('/:id', authMiddleware, CategoryController.update);
router.delete('/:id', authMiddleware, CategoryController.remove);

module.exports = router;
