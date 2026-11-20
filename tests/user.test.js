
process.env.JWT_SECRET = 'chave_de_teste_com_mais_de_32_caracteres';

jest.mock('../src/services/UserService');

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const UserService = require('../src/services/UserService');

// Cria um token para simular um usuário autenticado
const token = jwt.sign(
  { id: 1 },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

describe('API de usuários', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TESTE 1 - Cadastro
  test('Deve cadastrar um usuário', async () => {

    UserService.createUser.mockResolvedValue({
      id: 1,
      firstname: 'Roberto',
      surname: 'Moura',
      email: 'roberto@email.com'
    });

    const response = await request(app)
      .post('/v1/user')
      .send({
        firstname: 'Roberto',
        surname: 'Moura',
        email: 'roberto@email.com',
        password: 'Senha123456',
        confirmPassword: 'Senha123456'
      });

    expect(response.status).toBe(201);

    expect(response.body.email).toBe('roberto@email.com');

    expect(response.body.password).toBeUndefined();

  });

  // TESTE 2 - Validar campos
  test('Não deve cadastrar usuário sem nome', async () => {

    const response = await request(app)
      .post('/v1/user')
      .send({
        surname: 'Moura',
        email: 'roberto@email.com',
        password: 'Senha123456',
        confirmPassword: 'Senha123456'
      });

    expect(response.status).toBe(400);

    expect(UserService.createUser).not.toHaveBeenCalled();

  });

  // TESTE 3 - Consultar usuário
  test('Deve consultar usuário pelo ID', async () => {

    UserService.getUserById.mockResolvedValue({
      id: 1,
      firstname: 'Roberto',
      email: 'roberto@email.com'
    });

    const response = await request(app)
      .get('/v1/user/1');

    expect(response.status).toBe(200);

    expect(response.body.id).toBe(1);

  });

  // TESTE 4 - Usuário inexistente
  test('Deve retornar 404 quando usuário não existir', async () => {

    UserService.getUserById.mockRejectedValue({
      status: 404,
      message: 'Usuário não encontrado'
    });

    const response = await request(app)
      .get('/v1/user/999');

    expect(response.status).toBe(404);

  });

  // TESTE 5 - Atualização sem token
  test('Não deve permitir atualização sem autenticação', async () => {

    const response = await request(app)
      .put('/v1/user/1')
      .send({
        firstname: 'Roberto'
      });

    expect(response.status).toBe(401);

  });

  // TESTE 6 - Atualização autenticada
  test('Deve permitir atualização da própria conta', async () => {

    UserService.updateUser.mockResolvedValue({
      id: 1,
      firstname: 'Roberto Atualizado',
      email: 'roberto@email.com'
    });

    const response = await request(app)
      .put('/v1/user/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstname: 'Roberto Atualizado'
      });

    expect(response.status).toBe(200);

    expect(response.body.firstname).toBe('Roberto Atualizado');

  });

  // TESTE 7 - Impedir alteração de outra conta
  test('Não deve permitir alterar conta de outro usuário', async () => {

    const response = await request(app)
      .put('/v1/user/2')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstname: 'Outro Nome'
      });

    expect(response.status).toBe(403);

    expect(UserService.updateUser).not.toHaveBeenCalled();

  });

  // TESTE 8 - Exclusão
  test('Deve permitir excluir a própria conta', async () => {

    UserService.deleteUser.mockResolvedValue(true);

    const response = await request(app)
      .delete('/v1/user/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

  });

  // TESTE 9 - Login
  test('Deve autenticar um usuário', async () => {

    UserService.authenticateUser.mockResolvedValue({
      user: {
        id: 1,
        firstname: 'Roberto',
        email: 'roberto@email.com'
      },
      token: 'token-de-teste'
    });

    const response = await request(app)
      .post('/v1/user/token')
      .send({
        email: 'roberto@email.com',
        password: 'Senha123456'
      });

    expect(response.status).toBe(200);

    expect(response.body.token).toBeDefined();

  });

});
