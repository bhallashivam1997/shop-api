// Parses and validates GET /products query parameters.
// Expects Express's "simple" query parser: every value is a string or an array of strings.
// Returns { ok: true, value } or { ok: false, details: [{ param, value, message }] } listing every problem.

const { CATEGORIES, SORTS } = require('./catalog');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const NON_NEGATIVE_NUMBER = /^\d+(\.\d+)?$/;
const POSITIVE_INT = /^\d+$/;

const SCALAR_PARAMS = ['minPrice', 'maxPrice', 'minRating', 'inStock', 'sort', 'page', 'limit'];

function parseProductQuery(query) {
  const details = [];
  const fail = (param, value, message) => details.push({ param, value, message });

  // Scalars: at most once, never empty.
  const scalars = {};
  for (const param of SCALAR_PARAMS) {
    const raw = query[param];
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      fail(param, raw, 'must be given at most once');
    } else if (raw === '') {
      fail(param, raw, 'must not be empty');
    } else {
      scalars[param] = raw;
    }
  }

  // category: repeatable, exact names, deduplicated.
  const categories = [];
  if (query.category !== undefined) {
    const values = Array.isArray(query.category) ? query.category : [query.category];
    for (const value of values) {
      if (value === '') fail('category', value, 'must not be empty');
      else if (!CATEGORIES.includes(value)) fail('category', value, 'unknown category');
      else if (!categories.includes(value)) categories.push(value);
    }
  }

  const number = (param, { max } = {}) => {
    const raw = scalars[param];
    if (raw === undefined) return undefined;
    const n = Number(raw);
    if (!NON_NEGATIVE_NUMBER.test(raw) || !Number.isFinite(n)) {
      fail(param, raw, max === undefined ? 'must be a number >= 0' : `must be a number between 0 and ${max}`);
      return undefined;
    }
    if (max !== undefined && n > max) {
      fail(param, raw, `must be a number between 0 and ${max}`);
      return undefined;
    }
    return n;
  };

  const minPrice = number('minPrice');
  const maxPrice = number('maxPrice');
  const minRating = number('minRating', { max: 5 });
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    fail('maxPrice', scalars.maxPrice, 'must be >= minPrice');
  }

  let inStock = false;
  if (scalars.inStock !== undefined) {
    if (scalars.inStock === 'true') inStock = true;
    else if (scalars.inStock !== 'false') fail('inStock', scalars.inStock, 'must be "true" or "false"');
  }

  const sort = scalars.sort;
  if (sort !== undefined && !SORTS.includes(sort)) {
    fail('sort', sort, `must be one of ${SORTS.join(', ')}`);
  }

  const integer = (param, fallback, max) => {
    const raw = scalars[param];
    if (raw === undefined) return fallback;
    const n = Number(raw);
    if (!POSITIVE_INT.test(raw) || n < 1 || (max !== undefined && n > max)) {
      fail(param, raw, max === undefined ? 'must be a positive integer' : `must be an integer between 1 and ${max}`);
      return fallback;
    }
    return n;
  };

  const page = integer('page', 1);
  const limit = integer('limit', DEFAULT_LIMIT, MAX_LIMIT);

  if (details.length > 0) return { ok: false, details };
  return {
    ok: true,
    value: { filters: { categories, minPrice, maxPrice, minRating, inStock }, sort, page, limit },
  };
}

module.exports = { parseProductQuery, DEFAULT_LIMIT, MAX_LIMIT };
