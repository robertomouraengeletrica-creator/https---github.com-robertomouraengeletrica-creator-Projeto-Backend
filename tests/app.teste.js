const request = require('supertest');
const app = require('../src/app');

describe('Testes da API ActiveMove', () => {

  test('Deve retornar status 200 na rota principal', async () => {

    const response = await request(app).get('/');

    expect(response.status).toBe(200);

    expect(response.body.message).toBe(
      'ActiveMove API funcionando!'
    );

  });

  test('Deve verificar se a API está funcionando', async () => {

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);

    expect(response.body.status).toBe('OK');

  });

});