"""
Data nutrisi makanan karbohidrat dari TKPI (Tabel Komposisi Pangan Indonesia) 2017.
Satuan: per 100g bahan makanan.
"""

NUTRITION_DATA = {
    "nasi_putih": {
        "nama": "Nasi Putih",
        "kalori": 175,
        "karbohidrat": 39.8,
        "protein": 2.1,
        "lemak": 0.1,
        "serat": 0.2,
        "sumber": "TKPI 2017"
    },
    "nasi_merah": {
        "nama": "Nasi Merah",
        "kalori": 170,
        "karbohidrat": 35.6,
        "protein": 3.5,
        "lemak": 0.9,
        "serat": 1.8,
        "sumber": "TKPI 2017"
    },
    "roti_tawar": {
        "nama": "Roti Tawar",
        "kalori": 248,
        "karbohidrat": 50.0,
        "protein": 8.0,
        "lemak": 1.2,
        "serat": 2.7,
        "sumber": "TKPI 2017"
    },
    "roti_utuh": {
        "nama": "Roti Gandum Utuh",
        "kalori": 247,
        "karbohidrat": 41.3,
        "protein": 8.5,
        "lemak": 3.4,
        "serat": 6.9,
        "sumber": "TKPI 2017"
    },
    "mi_pasta": {
        "nama": "Mi / Pasta",
        "kalori": 131,
        "karbohidrat": 25.0,
        "protein": 5.0,
        "lemak": 1.1,
        "serat": 1.8,
        "sumber": "TKPI 2017"
    },
    "kentang": {
        "nama": "Kentang",
        "kalori": 83,
        "karbohidrat": 19.1,
        "protein": 2.0,
        "lemak": 0.1,
        "serat": 1.8,
        "sumber": "TKPI 2017"
    },
    "jagung": {
        "nama": "Jagung",
        "kalori": 129,
        "karbohidrat": 30.3,
        "protein": 4.1,
        "lemak": 1.3,
        "serat": 2.9,
        "sumber": "TKPI 2017"
    },
    "pisang": {
        "nama": "Pisang",
        "kalori": 90,
        "karbohidrat": 23.4,
        "protein": 1.2,
        "lemak": 0.2,
        "serat": 0.6,
        "sumber": "TKPI 2017"
    },
}


def get_nutrition(class_name: str) -> dict | None:
    """Lookup data nutrisi berdasarkan nama kelas deteksi."""
    return NUTRITION_DATA.get(class_name)
