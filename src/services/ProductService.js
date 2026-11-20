
const { Op } = require('sequelize');

const sequelize = require('../config/database');

const {
  Product,
  ProductImage,
  ProductOption,
  Category,
  ProductCategory
} = require('../models');

// Cria erros com status HTTP
function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Gera slug a partir do nome
function generateSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Converte valores de opções para armazenamento no banco
function serializeOptionValues(values) {
  if (Array.isArray(values)) {
    return JSON.stringify(values);
  }

  return values;
}

// Converte os valores armazenados para o formato da API
function normalizeProduct(product) {
  if (!product) return null;

  const data = product.toJSON();

  if (data.options) {
    data.options = data.options.map(option => {
      if (typeof option.values === 'string') {
        try {
          const parsed = JSON.parse(option.values);

          if (Array.isArray(parsed)) {
            option.values = parsed;
          }
        } catch {
          // Mantém o texto original se não for JSON válido
        }
      }

      return option;
    });
  }

  return data;
}

// Verifica se nome ou slug já estão cadastrados
async function checkDuplicate(name, slug, excludeId = null, transaction = null) {
  const where = {
    [Op.or]: [
      { name },
      { slug }
    ]
  };

  if (excludeId !== null) {
    where.id = { [Op.ne]: excludeId };
  }

  const existing = await Product.findOne({
    where,
    transaction
  });

  if (existing) {
    throw createError(
      'Já existe um produto com esse nome ou slug',
      409
    );
  }
}

// Verifica se todas as categorias informadas existem
async function validateCategories(categoryIds, transaction) {
  if (!Array.isArray(categoryIds)) {
    throw createError('category_ids deve ser uma lista', 400);
  }

  const ids = [...new Set(categoryIds)];

  if (
    ids.some(id => !Number.isInteger(id) || id <= 0)
  ) {
    throw createError('Existem IDs de categorias inválidos', 400);
  }

  const categories = await Category.findAll({
    where: {
      id: { [Op.in]: ids }
    },
    attributes: ['id'],
    transaction
  });

  if (categories.length !== ids.length) {
    throw createError(
      'Uma ou mais categorias informadas não existem',
      400
    );
  }

  return ids;
}

// Prepara imagens para salvar
function prepareImages(images, productId) {
  return images.map(image => ({
    product_id: productId,
    path: image.path.trim(),
    enabled: image.enabled ?? true
  }));
}

// Prepara opções para salvar
function prepareOptions(options, productId) {
  return options.map(option => ({
    product_id: productId,
    title: option.title.trim(),
    shape: option.shape,
    radius: option.radius ?? 0,
    type: option.type,
    values: serializeOptionValues(option.values)
  }));
}

// Consulta um produto com todos os relacionamentos
async function getProductById(id) {
  const product = await Product.findByPk(id, {
    include: [
      {
        model: ProductImage,
        as: 'images'
      },
      {
        model: ProductOption,
        as: 'options'
      },
      {
        model: Category,
        as: 'categories',
        through: { attributes: [] }
      }
    ]
  });

  if (!product) {
    throw createError('Produto não encontrado', 404);
  }

  return normalizeProduct(product);
}

// Cadastrar produto
async function createProduct(data) {
  const productId = await sequelize.transaction(async transaction => {
    const name = data.name.trim();

    const slug = data.slug
      ? generateSlug(data.slug)
      : generateSlug(name);

    await checkDuplicate(name, slug, null, transaction);

    const categoryIds = await validateCategories(
      data.category_ids ?? [],
      transaction
    );

    const product = await Product.create({
      enabled: data.enabled ?? true,
      name,
      slug,
      use_in_menu: data.use_in_menu ?? false,
      stock: data.stock ?? 0,
      description: data.description ?? '',
      price: data.price,
      price_with_discount: data.price_with_discount ?? data.price
    }, { transaction });

    if (data.images?.length) {
      await ProductImage.bulkCreate(
        prepareImages(data.images, product.id),
        { transaction }
      );
    }

    if (data.options?.length) {
      await ProductOption.bulkCreate(
        prepareOptions(data.options, product.id),
        { transaction }
      );
    }

    await product.setCategories(categoryIds, { transaction });

    return product.id;
  });

  return getProductById(productId);
}

