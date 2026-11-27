// GET /products filters, sorts, facets and validation (contracts/product-filters.openapi.yaml).
// Expected results are computed here straight from the seed data, independently of src/catalog.js.
const request = require('supertest');
const app = require('../src/app');
const products = require('../src/data/products');

const CATEGORIES = ['Electronics', 'Books', 'Home & Kitchen', 'Fashion', 'Sports & Outdoors'];
const byId = (a, b) => a.id.localeCompare(b.id);
const ids = (list) => list.map((p) => p.id);
const expected = (pred, cmp = byId) => ids(products.filter(pred).sort(cmp));

// Fetch every matching product in one page (catalog has 40 items, max limit is 50).
async function all(query) {
  const res = await request(app).get(`/products?limit=50${query ? `&${query}` : ''}`);
  expect(res.status).toBe(200);
  return res;
}

describe('seed data assumptions', () => {
  it('uses exactly the contract categories', () => {
    expect(new Set(products.map((p) => p.category))).toEqual(new Set(CATEGORIES));
  });
  it('has price and rating ties so tie-breaking is exercised', () => {
    const prices = products.map((p) => p.price);
    const ratings = products.map((p) => p.rating);
    expect(new Set(prices).size).toBeLessThan(prices.length);
    expect(new Set(ratings).size).toBeLessThan(ratings.length);
  });
});

describe('filters', () => {
  it('no params: catalog in id order with facets', async () => {
    const res = await all();
    expect(ids(res.body.items)).toEqual(expected(() => true));
    expect(res.body.total).toBe(40);
    expect(res.body.facets).toBeDefined();
  });

  it('category, single value', async () => {
    const res = await all('category=Books');
    expect(ids(res.body.items)).toEqual(expected((p) => p.category === 'Books'));
    expect(res.body.total).toBe(8);
  });

  it('category, repeated values combine with OR (and & is URL-encoded)', async () => {
    const res = await all('category=Electronics&category=Home%20%26%20Kitchen');
    expect(ids(res.body.items)).toEqual(
      expected((p) => p.category === 'Electronics' || p.category === 'Home & Kitchen'),
    );
    expect(res.body.total).toBe(16);
  });

  it('category, duplicate values are deduplicated', async () => {
    const res = await all('category=Books&category=Books');
    expect(res.body.total).toBe(8);
  });

  it('minPrice is inclusive', async () => {
    const res = await all('minPrice=39.99');
    expect(ids(res.body.items)).toEqual(expected((p) => p.price >= 39.99));
    expect(res.body.items.some((p) => p.price === 39.99)).toBe(true);
  });

  it('maxPrice is inclusive', async () => {
    const res = await all('maxPrice=39.99');
    expect(ids(res.body.items)).toEqual(expected((p) => p.price <= 39.99));
    expect(res.body.items.some((p) => p.price === 39.99)).toBe(true);
  });

  it('minPrice equal to maxPrice returns exactly that price', async () => {
    const res = await all('minPrice=59&maxPrice=59');
    expect(ids(res.body.items)).toEqual(expected((p) => p.price === 59));
    expect(res.body.total).toBeGreaterThan(1);
  });

  it('minRating is inclusive and accepts decimals', async () => {
    const res = await all('minRating=4.6');
    expect(ids(res.body.items)).toEqual(expected((p) => p.rating >= 4.6));
    expect(res.body.items.some((p) => p.rating === 4.6)).toBe(true);
  });

  it('inStock=true returns only in-stock products', async () => {
    const res = await all('inStock=true');
    expect(ids(res.body.items)).toEqual(expected((p) => p.inStock));
    expect(res.body.total).toBe(34);
  });

  it('inStock=false applies no filter', async () => {
    const res = await all('inStock=false');
    expect(res.body.total).toBe(40);
  });

  it('combined: categories + price range + rating + stock + sort', async () => {
    const res = await all(
      'category=Electronics&category=Fashion&minPrice=30&maxPrice=150&minRating=4.2&inStock=true&sort=price_desc',
    );
    const pred = (p) =>
      ['Electronics', 'Fashion'].includes(p.category) &&
      p.price >= 30 && p.price <= 150 && p.rating >= 4.2 && p.inStock;
    expect(ids(res.body.items)).toEqual(expected(pred, (a, b) => b.price - a.price || byId(a, b)));
    expect(res.body.total).toBe(products.filter(pred).length);
    expect(res.body.total).toBeGreaterThan(2);
  });

  it('no matches: empty items, total 0, totalPages 0', async () => {
    const res = await all('category=Books&minPrice=290');
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });

  it('ignores unknown params, including bracket syntax', async () => {
    const res = await all('color=red&minPrice[gt]=10');
    expect(res.body.total).toBe(40);
  });
});

