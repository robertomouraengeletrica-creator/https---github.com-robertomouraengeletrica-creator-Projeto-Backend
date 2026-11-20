
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { User } = require('../models');

// Função para criar erros com status HTTP
function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Remove a senha das respostas
function safeUser(user) {
  const data = user.toJSON();

  delete data.password;

  return data;
}

// CADASTRAR USUÁRIO
async function createUser(data) {

  const existingUser = await User.findOne({
    where: { email: data.email }
  });

  if (existingUser) {
    throw createError('E-mail já cadastrado', 409);
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await User.create({
    firstname: data.firstname,
    surname: data.surname,
    email: data.email,
    password: hashedPassword
  });

  return safeUser(user);
}

// CONSULTAR USUÁRIO
async function getUserById(id) {

  const user = await User.findByPk(id);

  if (!user) {
    throw createError('Usuário não encontrado', 404);
  }

  return safeUser(user);
}

// ATUALIZAR USUÁRIO
async function updateUser(id, data) {

  const user = await User.findByPk(id);

  if (!user) {
    throw createError('Usuário não encontrado', 404);
  }

  if (data.email && data.email !== user.email) {

    const existingUser = await User.findOne({
      where: { email: data.email }
    });

    if (existingUser) {
      throw createError('E-mail já cadastrado', 409);
    }
  }

  const updateData = {
    firstname: data.firstname,
    surname: data.surname,
    email: data.email
  };

  // Só altera a senha quando uma nova senha for enviada
  if (data.password) {
    updateData.password = await bcrypt.hash(
      data.password,
      10
    );
  }

  // Remove campos que não foram enviados
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  await user.update(updateData);

  return safeUser(user);
}

// EXCLUIR USUÁRIO
async function deleteUser(id) {

  const user = await User.findByPk(id);

  if (!user) {
    throw createError('Usuário não encontrado', 404);
  }

  await user.destroy();

  return true;
}

// LOGIN
async function authenticateUser(email, password) {

  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    throw createError('E-mail ou senha inválidos', 401);
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw createError('E-mail ou senha inválidos', 401);
  }

  if (!process.env.JWT_SECRET) {
    throw createError('Configuração de autenticação ausente', 500);
  }

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    user: safeUser(user),
    token
  };
}

module.exports = {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  authenticateUser
};