// Pesquisar produtos com filtros e paginação
async function searchProducts(filters) {
  const {
    name,
    category_id,
    enabled,
    use_in_menu,
    price_min,
    price_max,
    page,
    limit,
    sort,
    order
  } = filters;

  const where = {};

  if (name) {
    where.name = {
      [Op.like]: `%${name}%`
    };
  }

  if (enabled !== undefined) {
    where.enabled = enabled;
  }

  if (use_in_menu !== undefined) {
    where.use_in_menu = use_in_menu;
  }

  if (price_min !== undefined || price_max !== undefined) {
    where.price = {};

    if (price_min !== undefined) {
      where.price[Op.gte] = price_min;
    }

    if (price_max !== undefined) {
      where.price[Op.lte] = price_max;
    }
  }

  const allowedSortFields = [
    'id',
    'name',
    'price',
    'stock',
    'createdAt'
  ];

  const sortField = allowedSortFields.includes(sort)
    ? sort
    : 'id';

  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  const categoryInclude = {
    model: Category,
    as: 'categories',
    through: { attributes: [] }
  };

  if (category_id !== undefined) {
    categoryInclude.where = { id: category_id };
    categoryInclude.required = true;
  }

  const offset = (page - 1) * limit;

  const result = await Product.findAndCountAll({
    where,
    include: [
      {
        model: ProductImage,
        as: 'images'
      },
      {
        model: ProductOption,
        as: 'options'
      },
      categoryInclude
    ],
    distinct: true,
    order: [[sortField, sortOrder]],
    limit,
    offset
  });

  return {
    data: result.rows.map(normalizeProduct),
    pagination: {
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit)
    }
  };
}

// Atualizar produto
async function updateProduct(id, data) {
  await sequelize.transaction(async transaction => {
    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      throw createError('Produto não encontrado', 404);
    }

    const updateData = {};

    const newName = data.name !== undefined
      ? data.name.trim()
      : product.name;

    const newSlug = data.slug !== undefined
      ? generateSlug(data.slug)
      : data.name !== undefined
        ? generateSlug(newName)
        : product.slug;

    await checkDuplicate(newName, newSlug, id, transaction);

    const scalarFields = [
      'enabled',
      'name',
      'slug',
      'use_in_menu',
      'stock',
      'description',
      'price',
      'price_with_discount'
    ];

    for (const field of scalarFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (data.name !== undefined) {
      updateData.name = newName;
    }

    if (data.name !== undefined || data.slug !== undefined) {
      updateData.slug = newSlug;
    }

    if (
      updateData.price_with_discount !== undefined &&
      updateData.price_with_discount > (
        updateData.price ?? product.price
      )
    ) {
      throw createError(
        'O preço com desconto não pode ser maior que o preço original',
        400
      );
    }

    await product.update(updateData, { transaction });

    // Se images foi enviado, substitui todas as imagens anteriores
    if (data.images !== undefined) {
      await ProductImage.destroy({
        where: { product_id: id },
        transaction
      });

      if (data.images.length) {
        await ProductImage.bulkCreate(
          prepareImages(data.images, id),
          { transaction }
        );
      }
    }

    // Se options foi enviado, substitui todas as opções anteriores
    if (data.options !== undefined) {
      await ProductOption.destroy({
        where: { product_id: id },
        transaction
      });

      if (data.options.length) {
        await ProductOption.bulkCreate(
          prepareOptions(data.options, id),
          { transaction }
        );
      }
    }

    // Atualiza as categorias somente se category_ids foi enviado
    if (data.category_ids !== undefined) {
      const categoryIds = await validateCategories(
        data.category_ids,
        transaction
      );

      await product.setCategories(categoryIds, { transaction });
    }
  });

  return getProductById(id);
}

// Excluir produto
async function deleteProduct(id) {
  await sequelize.transaction(async transaction => {
    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      throw createError('Produto não encontrado', 404);
    }

    await ProductImage.destroy({
      where: { product_id: id },
      transaction
    });

    await ProductOption.destroy({
      where: { product_id: id },
      transaction
    });

    await ProductCategory.destroy({
      where: { product_id: id },
      transaction
    });

    await product.destroy({ transaction });
  });

  return true;
}

module.exports = {
  createProduct,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
