const request = require('supertest');
const app = require('../src/app');
const products = require('../src/data/products');

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /products', () => {
  it('returns the first page with defaults', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(12);
    expect(res.body.total).toBe(products.length);
    expect(res.body.items).toHaveLength(12);
    expect(res.body.items[0]).toEqual(products[0]);
  });

  it('paginates with page and limit', async () => {
    const res = await request(app).get('/products?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.items.map((p) => p.id)).toEqual(products.slice(10, 20).map((p) => p.id));
    expect(res.body.totalPages).toBe(Math.ceil(products.length / 10));
  });

  it('returns an empty list past the last page', async () => {
    const res = await request(app).get('/products?page=99');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it.each(['0', '-1', 'abc', '1.5'])('rejects page=%s', async (page) => {
    const res = await request(app).get(`/products?page=${page}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects limit above the max', async () => {
    const res = await request(app).get('/products?limit=51');
    expect(res.status).toBe(400);
  });
});

describe('GET /products/:id', () => {
  it('returns a single product', async () => {
    const res = await request(app).get('/products/p001');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p001');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/products/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('catalog data', () => {
  it('has 40 products with unique ids', () => {
    expect(products).toHaveLength(40);
    expect(new Set(products.map((p) => p.id)).size).toBe(40);
  });
});
