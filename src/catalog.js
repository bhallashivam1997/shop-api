// Filtering, sorting and facet counts over the in-memory catalog. No Express code here.

const CATEGORIES = ['Electronics', 'Books', 'Home & Kitchen', 'Fashion', 'Sports & Outdoors'];
const SORTS = ['price_asc', 'price_desc', 'rating_desc'];
const RATING_BUCKETS = [4, 3, 2, 1];

// filters: { categories: string[], minPrice?, maxPrice?, minRating?, inStock: boolean }
// skip: name of one filter group to ignore ('category' | 'price' | 'rating' | 'inStock'),
// used for facet counts so each facet applies every active filter except its own.
function matches(product, filters, skip) {
  if (skip !== 'category' && filters.categories.length > 0 && !filters.categories.includes(product.category)) {
    return false;
  }
  if (skip !== 'price') {
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
  }
  if (skip !== 'rating' && filters.minRating !== undefined && product.rating < filters.minRating) {
    return false;
  }
  if (skip !== 'inStock' && filters.inStock && !product.inStock) return false;
  return true;
}

function byId(a, b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

const COMPARATORS = {
  price_asc: (a, b) => a.price - b.price || byId(a, b),
  price_desc: (a, b) => b.price - a.price || byId(a, b),
  rating_desc: (a, b) => b.rating - a.rating || byId(a, b),
};

// Returns a new array; ties are always broken by id ascending so pagination is stable.
function sortProducts(list, sort) {
  return [...list].sort(COMPARATORS[sort] || byId);
}

function computeFacets(products, filters) {
  const count = (skip, extra) => products.filter((p) => extra(p) && matches(p, filters, skip)).length;

  const priced = products.filter((p) => matches(p, filters, 'price')).map((p) => p.price);

  return {
    categories: CATEGORIES.map((value) => ({ value, count: count('category', (p) => p.category === value) })),
    rating: RATING_BUCKETS.map((min) => ({ min, count: count('rating', (p) => p.rating >= min) })),
    inStock: { count: count('inStock', (p) => p.inStock) },
    price: priced.length
      ? { min: Math.min(...priced), max: Math.max(...priced) }
      : { min: null, max: null },
  };
}

function searchProducts(products, { filters, sort, page, limit }) {
  const matched = sortProducts(products.filter((p) => matches(p, filters)), sort);
  const total = matched.length;
  const start = (page - 1) * limit;
  return {
    items: matched.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    facets: computeFacets(products, filters),
  };
}

module.exports = { CATEGORIES, SORTS, RATING_BUCKETS, matches, sortProducts, computeFacets, searchProducts };
