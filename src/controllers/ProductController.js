
const ProductService = require('../services/ProductService');

// Tratamento de erros
function handleError(res, error) {
  console.error(error);

  if (
    error.name === 'SequelizeUniqueConstraintError' ||
    error.name === 'SequelizeForeignKeyConstraintError'
  ) {
    return res.status(409).json({
      message: 'Conflito nos dados do produto'
    });
  }

  const status = error.status || 500;

  return res.status(status).json({
    message: status === 500
      ? 'Erro interno do servidor'
      : error.message
  });
}

// Converte texto em boolean
function parseBoolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

// Valida ID
function validateId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// Valida dados principais do produto
function validateProductData(data, isUpdate = false) {
  if (!isUpdate) {
    if (
      typeof data.name !== 'string' ||
      !data.name.trim()
    ) {
      return 'O nome do produto é obrigatório';
    }

    if (
      data.price === undefined ||
      typeof data.price !== 'number' ||
      !Number.isFinite(data.price) ||
      data.price < 0
    ) {
      return 'Informe um preço válido';
    }
  }

  if (
    data.name !== undefined &&
    (
      typeof data.name !== 'string' ||
      !data.name.trim() ||
      data.name.trim().length > 255
    )
  ) {
    return 'O nome deve ter entre 1 e 255 caracteres';
  }

  if (
    data.slug !== undefined &&
    (
      typeof data.slug !== 'string' ||
      !data.slug.trim()
    )
  ) {
    return 'O slug deve ser um texto válido';
  }

  if (
    data.description !== undefined &&
    typeof data.description !== 'string'
  ) {
    return 'A descrição deve ser um texto';
  }

  if (
    data.price !== undefined &&
    (
      typeof data.price !== 'number' ||
      !Number.isFinite(data.price) ||
      data.price < 0
    )
  ) {
    return 'O preço deve ser um número maior ou igual a zero';
  }

  if (
    data.price_with_discount !== undefined &&
    (
      typeof data.price_with_discount !== 'number' ||
      !Number.isFinite(data.price_with_discount) ||
      data.price_with_discount < 0
    )
  ) {
    return 'O preço com desconto deve ser válido';
  }

  if (
    data.price !== undefined &&
    data.price_with_discount !== undefined &&
    data.price_with_discount > data.price
  ) {
    return 'O preço com desconto não pode ser maior que o preço original';
  }

  if (
    data.stock !== undefined &&
    (
      !Number.isInteger(data.stock) ||
      data.stock < 0
    )
  ) {
    return 'O estoque deve ser um número inteiro maior ou igual a zero';
  }

  for (const field of ['enabled', 'use_in_menu']) {
    if (
      data[field] !== undefined &&
      typeof data[field] !== 'boolean'
    ) {
      return `${field} deve ser true ou false`;
    }
  }

  // Validação das imagens
  if (data.images !== undefined) {
    if (!Array.isArray(data.images)) {
      return 'images deve ser uma lista';
    }

    for (const image of data.images) {
      if (
        !image ||
        typeof image.path !== 'string' ||
        !image.path.trim()
      ) {
        return 'Cada imagem precisa possuir um path válido';
      }

      if (
        image.enabled !== undefined &&
        typeof image.enabled !== 'boolean'
      ) {
        return 'O campo enabled da imagem deve ser true ou false';
      }
    }
  }

  // Validação das opções
  if (data.options !== undefined) {
    if (!Array.isArray(data.options)) {
      return 'options deve ser uma lista';
    }

    for (const option of data.options) {
      if (
        !option ||
        typeof option.title !== 'string' ||
        !option.title.trim()
      ) {
        return 'Cada opção precisa possuir um título';
      }

      if (!['square', 'circle'].includes(option.shape)) {
        return 'O formato da opção deve ser square ou circle';
      }

      if (!['text', 'color'].includes(option.type)) {
        return 'O tipo da opção deve ser text ou color';
      }

      if (
        option.radius !== undefined &&
        (
          typeof option.radius !== 'number' ||
          option.radius < 0
        )
      ) {
        return 'O raio da opção deve ser um número não negativo';
      }

      if (
        !Array.isArray(option.values) &&
        typeof option.values !== 'string'
      ) {
        return 'Os valores da opção devem ser uma lista ou texto';
      }
    }
  }

  // Validação das categorias
  if (data.category_ids !== undefined) {
    if (!Array.isArray(data.category_ids)) {
      return 'category_ids deve ser uma lista';
    }

    if (
      data.category_ids.some(
        id => !Number.isInteger(id) || id <= 0
      )
    ) {
      return 'Existem IDs de categorias inválidos';
    }
  }

  return null;
}

