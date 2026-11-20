
const express = require('express');

const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

// Rotas públicas
router.get('/search', ProductController.search);
router.get('/:id', ProductController.findById);

// Rotas protegidas
router.post('/', authMiddleware, ProductController.create);
router.put('/:id', authMiddleware, ProductController.update);
router.delete('/:id', authMiddleware, ProductController.remove);

module.exports = router;
