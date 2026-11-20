
process.env.JWT_SECRET = 'chave_de_teste_com_mais_de_32_caracteres';

jest.mock('../src/services/ProductService');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const ProductService = require('../src/services/ProductService');

const token = jwt.sign(
  { id: 1 },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const productMock = {
  id: 1,
  name: 'Kit Energia Solar',
  slug: 'kit-energia-solar',
  price: 2500,
  price_with_discount: 2300,
  stock: 15,
  images: [],
  options: [],
  categories: []
};

describe('Product API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Cadastrar produto
  test('deve cadastrar um produto', async () => {
    ProductService.createProduct.mockResolvedValue(productMock);

    const response = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Kit Energia Solar',
        price: 2500
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Kit Energia Solar');
  });

  // 2. Impedir cadastro sem token
  test('não deve cadastrar produto sem token', async () => {
    const response = await request(app)
      .post('/v1/product')
      .send({
        name: 'Kit Energia Solar',
        price: 2500
      });

    expect(response.status).toBe(401);
    expect(ProductService.createProduct).not.toHaveBeenCalled();
  });

  // 3. Validar nome obrigatório
  test('deve rejeitar produto sem nome', async () => {
    const response = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        price: 2500
      });

    expect(response.status).toBe(400);
  });

  // 4. Validar preço
  test('deve rejeitar preço inválido', async () => {
    const response = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Produto de teste',
        price: -100
      });

    expect(response.status).toBe(400);
  });

  // 5. Listar produtos
  test('deve listar produtos', async () => {
    ProductService.searchProducts.mockResolvedValue({
      data: [productMock],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });

    const response = await request(app)
      .get('/v1/product/search');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  // 6. Aplicar filtros
  test('deve pesquisar com filtros', async () => {
    ProductService.searchProducts.mockResolvedValue({
      data: [productMock],
      pagination: {
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1
      }
    });

    const response = await request(app)
      .get('/v1/product/search')
      .query({
        name: 'solar',
        category_id: 1,
        price_min: 1000,
        price_max: 3000,
        page: 1,
        limit: 5
      });

    expect(response.status).toBe(200);

    expect(ProductService.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'solar',
        category_id: 1,
        price_min: 1000,
        price_max: 3000,
        page: 1,
        limit: 5
      })
    );
  });

  // 7. Validar filtro de preço
  test('deve rejeitar preço mínimo maior que o máximo', async () => {
    const response = await request(app)
      .get('/v1/product/search?price_min=3000&price_max=1000');

    expect(response.status).toBe(400);
  });

  // 8. Consultar produto
  test('deve consultar produto por ID', async () => {
    ProductService.getProductById.mockResolvedValue(productMock);

    const response = await request(app)
      .get('/v1/product/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  // 9. Validar ID
  test('deve rejeitar ID inválido', async () => {
    const response = await request(app)
      .get('/v1/product/abc');

    expect(response.status).toBe(400);
  });

  // 10. Atualizar produto
  test('deve atualizar produto autenticado', async () => {
    ProductService.updateProduct.mockResolvedValue({
      ...productMock,
      name: 'Kit Solar Atualizado'
    });

    const response = await request(app)
      .put('/v1/product/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Kit Solar Atualizado'
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Kit Solar Atualizado');
  });

  // 11. Impedir atualização sem token
  test('não deve atualizar sem token', async () => {
    const response = await request(app)
      .put('/v1/product/1')
      .send({
        name: 'Produto atualizado'
      });

    expect(response.status).toBe(401);
    expect(ProductService.updateProduct).not.toHaveBeenCalled();
  });

  // 12. Excluir produto
  test('deve excluir produto autenticado', async () => {
    ProductService.deleteProduct.mockResolvedValue(true);

    const response = await request(app)
      .delete('/v1/product/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(ProductService.deleteProduct).toHaveBeenCalledWith(1);
  });

  // 13. Impedir exclusão sem token
  test('não deve excluir sem token', async () => {
    const response = await request(app)
      .delete('/v1/product/1');

    expect(response.status).toBe(401);
    expect(ProductService.deleteProduct).not.toHaveBeenCalled();
  });
});
