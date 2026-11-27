const express = require('express');
const cors = require('cors');
const products = require('./data/products');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function badRequest(res, message) {
  return res.status(400).json({ error: { code: 'BAD_REQUEST', message } });
}

function parsePositiveInt(value, fallback) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value))) return NaN;
  const n = Number(value);
  return n >= 1 ? n : NaN;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /products?page=1&limit=12  -> paginated list
app.get('/products', (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);

  if (Number.isNaN(page)) return badRequest(res, 'page must be a positive integer');
  if (Number.isNaN(limit) || limit > MAX_LIMIT) {
    return badRequest(res, `limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  const total = products.length;
  const start = (page - 1) * limit;
  const items = products.slice(start, start + limit);

  res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /products/:id -> single product
app.get('/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }
  res.json(product);
});

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

module.exports = app;
