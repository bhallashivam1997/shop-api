const express = require('express');
const cors = require('cors');
const products = require('./data/products');
const { parseProductQuery } = require('./query');
const { searchProducts } = require('./catalog');

function badRequest(res, message, details) {
  return res.status(400).json({ error: { code: 'BAD_REQUEST', message, ...(details && { details }) } });
}

const app = express();
// "simple" parser: query values are only strings or arrays of strings (no nested objects like a[b]=c).
app.set('query parser', 'simple');
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /products -> filtered, sorted, paginated list with facet counts.
// Contract: contracts/product-filters.openapi.yaml
app.get('/products', (req, res) => {
  const parsed = parseProductQuery(req.query);
  if (!parsed.ok) return badRequest(res, 'Invalid query parameters', parsed.details);
  res.json(searchProducts(products, parsed.value));
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
