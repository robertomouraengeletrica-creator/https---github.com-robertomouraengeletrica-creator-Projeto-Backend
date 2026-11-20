
const { Op } = require('sequelize');
const { Category, ProductCategory } = require('../models');

// Cria erros com código HTTP
function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Transforma o nome em um slug
function generateSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Verifica se já existe outra categoria com o mesmo nome ou slug
async function checkDuplicate(name, slug, excludeId = null) {
  const where = {
    [Op.or]: [
      { name },
      { slug }
    ]
  };

  if (excludeId !== null) {
    where.id = { [Op.ne]: excludeId };
  }

  const existingCategory = await Category.findOne({ where });

  if (existingCategory) {
    throw createError(
      'Já existe uma categoria com esse nome ou slug',
      409
    );
  }
}

// Cadastrar categoria
async function createCategory(data) {
  const name = data.name.trim();
  const slug = data.slug
    ? generateSlug(data.slug)
    : generateSlug(name);

  await checkDuplicate(name, slug);

  const category = await Category.create({
    name,
    slug,
    use_in_menu: data.use_in_menu ?? false
  });

  return category;
}

// Listar categorias com filtros e paginação
async function searchCategories(filters) {
  const {
    name,
    use_in_menu,
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

  if (use_in_menu !== undefined) {
    where.use_in_menu = use_in_menu;
  }

  const allowedSortFields = [
    'id',
    'name',
    'createdAt'
  ];

  const sortField = allowedSortFields.includes(sort)
    ? sort
    : 'id';

  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;

  const result = await Category.findAndCountAll({
    where,
    order: [[sortField, sortOrder]],
    limit,
    offset
  });

  return {
    data: result.rows,
    pagination: {
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit)
    }
  };
}

// Consultar categoria pelo ID
async function getCategoryById(id) {
  const category = await Category.findByPk(id);

  if (!category) {
    throw createError('Categoria não encontrada', 404);
  }

  return category;
}

// Atualizar categoria
async function updateCategory(id, data) {
  const category = await Category.findByPk(id);

  if (!category) {
    throw createError('Categoria não encontrada', 404);
  }

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();

    updateData.slug = data.slug !== undefined
      ? generateSlug(data.slug)
      : generateSlug(updateData.name);
  } else if (data.slug !== undefined) {
    updateData.slug = generateSlug(data.slug);
  }

  if (data.use_in_menu !== undefined) {
    updateData.use_in_menu = data.use_in_menu;
  }

  const newName = updateData.name ?? category.name;
  const newSlug = updateData.slug ?? category.slug;

  await checkDuplicate(newName, newSlug, id);

  await category.update(updateData);

  return category;
}

// Excluir categoria
async function deleteCategory(id) {
  const category = await Category.findByPk(id);

  if (!category) {
    throw createError('Categoria não encontrada', 404);
  }

  // Impede excluir uma categoria vinculada a produtos
  const linkedProducts = await ProductCategory.count({
    where: { category_id: id }
  });

  if (linkedProducts > 0) {
    throw createError(
      'Não é possível excluir uma categoria vinculada a produtos',
      409
    );
  }

  await category.destroy();

  return true;
}

module.exports = {
  createCategory,
  searchCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
