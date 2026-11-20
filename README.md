# Projeto Back-end — API de E-commerce

API REST para gerenciamento de **usuários**, **categorias** e **produtos** (com imagens, opções e categorias), com autenticação JWT.

**Auto**

José Roberto Sabino de Moura

## Tecnologias

Node.js · Express · MySQL · Sequelize (ORM + migrations) · JWT · bcrypt · Joi (validação) · Swagger UI · Jest + Supertest

## Pré-requisitos

- Node.js 18 ou superior
- MySQL 8 em execução

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env com os dados do seu MySQL e defina um JWT_SECRET 

PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=activemove
DB_USER=root
DB_PASSWORD=SUA_SENHA_MYSQL

JWT_SECRET=crie_uma_chave_secreta_forte

# 3. Criar o banco
CREATE DATABASE activemove
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

# 4. Iniciar
npm run dev      # desenvolvimento (nodemon)
npm start        # produção
```

A API sobe em `http://localhost:3000` 

### Testes

```bash
npx jest tests/catergory.test.js --runInBand
npx jest tests/models.test.js --runInBand
npx jest tests/product.test.js --runInBand
npx jest tests/user.test.js --runInBand
npx jest tests/app.test.js --runInBand
npm test -- --runInBand  # roda todos os testes.
```

## Estrutura

projeto-backend/
│
├── src/
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │   ├── UserController.js
│   │   ├── CategoryController.js
│   │   └── ProductController.js
│   │
│   ├── middleware/
│   │   └── AuthMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── ProductImage.js
│   │   ├── ProductOption.js
│   │   ├── ProductCategory.js
│   │   └── index.js
│   │
│   ├── routes/
│   │   ├── UserRoutes.js
│   │   ├── CategoryRoutes.js
│   │   └── ProductRoutes.js
│   │
│   ├── services/
│   │   ├── UserService.js
│   │   ├── CategoryService.js
│   │   └── ProductService.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── models.test.js
│   ├── user.test.js
│   ├── category.test.js
│   └── product.test.js
│
├── .env
├── .gitignore
└── package.json



## Endpoints

Método   | Endpoint             |Descrição
GET      |/v1/category/search   |Pesquisa categorias
GET      |/v1/category/:id      |Consulta categoria
POST     |/v1/category          |Cadastra categoria
PUT      |/v1/category/:id      |Atualiza categoria
DELETE   |/v1/category/:id      |Exclui categoria

