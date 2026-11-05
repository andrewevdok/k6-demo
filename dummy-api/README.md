# dummy-api

Small FastAPI service used as a target for the k6 tests. All endpoints are `GET` and return dummy JSON.

| Endpoint | Base latency |
|---|---|
| `/api/users?limit=10` | 50 ms |
| `/api/users/{id}` | 15 ms |
| `/api/products?limit=20` | 60 ms |
| `/api/orders?limit=20` | 120 ms |
| `/api/search?q=demo` | 250 ms |

`/health` is used by the compose healthcheck.

Each response waits `base + random(0..JITTER_MS)`. `ERROR_RATE` (0..1) injects random 500s.

## Configuration

| Env var | Default |
|---|---|
| `JITTER_MS` | 20 |
| `ERROR_RATE` | 0 |
| `USERS_LATENCY_MS`, `USER_LATENCY_MS`, `PRODUCTS_LATENCY_MS`, `ORDERS_LATENCY_MS`, `SEARCH_LATENCY_MS` | see table |

In docker compose the first two are set via `DUMMY_JITTER_MS` and `DUMMY_ERROR_RATE` in `.env`.

## Run

```bash
docker compose up -d --build dummy-api
```

From the host: `http://localhost:8000`. From the k6 container: `http://dummy-api:8000`. Swagger UI: `http://localhost:8000/docs`.
