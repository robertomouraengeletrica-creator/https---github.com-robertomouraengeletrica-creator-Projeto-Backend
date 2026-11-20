
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {

  const authorization = req.headers.authorization;

  // Verificar se o cabeçalho existe
  if (!authorization) {
    return res.status(401).json({
      message: 'Token não informado'
    });
  }

  // Separar Bearer e token
  const parts = authorization.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      message: 'Formato de token inválido'
    });
  }

  const token = parts[1];

  try {

    // Validar assinatura e expiração
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Disponibilizar o ID do usuário
    req.user = {
      id: decoded.id
    };

    // Permitir que a requisição continue
    return next();

  } catch (error) {

    return res.status(401).json({
      message: 'Token inválido ou expirado'
    });

  }
}

module.exports = authMiddleware;