describe('sort', () => {
  const cases = {
    price_asc: (a, b) => a.price - b.price || byId(a, b),
    price_desc: (a, b) => b.price - a.price || byId(a, b),
    rating_desc: (a, b) => b.rating - a.rating || byId(a, b),
  };

  it.each(Object.keys(cases))('sort=%s orders correctly with id tie-break', async (sort) => {
    const res = await all(`sort=${sort}`);
    expect(ids(res.body.items)).toEqual(expected(() => true, cases[sort]));
  });

  it.each(Object.keys(cases))('sort=%s pages never overlap or skip', async (sort) => {
    const seen = [];
    for (let page = 1; page <= 8; page += 1) {
      const res = await request(app).get(`/products?sort=${sort}&limit=5&page=${page}`);
      seen.push(...ids(res.body.items));
    }
    expect(seen).toEqual(expected(() => true, cases[sort]));
  });
});

describe('pagination on filtered results', () => {
  it('total and totalPages count only filtered products', async () => {
    const res = await request(app).get('/products?inStock=true&limit=12');
    expect(res.body.total).toBe(34);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.items).toHaveLength(12);
  });

  it('last page is partial and the page after it is empty (200)', async () => {
    const last = await request(app).get('/products?inStock=true&limit=12&page=3');
    expect(last.body.items).toHaveLength(10);
    const past = await request(app).get('/products?inStock=true&limit=12&page=4');
    expect(past.status).toBe(200);
    expect(past.body.items).toEqual([]);
  });

  it('defaults to limit 12', async () => {
    const res = await request(app).get('/products?category=Books');
    expect(res.body.limit).toBe(12);
    expect(res.body.items).toHaveLength(8);
  });
});

describe('facets', () => {
  const countWhere = (pred) => products.filter(pred).length;

  it('no filters: all categories in fixed order, rating buckets, stock, price bounds', async () => {
    const { facets } = (await all()).body;
    expect(facets.categories).toEqual(CATEGORIES.map((value) => ({ value, count: 8 })));
    expect(facets.rating).toEqual([4, 3, 2, 1].map((min) => ({ min, count: countWhere((p) => p.rating >= min) })));
    expect(facets.inStock).toEqual({ count: 34 });
    expect(facets.price).toEqual({
      min: Math.min(...products.map((p) => p.price)),
      max: Math.max(...products.map((p) => p.price)),
    });
  });

  it('category counts ignore the category filter but apply the others', async () => {
    const { facets } = (await all('category=Books&maxPrice=30')).body;
    expect(facets.categories).toEqual(
      CATEGORIES.map((value) => ({ value, count: countWhere((p) => p.category === value && p.price <= 30) })),
    );
  });

  it('categories with zero matches are still listed', async () => {
    const { facets } = (await all('minPrice=200')).body;
    expect(facets.categories.map((c) => c.value)).toEqual(CATEGORIES);
    expect(facets.categories.some((c) => c.count === 0)).toBe(true);
  });

  it('rating counts ignore minRating but apply the others', async () => {
    const { facets } = (await all('minRating=4.5&category=Electronics')).body;
    expect(facets.rating).toEqual(
      [4, 3, 2, 1].map((min) => ({
        min,
        count: countWhere((p) => p.rating >= min && p.category === 'Electronics'),
      })),
    );
  });

  it('inStock count ignores inStock but applies the others', async () => {
    const { facets } = (await all('inStock=true&category=Electronics')).body;
    expect(facets.inStock).toEqual({
      count: countWhere((p) => p.inStock && p.category === 'Electronics'),
    });
  });

  it('price bounds ignore minPrice/maxPrice but apply the others', async () => {
    const { facets } = (await all('category=Books&minPrice=20&maxPrice=25')).body;
    const books = products.filter((p) => p.category === 'Books').map((p) => p.price);
    expect(facets.price).toEqual({ min: Math.min(...books), max: Math.max(...books) });
  });

  it('price bounds are null when nothing matches the other filters', async () => {
    const { facets } = (await all('category=Books&minRating=5')).body;
    expect(facets.price).toEqual({ min: null, max: null });
  });

  it('facets are returned on every page', async () => {
    const res = await request(app).get('/products?page=99');
    expect(res.body.facets.categories).toHaveLength(5);
  });
});

