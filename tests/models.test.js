
const {
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory
} = require('../src/models');

describe('Models da Digital Store', () => {

  test('Deve carregar os seis Models', () => {
    expect(User).toBeDefined();
    expect(Category).toBeDefined();
    expect(Product).toBeDefined();
    expect(ProductImage).toBeDefined();
    expect(ProductOption).toBeDefined();
    expect(ProductCategory).toBeDefined();
  });

  test('User deve possuir os campos obrigatórios', () => {
    expect(User.rawAttributes.firstname).toBeDefined();
    expect(User.rawAttributes.surname).toBeDefined();
    expect(User.rawAttributes.email).toBeDefined();
    expect(User.rawAttributes.password).toBeDefined();
  });

  test('Product deve possuir os campos de preço', () => {
    expect(Product.rawAttributes.price).toBeDefined();

    expect(
      Product.rawAttributes.price_with_discount
    ).toBeDefined();
  });

  test('Product deve possuir relacionamento com imagens', () => {
    expect(Product.associations.images).toBeDefined();
  });

  test('Product deve possuir relacionamento com opções', () => {
    expect(Product.associations.options).toBeDefined();
  });

  test('Product deve possuir relacionamento com categorias', () => {
    expect(Product.associations.categories).toBeDefined();
  });

  test('Category deve possuir relacionamento com produtos', () => {
    expect(Category.associations.products).toBeDefined();
  });

});