// Cadastrar produto
async function create(req, res) {
  try {
    const validationError = validateProductData(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const product = await ProductService.createProduct(req.body);

    return res.status(201).json(product);
  } catch (error) {
    return handleError(res, error);
  }
}

// Listar e filtrar produtos
async function search(req, res) {
  try {
    const {
      name,
      category_id,
      enabled,
      use_in_menu,
      price_min,
      price_max,
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
        message: 'Página inválida'
      });
    }

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        message: 'O limite deve ser entre 1 e 100'
      });
    }

    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({
        message: 'O nome deve ser um texto'
      });
    }

    let parsedEnabled;
    let parsedUseInMenu;

    if (enabled !== undefined) {
      parsedEnabled = parseBoolean(enabled);

      if (parsedEnabled === null) {
        return res.status(400).json({
          message: 'enabled deve ser true ou false'
        });
      }
    }

    if (use_in_menu !== undefined) {
      parsedUseInMenu = parseBoolean(use_in_menu);

      if (parsedUseInMenu === null) {
        return res.status(400).json({
          message: 'use_in_menu deve ser true ou false'
        });
      }
    }

    let parsedCategoryId;

    if (category_id !== undefined) {
      parsedCategoryId = validateId(category_id);

      if (!parsedCategoryId) {
        return res.status(400).json({
          message: 'ID da categoria inválido'
        });
      }
    }

    const parsedPriceMin = price_min === undefined
      ? undefined
      : Number(price_min);

    const parsedPriceMax = price_max === undefined
      ? undefined
      : Number(price_max);

    if (
      (parsedPriceMin !== undefined &&
        (!Number.isFinite(parsedPriceMin) || parsedPriceMin < 0)) ||
      (parsedPriceMax !== undefined &&
        (!Number.isFinite(parsedPriceMax) || parsedPriceMax < 0))
    ) {
      return res.status(400).json({
        message: 'Os filtros de preço devem ser números não negativos'
      });
    }

    if (
      parsedPriceMin !== undefined &&
      parsedPriceMax !== undefined &&
      parsedPriceMin > parsedPriceMax
    ) {
      return res.status(400).json({
        message: 'O preço mínimo não pode ser maior que o máximo'
      });
    }

    const allowedSort = [
      'id',
      'name',
      'price',
      'stock',
      'createdAt'
    ];

    if (!allowedSort.includes(sort)) {
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

    const result = await ProductService.searchProducts({
      name: name?.trim(),
      category_id: parsedCategoryId,
      enabled: parsedEnabled,
      use_in_menu: parsedUseInMenu,
      price_min: parsedPriceMin,
      price_max: parsedPriceMax,
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

// Consultar produto por ID
async function findById(req, res) {
  try {
    const id = validateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const product = await ProductService.getProductById(id);

    return res.status(200).json(product);
  } catch (error) {
    return handleError(res, error);
  }
}

// Atualizar produto
async function update(req, res) {
  try {
    const id = validateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const validationError = validateProductData(req.body, true);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const allowedFields = [
      'enabled',
      'name',
      'slug',
      'use_in_menu',
      'stock',
      'description',
      'price',
      'price_with_discount',
      'images',
      'options',
      'category_ids'
    ];

    const hasAllowedField = allowedFields.some(
      field => req.body[field] !== undefined
    );

    if (!hasAllowedField) {
      return res.status(400).json({
        message: 'Informe pelo menos um campo para atualizar'
      });
    }

    const product = await ProductService.updateProduct(
      id,
      req.body
    );

    return res.status(200).json(product);
  } catch (error) {
    return handleError(res, error);
  }
}

// Excluir produto
async function remove(req, res) {
  try {
    const id = validateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    await ProductService.deleteProduct(id);

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
