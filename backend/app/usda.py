"""
USDA FoodData Central API integration.
Docs: https://fdc.nal.usda.gov/api-guide.html
Tidak memerlukan IP whitelist — API key cukup.
"""

import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("USDA_API_KEY", "")
BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Cache hasil nutrisi per class_name
_cache: dict[str, dict] = {}

# Mapping kelas YOLO → query pencarian USDA
CLASS_QUERY_MAP: dict[str, str] = {
    "nasi_putih": "Rice white cooked",
    "nasi_merah": "Rice brown cooked",
    "roti_tawar": "Bread white enriched",
    "roti_utuh":  "Bread whole wheat",
    "mi_pasta":   "Pasta cooked",
    "kentang":    "Potato boiled",
    "jagung":     "Corn sweet yellow cooked",
    "pisang":     "Banana raw",
}

# USDA nutrient ID → field internal
NUTRIENT_MAP: dict[int, str] = {
    1008: "kalori",       # Energy (kcal)
    1005: "karbohidrat",  # Carbohydrate, by difference (g)
    1003: "protein",      # Protein (g)
    1004: "lemak",        # Total lipid / fat (g)
    1079: "serat",        # Fiber, total dietary (g)
}


def is_configured() -> bool:
    return bool(API_KEY)


async def _search_food(query: str) -> Optional[tuple[int, str]]:
    """Cari fdcId dan nama makanan. Prioritas Foundation > SR Legacy."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{BASE_URL}/foods/search",
            params={
                "query": query,
                "api_key": API_KEY,
                "pageSize": 10,
                "dataType": "Foundation,SR Legacy",
            },
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()

    foods = data.get("foods", [])
    if not foods:
        return None

    for f in foods:
        if f.get("dataType") in ("Foundation", "SR Legacy"):
            return f["fdcId"], f["description"]
    return foods[0]["fdcId"], foods[0]["description"]


def _parse_nutrients(food_nutrients: list) -> dict:
    """Ekstrak nilai nutrisi dari list foodNutrients (per 100g)."""
    result: dict[str, float] = {v: 0.0 for v in NUTRIENT_MAP.values()}
    for fn in food_nutrients:
        # Format /foods/search: {"nutrientId": 1008, "value": 130}
        # Format /food/{id}:    {"nutrient": {"id": 1008}, "amount": 130}
        nid = fn.get("nutrientId") or fn.get("nutrient", {}).get("id")
        val = fn.get("value") or fn.get("amount") or 0
        if nid in NUTRIENT_MAP:
            result[NUTRIENT_MAP[nid]] = round(float(val), 2)
    return result


async def get_nutrition_usda(class_name: str) -> Optional[dict]:
    """Ambil data nutrisi per 100g dari USDA FoodData Central."""
    if class_name in _cache:
        return _cache[class_name]

    query = CLASS_QUERY_MAP.get(class_name, class_name.replace("_", " "))

    found = await _search_food(query)
    if not found:
        return None
    fdc_id, nama = found

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{BASE_URL}/food/{fdc_id}",
            params={"api_key": API_KEY},
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()

    nutrients = _parse_nutrients(data.get("foodNutrients", []))

    result = {
        "nama": nama.title(),
        "sumber": "USDA FoodData Central",
        **nutrients,
    }
    _cache[class_name] = result
    return result
