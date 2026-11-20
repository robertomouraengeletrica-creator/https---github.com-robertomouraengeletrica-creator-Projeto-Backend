
const UserService = require('../services/UserService');

// Função auxiliar para tratar erros
function handleError(res, error) {
  console.error(error);

  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : 'Erro interno do servidor'
  });
}

// CADASTRAR USUÁRIO
async function create(req, res) {
  try {
    const {
      firstname,
      surname,
      email,
      password,
      confirmPassword
    } = req.body;

    // Validar campos obrigatórios
    if (
      !firstname ||
      !surname ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'E-mail inválido'
      });
    }

    // Validar senha
    if (password.length < 8) {
      return res.status(400).json({
        message: 'A senha deve possuir pelo menos 8 caracteres'
      });
    }

    // Confirmar senha
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'As senhas não conferem'
      });
    }

    const user = await UserService.createUser({
      firstname: firstname.trim(),
      surname: surname.trim(),
      email: email.trim().toLowerCase(),
      password
    });

    return res.status(201).json(user);

  } catch (error) {
    return handleError(res, error);
  }
}

// CONSULTAR USUÁRIO
async function findById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const user = await UserService.getUserById(id);

    return res.status(200).json(user);

  } catch (error) {
    return handleError(res, error);
  }
}

// ATUALIZAR USUÁRIO
async function update(req, res) {
  try {
    const id = Number(req.params.id);

    if (req.user.id !== id) {
      return res.status(403).json({
        message: 'Você não pode alterar outra conta'
      });
    }

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }
    

    const {
      firstname,
      surname,
      email,
      password,
      confirmPassword
    } = req.body;

    // Não permitir atualização sem dados
    if (
      firstname === undefined &&
      surname === undefined &&
      email === undefined &&
      password === undefined
    ) {
      return res.status(400).json({
        message: 'Informe pelo menos um campo para atualizar'
      });
    }

    // Verificar se a senha foi informada
    if (password !== undefined) {

      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
          message: 'A senha deve possuir pelo menos 8 caracteres'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message: 'As senhas não conferem'
        });
      }
    }

    if (firstname !== undefined &&
        (typeof firstname !== 'string' || !firstname.trim())) {
      return res.status(400).json({
        message: 'Nome inválido'
      });
    }

    if (surname !== undefined &&
        (typeof surname !== 'string' || !surname.trim())) {
      return res.status(400).json({
        message: 'Sobrenome inválido'
      });
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return res.status(400).json({
          message: 'E-mail inválido'
        });
      }
    }

    const updatedUser = await UserService.updateUser(id, {
      firstname: firstname === undefined ? undefined : firstname.trim(),
      surname: surname === undefined ? undefined : surname.trim(),
      email: email === undefined ? undefined : email.trim().toLowerCase(),
      password
    });

    return res.status(200).json(updatedUser);

  } catch (error) {
    return handleError(res, error);
  }
}

// EXCLUIR USUÁRIO
async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (req.user.id !== id) {
      return res.status(403).json({
        message: 'Você não pode excluir outra conta'
      });
    }

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    await UserService.deleteUser(id);

    return res.status(204).send();

  } catch (error) {
    return handleError(res, error);
  }
}

// LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'E-mail e senha são obrigatórios'
      });
    }

    const result = await UserService.authenticateUser(
      email.trim().toLowerCase(),
      password
    );

    return res.status(200).json(result);

  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  create,
  findById,
  update,
  remove,
  login
};
