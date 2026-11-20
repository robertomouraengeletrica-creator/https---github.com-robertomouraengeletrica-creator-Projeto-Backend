
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

// Produto possui várias imagens
Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  as: 'images',
  onDelete: 'CASCADE'
});

ProductImage.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'CASCADE'
});

// Produto possui várias opções
Product.hasMany(ProductOption, {
  foreignKey: 'product_id',
  as: 'options',
  onDelete: 'CASCADE'
});

ProductOption.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'CASCADE'
});

// Produto pertence a várias categorias
Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
  as: 'categories',
  onDelete: 'CASCADE'
});

// Categoria possui vários produtos
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
  as: 'products',
  onDelete: 'CASCADE'
});

module.exports = {
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory
};
