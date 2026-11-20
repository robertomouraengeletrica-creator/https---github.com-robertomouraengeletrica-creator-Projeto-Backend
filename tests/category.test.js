
process.env.JWT_SECRET = 'chave_de_teste_com_mais_de_32_caracteres';

jest.mock('../src/services/CategoryService');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const CategoryService = require('../src/services/CategoryService');

const token = jwt.sign(
  { id: 1 },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const categoryMock = {
  id: 1,
  name: 'Energia Solar',
  slug: 'energia-solar',
  use_in_menu: true
};

describe('Category API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Cadastrar categoria
  test('deve cadastrar uma categoria', async () => {
    CategoryService.createCategory.mockResolvedValue(categoryMock);

    const response = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Energia Solar',
        use_in_menu: true
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Energia Solar');
  });

  // 2. Impedir cadastro sem autenticação
  test('não deve cadastrar categoria sem token', async () => {
    const response = await request(app)
      .post('/v1/category')
      .send({
        name: 'Energia Solar'
      });

    expect(response.status).toBe(401);
    expect(CategoryService.createCategory).not.toHaveBeenCalled();
  });

  // 3. Validar nome obrigatório
  test('deve rejeitar categoria sem nome', async () => {
    const response = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({
        use_in_menu: true
      });

    expect(response.status).toBe(400);
  });

  // 4. Listar categorias
  test('deve listar categorias', async () => {
    CategoryService.searchCategories.mockResolvedValue({
      data: [categoryMock],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });

    const response = await request(app)
      .get('/v1/category/search');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  // 5. Aplicar filtros e paginação
  test('deve receber filtros e paginação', async () => {
    CategoryService.searchCategories.mockResolvedValue({
      data: [categoryMock],
      pagination: {
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1
      }
    });

    const response = await request(app)
      .get('/v1/category/search')
      .query({
        name: 'solar',
        use_in_menu: 'true',
        page: 2,
        limit: 5
      });

    expect(response.status).toBe(200);

    expect(CategoryService.searchCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'solar',
        use_in_menu: true,
        page: 2,
        limit: 5
      })
    );
  });

  // 6. Validar paginação inválida
  test('deve rejeitar página inválida', async () => {
    const response = await request(app)
      .get('/v1/category/search?page=0');

    expect(response.status).toBe(400);
  });

  // 7. Consultar categoria por ID
  test('deve consultar uma categoria pelo ID', async () => {
    CategoryService.getCategoryById.mockResolvedValue(categoryMock);

    const response = await request(app)
      .get('/v1/category/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  // 8. Atualizar categoria
  test('deve atualizar uma categoria autenticada', async () => {
    CategoryService.updateCategory.mockResolvedValue({
      ...categoryMock,
      name: 'Energia Fotovoltaica'
    });

    const response = await request(app)
      .put('/v1/category/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Energia Fotovoltaica'
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Energia Fotovoltaica');
  });

  // 9. Impedir atualização sem token
  test('não deve atualizar categoria sem token', async () => {
    const response = await request(app)
      .put('/v1/category/1')
      .send({
        name: 'Nova categoria'
      });

    expect(response.status).toBe(401);
    expect(CategoryService.updateCategory).not.toHaveBeenCalled();
  });

  // 10. Excluir categoria
  test('deve excluir uma categoria autenticada', async () => {
    CategoryService.deleteCategory.mockResolvedValue(true);

    const response = await request(app)
      .delete('/v1/category/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(CategoryService.deleteCategory).toHaveBeenCalledWith(1);
  });

  // 11. Impedir exclusão sem token
  test('não deve excluir categoria sem token', async () => {
    const response = await request(app)
      .delete('/v1/category/1');

    expect(response.status).toBe(401);
    expect(CategoryService.deleteCategory).not.toHaveBeenCalled();
  });
});
