
const CategoryService = require('../services/CategoryService');

// Tratamento padronizado de erros
function handleError(res, error) {
  console.error(error);

  if (
    error.name === 'SequelizeUniqueConstraintError' ||
    error.name === 'SequelizeForeignKeyConstraintError'
  ) {
    return res.status(409).json({
      message: 'Não foi possível concluir a operação por conflito nos dados'
    });
  }

  const status = error.status || 500;

  return res.status(status).json({
    message: status === 500
      ? 'Erro interno do servidor'
      : error.message
  });
}

// Converte parâmetros true/false recebidos pela URL
function parseBoolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

// Validar ID
function validateId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

// Cadastrar categoria
async function create(req, res) {
  try {
    const { name, slug, use_in_menu } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        message: 'O nome da categoria é obrigatório'
      });
    }

    if (name.trim().length > 255) {
      return res.status(400).json({
        message: 'O nome deve ter no máximo 255 caracteres'
      });
    }

    if (slug !== undefined &&
        (typeof slug !== 'string' || !slug.trim())) {
      return res.status(400).json({
        message: 'O slug deve ser um texto válido'
      });
    }

    if (use_in_menu !== undefined &&
        typeof use_in_menu !== 'boolean') {
      return res.status(400).json({
        message: 'use_in_menu deve ser true ou false'
      });
    }

    const category = await CategoryService.createCategory({
      name: name.trim(),
      slug,
      use_in_menu
    });

    return res.status(201).json(category);
  } catch (error) {
    return handleError(res, error);
  }
}

// Listar e filtrar categorias
async function search(req, res) {
  try {
    const {
      name,
      use_in_menu,
      page = '1',
      limit = '10',
      sort = 'id',
      order = 'DESC'
    } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedPage) ||
      parsedPage < 1
    ) {
      return res.status(400).json({
        message: 'A página deve ser um número inteiro maior que zero'
      });
    }

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        message: 'O limite deve ser um número entre 1 e 100'
      });
    }

    let parsedUseInMenu;

    if (use_in_menu !== undefined) {
      parsedUseInMenu = parseBoolean(use_in_menu);

      if (parsedUseInMenu === null) {
        return res.status(400).json({
          message: 'use_in_menu deve ser true ou false'
        });
      }
    }

    const allowedSortFields = ['id', 'name', 'createdAt'];

    if (!allowedSortFields.includes(sort)) {
      return res.status(400).json({
        message: 'Campo de ordenação inválido'
      });
    }

    const normalizedOrder = order.toUpperCase();

    if (!['ASC', 'DESC'].includes(normalizedOrder)) {
      return res.status(400).json({
        message: 'A ordenação deve ser ASC ou DESC'
      });
    }

    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({
        message: 'O filtro name deve ser um texto'
      });
    }

    const result = await CategoryService.searchCategories({
      name: name?.trim(),
      use_in_menu: parsedUseInMenu,
      page: parsedPage,
      limit: parsedLimit,
      sort,
      order: normalizedOrder
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// Consultar categoria pelo ID
async function findById(req, res) {
  try {
    const id = validateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const category = await CategoryService.getCategoryById(id);

    return res.status(200).json(category);
  } catch (error) {
    return handleError(res, error);
  }
}

// Atualizar categoria
async function update(req, res) {
  try {
    const id = validateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const { name, slug, use_in_menu } = req.body;

    const hasAllowedField =
      name !== undefined ||
      slug !== undefined ||
      use_in_menu !== undefined;

    if (!hasAllowedField) {
      return res.status(400).json({
        message: 'Informe pelo menos um campo para atualizar'
      });
    }

    if (name !== undefined &&
        (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({
        message: 'O nome deve ser um texto válido'
      });
    }

    if (name !== undefined && name.trim().length > 255) {
      return res.status(400).json({
        message: 'O nome deve ter no máximo 255 caracteres'
      });
    }

    if (slug !== undefined &&
        (typeof slug !== 'string' || !slug.trim())) {
      return res.status(400).json({
        message: 'O slug deve ser um texto válido'
      });
    }

    if (use_in_menu !== undefined &&
        typeof use_in_menu !== 'boolean') {
      return res.status(400).json({
        message: 'use_in_menu deve ser true ou false'
      });
    }

    const category = await CategoryService.updateCategory(id, {
      name,
      slug,
      use_in_menu
    });

    return res.status(200).json(category);
  } catch (error) {
    return handleError(res, error);
  }
}

// Excluir categoria
async function remove(req, res) {
  try {
    const id = validateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    await CategoryService.deleteCategory(id);

    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  create,
  search,
  findById,
  update,
  remove
};
