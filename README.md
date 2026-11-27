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
| GET | `/products?page=1&limit=12` | Paginated list: `{ items, total, page, limit, totalPages }`. `limit` max 50. |
| GET | `/products/:id` | One product, or 404 |

Errors use one shape: `{ "error": { "code": "BAD_REQUEST" | "NOT_FOUND", "message": "..." } }`.

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