describe('validation errors', () => {
  async function details(query) {
    const res = await request(app).get(`/products?${query}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toBe('Invalid query parameters');
    return res.body.error.details;
  }

  it.each([
    ['category=Toys', { param: 'category', value: 'Toys', message: 'unknown category' }],
    ['category=books', { param: 'category', value: 'books', message: 'unknown category' }],
    ['category=', { param: 'category', value: '', message: 'must not be empty' }],
    ['minPrice=-5', { param: 'minPrice', value: '-5', message: 'must be a number >= 0' }],
    ['minPrice=abc', { param: 'minPrice', value: 'abc', message: 'must be a number >= 0' }],
    ['minPrice=Infinity', { param: 'minPrice', value: 'Infinity', message: 'must be a number >= 0' }],
    ['maxPrice=1e3', { param: 'maxPrice', value: '1e3', message: 'must be a number >= 0' }],
    ['minPrice=', { param: 'minPrice', value: '', message: 'must not be empty' }],
    ['minPrice=50&maxPrice=10', { param: 'maxPrice', value: '10', message: 'must be >= minPrice' }],
    ['minRating=6', { param: 'minRating', value: '6', message: 'must be a number between 0 and 5' }],
    ['minRating=-1', { param: 'minRating', value: '-1', message: 'must be a number between 0 and 5' }],
    ['inStock=yes', { param: 'inStock', value: 'yes', message: 'must be "true" or "false"' }],
    ['sort=name', { param: 'sort', value: 'name', message: 'must be one of price_asc, price_desc, rating_desc' }],
    ['page=0', { param: 'page', value: '0', message: 'must be a positive integer' }],
    ['limit=51', { param: 'limit', value: '51', message: 'must be an integer between 1 and 50' }],
    ['minPrice=1&minPrice=2', { param: 'minPrice', value: ['1', '2'], message: 'must be given at most once' }],
    ['sort=price_asc&sort=rating_desc', {
      param: 'sort', value: ['price_asc', 'rating_desc'], message: 'must be given at most once',
    }],
  ])('%s', async (query, detail) => {
    expect(await details(query)).toEqual([detail]);
  });

  it('reports every problem in one response, one entry per unknown category', async () => {
    const d = await details('category=Books&category=Toys&category=Games&minPrice=-1&sort=name&page=0');
    expect(d).toEqual(expect.arrayContaining([
      { param: 'category', value: 'Toys', message: 'unknown category' },
      { param: 'category', value: 'Games', message: 'unknown category' },
      { param: 'minPrice', value: '-1', message: 'must be a number >= 0' },
      { param: 'sort', value: 'name', message: 'must be one of price_asc, price_desc, rating_desc' },
      { param: 'page', value: '0', message: 'must be a positive integer' },
    ]));
    expect(d).toHaveLength(5);
  });
});
