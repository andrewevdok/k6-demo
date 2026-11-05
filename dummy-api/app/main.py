"""Dummy API used as a target for k6 performance tests.

Every endpoint returns static-ish dummy data after a simulated delay:

    delay = base latency of the endpoint + random jitter (0..JITTER_MS)

ERROR_RATE injects random 500s.
"""

import asyncio
import os
import random
import time

from fastapi import FastAPI, HTTPException


def _env_float(name: str, default: float) -> float:
    return float(os.getenv(name, default))


JITTER_MS = _env_float("JITTER_MS", 20)
ERROR_RATE = _env_float("ERROR_RATE", 0.0)

BASE_LATENCY_MS = {
    "users": _env_float("USERS_LATENCY_MS", 50),
    "user": _env_float("USER_LATENCY_MS", 15),
    "products": _env_float("PRODUCTS_LATENCY_MS", 60),
    "orders": _env_float("ORDERS_LATENCY_MS", 120),
    "search": _env_float("SEARCH_LATENCY_MS", 250),
}

app = FastAPI(title="Dummy API", version="1.0.0")


async def simulate(endpoint: str) -> float:
    """Sleep for the simulated latency of `endpoint`, maybe fail, return elapsed ms."""
    started = time.perf_counter()
    delay_ms = BASE_LATENCY_MS[endpoint] + random.uniform(0, JITTER_MS)
    await asyncio.sleep(delay_ms / 1000)
    if random.random() < ERROR_RATE:
        raise HTTPException(status_code=500, detail=f"simulated {endpoint} failure")
    return round((time.perf_counter() - started) * 1000, 2)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/users")
async def list_users(limit: int = 10):
    took = await simulate("users")
    users = [
        {"id": i, "name": f"User {i}", "email": f"user{i}@example.com"}
        for i in range(1, min(limit, 100) + 1)
    ]
    return {"took_ms": took, "count": len(users), "items": users}


@app.get("/api/users/{user_id}")
async def get_user(user_id: int):
    took = await simulate("user")
    return {
        "took_ms": took,
        "id": user_id,
        "name": f"User {user_id}",
        "email": f"user{user_id}@example.com",
        "active": user_id % 2 == 0,
    }


@app.get("/api/products")
async def list_products(limit: int = 20):
    took = await simulate("products")
    products = [
        {"id": i, "title": f"Product {i}", "price": round(9.99 + i * 1.5, 2), "in_stock": i % 3 != 0}
        for i in range(1, min(limit, 200) + 1)
    ]
    return {"took_ms": took, "count": len(products), "items": products}


@app.get("/api/orders")
async def list_orders(limit: int = 20):
    took = await simulate("orders")
    orders = [
        {"id": 1000 + i, "user_id": i % 10 + 1, "total": round(19.5 * i, 2), "status": "shipped"}
        for i in range(1, min(limit, 200) + 1)
    ]
    return {"took_ms": took, "count": len(orders), "items": orders}


@app.get("/api/search")
async def search(q: str = "demo"):
    took = await simulate("search")
    hits = [{"id": i, "title": f"{q} result {i}", "score": round(1 - i * 0.05, 2)} for i in range(10)]
    return {"took_ms": took, "query": q, "count": len(hits), "items": hits}
