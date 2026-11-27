# shop-api

Demo shop backend: an Express API serving 40 in-memory products.

## Run

```bash
npm install
npm start        # http://localhost:4000
npm test
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` |
| GET | `/products` | Filtered, sorted, paginated list: `{ items, total, page, limit, totalPages, facets }` |
| GET | `/products/:id` | One product, or 404 |

Full contract: [`contracts/product-filters.openapi.yaml`](contracts/product-filters.openapi.yaml).

### `GET /products` query parameters

All optional. Different filters combine with AND.

| Param | Format | Meaning |
|---|---|---|
| `category` | repeatable, exact name | `category=Books&category=Fashion` matches either (OR) |
| `minPrice`, `maxPrice` | USD, e.g. `29.99` | inclusive bounds; `minPrice` must be ≤ `maxPrice` |
| `minRating` | number 0–5 | `rating >= minRating` |
| `inStock` | `true` / `false` | `true` = only in-stock products |
| `sort` | `price_asc`, `price_desc`, `rating_desc` | default is catalog (id) order; ties always break by id |
| `page`, `limit` | integers | `page` ≥ 1 (past the end → empty `items`), `limit` 1–50, default 12 |

`total` and `totalPages` count only the filtered products. `facets` holds the count for each filter option, and each facet applies every active filter except its own:

```json
"facets": {
  "categories": [{ "value": "Electronics", "count": 8 }, "... all 5, zeros included"],
  "rating": [{ "min": 4, "count": 37 }, { "min": 3, "count": 40 }, { "min": 2, "count": 40 }, { "min": 1, "count": 40 }],
  "inStock": { "count": 34 },
  "price": { "min": 12.5, "max": 299 }
}
```

Example: `curl 'http://localhost:4000/products?category=Books&category=Fashion&maxPrice=40&sort=price_asc'`

### Errors

One shape: `{ "error": { "code": "BAD_REQUEST" | "NOT_FOUND", "message": "..." } }`. When query parameters are invalid, a 400 lists every problem at once in `details`:

```json
{ "error": { "code": "BAD_REQUEST", "message": "Invalid query parameters",
  "details": [{ "param": "category", "value": "Toys", "message": "unknown category" }] } }
```

A 400 is returned for:
- an empty value;
- a param other than `category` given twice (`value` is then an array);
- an unknown category or sort;
- a value that is out of range or not a number.

Unknown param names are ignored.

## Product shape

```json
{
  "id": "p001",
  "name": "Wireless Noise-Cancelling Headphones",
  "description": "...",
  "price": 199.99,
  "category": "Electronics",
  "brand": "Sonora",
  "rating": 4.6,
  "reviewCount": 312,
  "inStock": true,
  "imageUrl": "https://picsum.photos/seed/shop-p001/400/300"
}
```

`price` is in US dollars. Categories: Electronics, Books, Home & Kitchen, Fashion, Sports & Outdoors.
