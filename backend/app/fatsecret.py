"""
FatSecret Platform API integration (OAuth 2.0 Client Credentials) untuk data nutrisi makanan.
Pastikan IP server sudah didaftarkan di whitelist aplikasi FatSecret.
Docs: https://platform.fatsecret.com/docs/guides/authentication/oauth2
"""

import os
import time
import base64
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("FATSECRET_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("FATSECRET_CLIENT_SECRET", "")

TOKEN_URL = "https://oauth.fatsecret.com/connect/token"
API_URL = "https://platform.fatsecret.com/rest/server.api"

# ── Token cache ──────────────────────────────────────────────────────────────
_token: str = ""
_token_expires_at: float = 0.0

# ── Nutrition result cache ───────────────────────────────────────────────────
_nutrition_cache: dict[str, dict] = {}

# ── Mapping class YOLO → query pencarian FatSecret ──────────────────────────
CLASS_QUERY_MAP: dict[str, str] = {
    "nasi_putih": "white rice cooked",
    "nasi_merah": "brown rice cooked",
    "roti_tawar":  "white bread",
    "roti_utuh":   "whole wheat bread",
    "mi_pasta":    "cooked pasta",
    "kentang":     "boiled potato",
    "jagung":      "sweet corn cooked",
    "pisang":      "banana fresh",
}


def is_configured() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET)


async def _get_token() -> str:
    global _token, _token_expires_at
    if _token and time.time() < _token_expires_at - 60:
        return _token

    creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    async with httpx.AsyncClient() as client:
        r = await client.post(
            TOKEN_URL,
            headers={
                "Authorization": f"Basic {creds}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials", "scope": "basic"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()

    _token = data["access_token"]
    _token_expires_at = time.time() + data.get("expires_in", 86400)
    return _token


async def _search_food_id(query: str) -> Optional[str]:
    token = await _get_token()
    async with httpx.AsyncClient() as client:
        r = await client.get(
            API_URL,
            params={
                "method": "foods.search",
                "search_expression": query,
                "format": "json",
                "max_results": 5,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()

    if "error" in data:
        raise RuntimeError(f"FatSecret error {data['error']['code']}: {data['error']['message']}")

    foods = data.get("foods", {}).get("food")
    if not foods:
        return None
    if isinstance(foods, dict):
        foods = [foods]

    for food in foods:
        if food.get("food_type") == "Generic":
            return str(food["food_id"])
    return str(foods[0]["food_id"])


def _parse_serving_per_100g(servings) -> Optional[dict]:
    if isinstance(servings, dict):
        servings = [servings]

    # Prioritas 1: serving yang sudah per 100g
    for s in servings:
        desc = s.get("serving_description", "").lower()
        metric_unit = s.get("metric_serving_unit", "")
        metric_amount = float(s.get("metric_serving_amount", 0) or 0)
        if "100 g" in desc or (metric_unit == "g" and abs(metric_amount - 100) < 1):
            return {
                "kalori":      round(float(s.get("calories", 0) or 0), 1),
                "karbohidrat": round(float(s.get("carbohydrate", 0) or 0), 2),
                "protein":     round(float(s.get("protein", 0) or 0), 2),
                "lemak":       round(float(s.get("fat", 0) or 0), 2),
                "serat":       round(float(s.get("fiber", 0) or 0), 2),
            }

    # Prioritas 2: normalisasi dari serving yang punya metric gram
    for s in servings:
        metric_unit = s.get("metric_serving_unit", "")
        metric_amount = float(s.get("metric_serving_amount", 0) or 0)
        if metric_unit == "g" and metric_amount > 0:
            factor = 100.0 / metric_amount
            return {
                "kalori":      round(float(s.get("calories", 0) or 0) * factor, 1),
                "karbohidrat": round(float(s.get("carbohydrate", 0) or 0) * factor, 2),
                "protein":     round(float(s.get("protein", 0) or 0) * factor, 2),
                "lemak":       round(float(s.get("fat", 0) or 0) * factor, 2),
                "serat":       round(float(s.get("fiber", 0) or 0) * factor, 2),
            }

    # Fallback: serving pertama apa adanya
    s = servings[0]
    return {
        "kalori":      round(float(s.get("calories", 0) or 0), 1),
        "karbohidrat": round(float(s.get("carbohydrate", 0) or 0), 2),
        "protein":     round(float(s.get("protein", 0) or 0), 2),
        "lemak":       round(float(s.get("fat", 0) or 0), 2),
        "serat":       round(float(s.get("fiber", 0) or 0), 2),
    }


async def get_nutrition_fatsecret(class_name: str) -> Optional[dict]:
    if class_name in _nutrition_cache:
        return _nutrition_cache[class_name]

    query = CLASS_QUERY_MAP.get(class_name, class_name.replace("_", " "))

    food_id = await _search_food_id(query)
    if not food_id:
        return None

    token = await _get_token()
    async with httpx.AsyncClient() as client:
        r = await client.get(
            API_URL,
            params={"method": "food.get.v4", "food_id": food_id, "format": "json"},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()

    if "error" in data:
        raise RuntimeError(f"FatSecret error {data['error']['code']}: {data['error']['message']}")

    food = data.get("food")
    if not food:
        return None

    servings = food.get("servings", {}).get("serving", [])
    if not servings:
        return None

    nutrition = _parse_serving_per_100g(servings)
    if not nutrition:
        return None

    result = {
        "nama": food["food_name"],
        "sumber": "FatSecret",
        **nutrition,
    }
    _nutrition_cache[class_name] = result
    return result
