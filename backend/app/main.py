"""
CarbFood Detector API - Main FastAPI Application
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
import io

from .yolo import YOLODetector
from .nutrition import get_nutrition
from .fatsecret import get_nutrition_fatsecret, is_configured as fatsecret_configured
from .usda import get_nutrition_usda, is_configured as usda_configured

# Pydantic Models for API Documentation
class Detection(BaseModel):
    """Single object detection result"""
    class_id: int = Field(..., description="Class ID from model", example=0)
    class_name: str = Field(..., description="Human-readable class name (setelah koreksi heuristic untuk roti)", example="nasi_merah")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score (0.0-1.0)", example=0.91)
    bbox: List[float] = Field(..., description="Bounding box coordinates [x1, y1, x2, y2] in pixels", example=[100.5, 200.3, 300.7, 400.9])
    original_class_name: Optional[str] = Field(None, description="Class asli dari model sebelum koreksi heuristic (hanya muncul jika di-override)", example="roti_utuh")
    bread_score: Optional[int] = Field(None, description="Score heuristic roti 0..4 (hanya untuk class roti_tawar/roti_utuh)", example=3)

    class Config:
        json_schema_extra = {
            "example": {
                "class_id": 0,
                "class_name": "nasi_merah",
                "confidence": 0.91,
                "bbox": [100.5, 200.3, 300.7, 400.9]
            }
        }


class PredictionResponse(BaseModel):
    """Response containing all detections from an image"""
    detections: List[Detection] = Field(..., description="List of detected objects")

    class Config:
        json_schema_extra = {
            "example": {
                "detections": [
                    {
                        "class_id": 0,
                        "class_name": "nasi_merah",
                        "confidence": 0.91,
                        "bbox": [100.5, 200.3, 300.7, 400.9]
                    },
                    {
                        "class_id": 1,
                        "class_name": "roti_tawar",
                        "confidence": 0.85,
                        "bbox": [450.2, 180.1, 600.3, 350.8]
                    }
                ]
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status", example="ok")
    model: str = Field(..., description="Model file path", example="models/best.pt")
    model_loaded: bool = Field(..., description="Whether model is successfully loaded", example=True)


class ModelInfoResponse(BaseModel):
    """Model information response"""
    model_path: str = Field(..., description="Path to model file", example="models/best.pt")
    class_names: Dict[int, str] = Field(..., description="Mapping of class IDs to class names")
    num_classes: int = Field(..., description="Total number of classes the model can detect", example=10)


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str = Field(..., description="Error message", example="Invalid image file")


class RootResponse(BaseModel):
    """Root endpoint response"""
    message: str = Field(..., example="CarbFood Detector API")
    docs: str = Field(..., example="/docs")
    health: str = Field(..., example="/health")


class NutritionResponse(BaseModel):
    """Informasi nutrisi makanan per 100g (sumber: TKPI 2017 atau FatSecret)"""
    class_name: str = Field(..., description="Nama kelas deteksi", example="nasi_putih")
    nama: str = Field(..., description="Nama makanan", example="Nasi Putih")
    kalori: float = Field(..., description="Energi (kkal)", example=175)
    karbohidrat: float = Field(..., description="Karbohidrat (g)", example=39.8)
    protein: float = Field(..., description="Protein (g)", example=2.1)
    lemak: float = Field(..., description="Lemak (g)", example=0.1)
    serat: float = Field(..., description="Serat (g)", example=0.2)
    sumber: str = Field(..., description="Sumber data", example="TKPI 2017")
    satuan: str = Field("per 100g", description="Satuan pengukuran")


# API Metadata
app = FastAPI(
    title="CarbFood Detector API",
    description="""
# CarbFood Detector API

REST API untuk deteksi makanan karbohidrat menggunakan YOLOv8.

## Fitur Utama

* 🎯 **Deteksi Objek Real-time** - Deteksi makanan karbohidrat dari gambar
* 📊 **Output JSON** - Hasil deteksi dalam format JSON terstruktur
* 🖼️ **Visualisasi** - Gambar dengan bounding box dan label
* ⚙️ **Configurable Threshold** - Atur confidence dan IoU threshold
* 📚 **Dokumentasi Lengkap** - Interactive API documentation dengan Swagger UI

## Model

Menggunakan YOLOv8 yang telah di-training untuk mengenali berbagai jenis makanan karbohidrat:
- Nasi (putih, merah, riceberry)
- Roti (tawar, gandum)
- Mie dan pasta
- Dan lainnya sesuai training dataset

## Penggunaan

1. **Health Check**: Cek status API dan model
2. **Predict JSON**: Upload gambar untuk mendapat hasil deteksi dalam JSON
3. **Predict Render**: Upload gambar untuk mendapat gambar dengan bounding box
4. **Model Info**: Lihat informasi detail tentang model yang digunakan

## Parameter

### Confidence Threshold (conf)
- **Range**: 0.0 - 1.0
- **Default**: 0.25
- **Pengaruh**: Nilai lebih tinggi = deteksi lebih sedikit tapi lebih yakin
- **Rekomendasi**:
  - 0.25-0.35 untuk deteksi umum
  - 0.50-0.70 untuk presisi tinggi
  - 0.15-0.25 untuk recall maksimal

### IoU Threshold (iou)
- **Range**: 0.0 - 1.0
- **Default**: 0.45
- **Pengaruh**: Mengontrol Non-Maximum Suppression (NMS)
- **Rekomendasi**:
  - 0.45 (default) untuk keseimbangan
  - 0.30-0.40 untuk objek yang overlap
  - 0.50-0.60 untuk objek yang terpisah jelas

## Format Gambar yang Didukung

- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)

**Ukuran Maksimal**: Disarankan < 5MB untuk performa optimal

## Response Time

- **CPU**: 2-5 detik per gambar
- **GPU**: 0.1-0.5 detik per gambar

## Error Codes

- **400**: Bad Request (gambar invalid atau format tidak didukung)
- **500**: Internal Server Error (error saat inference)

## Contact & Support

Untuk pertanyaan atau issue, silakan hubungi tim pengembang.

**Thesis Project**: Sistem Deteksi Makanan Karbohidrat Berbasis YOLOv8
""",
    version="1.0.0",
    contact={
        "name": "CarbFood Detector Team",
        "email": "support@carbfood.example.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "health",
            "description": "Health check dan status sistem"
        },
        {
            "name": "prediction",
            "description": "Endpoint untuk deteksi objek makanan"
        },
        {
            "name": "model",
            "description": "Informasi tentang model YOLOv8"
        },
        {
            "name": "nutrition",
            "description": "Informasi nutrisi makanan dari TKPI 2017"
        }
    ]
)

# CORS middleware for web demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLO detector (loads model once at startup)
detector = YOLODetector(model_path="models/best.pt")


@app.get(
    "/",
    response_model=RootResponse,
    summary="Root Endpoint",
    description="Endpoint awal yang menampilkan informasi dasar API dan link ke dokumentasi",
)
def root():
    """
    ## Root Endpoint

    Menampilkan informasi dasar tentang API dan link navigasi.

    **Response**:
    - `message`: Nama API
    - `docs`: Link ke dokumentasi interaktif
    - `health`: Link ke health check endpoint
    """
    return {
        "message": "CarbFood Detector API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["health"],
    summary="Health Check",
    description="Mengecek status API dan apakah model YOLOv8 berhasil di-load",
    responses={
        200: {
            "description": "Service berjalan normal dan model berhasil di-load",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "model": "models/best.pt",
                        "model_loaded": True
                    }
                }
            }
        }
    }
)
def health_check():
    """
    ## Health Check

    Endpoint untuk mengecek:
    - Status API (running/stopped)
    - Path model yang digunakan
    - Status loading model (berhasil/gagal)

    **Use Case**:
    - Monitoring sistem
    - Verifikasi deployment
    - Troubleshooting

    **Response**:
    - `status`: "ok" jika service berjalan
    - `model`: Path ke file model (.pt)
    - `model_loaded`: true/false apakah model berhasil di-load
    """
    return {
        "status": "ok",
        "model": detector.model_path,
        "model_loaded": detector.is_loaded()
    }


@app.post(
    "/predict/image",
    response_model=PredictionResponse,
    tags=["prediction"],
    summary="Predict - JSON Output",
    description="Upload gambar dan dapatkan hasil deteksi dalam format JSON",
    responses={
        200: {
            "description": "Deteksi berhasil, mengembalikan array of detections",
            "content": {
                "application/json": {
                    "example": {
                        "detections": [
                            {
                                "class_id": 0,
                                "class_name": "nasi_merah",
                                "confidence": 0.91,
                                "bbox": [100.5, 200.3, 300.7, 400.9]
                            }
                        ]
                    }
                }
            }
        },
        400: {
            "description": "Bad Request - File bukan gambar valid atau format tidak didukung",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal Server Error - Error saat melakukan inference",
            "model": ErrorResponse
        }
    }
)
async def predict_image(
    file: UploadFile = File(..., description="File gambar (JPEG, PNG, BMP, dll)"),
    conf: float = Query(
        0.25,
        ge=0.0,
        le=1.0,
        description="Confidence threshold - nilai lebih tinggi = hasil lebih yakin tapi mungkin terlewat objek",
        example=0.25
    ),
    iou: float = Query(
        0.45,
        ge=0.0,
        le=1.0,
        description="IoU threshold untuk NMS - mengatur seberapa banyak overlap yang diperbolehkan",
        example=0.45
    )
):
    """
    ## Predict Objects - JSON Output

    Upload gambar untuk mendeteksi objek makanan karbohidrat dan mendapat hasil dalam format JSON.

    **Input**:
    - `file`: File gambar (multipart/form-data)
    - `conf`: Confidence threshold (0.0-1.0, default: 0.25)
    - `iou`: IoU threshold (0.0-1.0, default: 0.45)

    **Output JSON**:
    ```json
    {
      "detections": [
        {
          "class_id": 0,
          "class_name": "nasi_merah",
          "confidence": 0.91,
          "bbox": [x1, y1, x2, y2]
        }
      ]
    }
    ```

    **Bounding Box Format**: `[x1, y1, x2, y2]`
    - `x1, y1`: Koordinat kiri atas (top-left corner)
    - `x2, y2`: Koordinat kanan bawah (bottom-right corner)
    - Satuan: pixels

    **Use Case**:
    - Integrasi dengan aplikasi mobile/web
    - Analisis data programmatic
    - Logging dan database storage
    - Custom visualization

    **Tips**:
    - Gunakan `conf=0.15` untuk mendeteksi lebih banyak objek (recall tinggi)
    - Gunakan `conf=0.50` untuk hasil lebih presisi (precision tinggi)
    - Adjust `iou` jika objek saling overlap
    """
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image file. Pastikan file adalah gambar valid (JPEG, PNG, dll)"
            )

        # Run inference
        detections = detector.predict(image, conf=conf, iou=iou)

        return JSONResponse(content={"detections": detections})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}. Silakan coba lagi atau hubungi admin."
        )


@app.post(
    "/predict/image-render",
    tags=["prediction"],
    summary="Predict - Rendered Image Output",
    description="Upload gambar dan dapatkan gambar hasil deteksi dengan bounding boxes",
    response_class=Response,
    responses={
        200: {
            "description": "Gambar JPEG dengan bounding boxes dan labels",
            "content": {
                "image/jpeg": {
                    "example": "Binary image data"
                }
            }
        },
        400: {
            "description": "Bad Request - File bukan gambar valid",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal Server Error - Error saat inference",
            "model": ErrorResponse
        }
    }
)
async def predict_image_render(
    file: UploadFile = File(..., description="File gambar untuk dideteksi"),
    conf: float = Query(
        0.25,
        ge=0.0,
        le=1.0,
        description="Confidence threshold - kontrol sensitivitas deteksi",
        example=0.25
    ),
    iou: float = Query(
        0.45,
        ge=0.0,
        le=1.0,
        description="IoU threshold untuk NMS - kontrol overlap detection boxes",
        example=0.45
    )
):
    """
    ## Predict Objects - Rendered Image Output

    Upload gambar dan dapatkan gambar hasil dengan bounding boxes dan labels yang sudah di-render.

    **Input**:
    - `file`: File gambar (multipart/form-data)
    - `conf`: Confidence threshold (0.0-1.0, default: 0.25)
    - `iou`: IoU threshold (0.0-1.0, default: 0.45)

    **Output**:
    - JPEG image dengan:
      - Bounding boxes (kotak pembatas) di setiap objek terdeteksi
      - Label class name di atas setiap box
      - Confidence score di setiap label
      - Warna berbeda untuk setiap class

    **Use Case**:
    - Visualisasi hasil deteksi
    - Demo dan presentasi
    - Quality assurance
    - Dokumentasi hasil
    - User interface display

    **Format Output**: `image/jpeg`

    **Cara Download**:
    ```python
    import requests

    files = {'file': open('gambar.jpg', 'rb')}
    response = requests.post(
        'http://localhost:8000/predict/image-render',
        files=files,
        params={'conf': 0.25, 'iou': 0.45}
    )

    # Save rendered image
    with open('result.jpg', 'wb') as f:
        f.write(response.content)
    ```

    **Tips**:
    - Gunakan endpoint ini untuk preview visual
    - Gunakan `/predict/image` untuk mendapat koordinat deteksi
    - Hasil gambar dalam format JPEG untuk efisiensi size
    """
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image file. Pastikan file adalah gambar valid (JPEG, PNG, dll)"
            )

        # Run inference and render
        rendered_image = detector.predict_and_render(image, conf=conf, iou=iou)

        # Encode image to JPEG
        _, buffer = cv2.imencode('.jpg', rendered_image)
        image_bytes = buffer.tobytes()

        return Response(content=image_bytes, media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}. Silakan coba lagi atau hubungi admin."
        )


@app.get(
    "/models/info",
    response_model=ModelInfoResponse,
    tags=["model"],
    summary="Model Information",
    description="Mendapatkan informasi detail tentang model YOLOv8 yang sedang digunakan",
    responses={
        200: {
            "description": "Informasi model berhasil didapat",
            "content": {
                "application/json": {
                    "example": {
                        "model_path": "models/best.pt",
                        "class_names": {
                            "0": "nasi_merah",
                            "1": "roti_tawar",
                            "2": "nasi_putih"
                        },
                        "num_classes": 3
                    }
                }
            }
        }
    }
)
def model_info():
    """
    ## Model Information

    Mendapatkan informasi lengkap tentang model YOLOv8 yang sedang digunakan.

    **Response**:
    - `model_path`: Path ke file model (.pt)
    - `class_names`: Dictionary mapping class_id ke class_name
    - `num_classes`: Total jumlah class yang bisa dideteksi

    **Use Case**:
    - Debugging dan troubleshooting
    - Verifikasi model yang di-deploy
    - Dokumentasi sistem
    - Integrasi dengan UI (untuk menampilkan class list)

    **Contoh Response**:
    ```json
    {
      "model_path": "models/best.pt",
      "class_names": {
        "0": "nasi_merah",
        "1": "roti_tawar",
        "2": "nasi_putih",
        "3": "mie_goreng"
      },
      "num_classes": 4
    }
    ```

    **Tips**:
    - Gunakan `class_names` untuk mapping hasil deteksi ke nama yang human-readable
    - `num_classes` berguna untuk validasi model
    """
    return detector.get_model_info()


@app.get(
    "/nutrition/sources",
    tags=["nutrition"],
    summary="Sumber Nutrisi yang Tersedia",
    description="Cek sumber data nutrisi mana yang aktif (TKPI 2017 selalu aktif, FatSecret butuh API key)",
)
def nutrition_sources():
    return {
        "usda": usda_configured(),
        "fatsecret": fatsecret_configured(),
    }


@app.get(
    "/nutrition/{class_name}",
    response_model=NutritionResponse,
    tags=["nutrition"],
    summary="Informasi Nutrisi",
    description="Mendapatkan informasi nutrisi makanan per 100g. Gunakan `source=tkpi` (default) atau `source=fatsecret`.",
    responses={
        404: {
            "description": "Data nutrisi tidak ditemukan untuk kelas tersebut",
            "model": ErrorResponse
        },
        503: {
            "description": "FatSecret belum dikonfigurasi (CLIENT_ID / CLIENT_SECRET kosong)",
            "model": ErrorResponse
        }
    }
)
async def get_nutrition_info(
    class_name: str,
    source: str = Query(
        "usda",
        description="Sumber data nutrisi: `usda` (USDA FoodData Central) atau `fatsecret` (FatSecret API)",
        pattern="^(usda|fatsecret)$"
    )
):
    """
    ## Informasi Nutrisi Makanan

    Mendapatkan data nutrisi berdasarkan nama kelas dari hasil deteksi YOLOv8.

    **Query Parameter**:
    - `source=tkpi` *(default)* — data statis dari Tabel Komposisi Pangan Indonesia 2017 (offline)
    - `source=fatsecret` — data live dari FatSecret Platform API (butuh API key di `.env`)

    **Response** (per 100g):
    - `kalori`: Energi (kkal)
    - `karbohidrat`: Karbohidrat (g)
    - `protein`: Protein (g)
    - `lemak`: Lemak (g)
    - `serat`: Serat (g)
    - `sumber`: Referensi data (`TKPI 2017` atau `FatSecret`)

    **Contoh**:
    - `/nutrition/nasi_putih` → TKPI 2017
    - `/nutrition/nasi_putih?source=fatsecret` → FatSecret API
    """
    if source == "usda":
        if not usda_configured():
            raise HTTPException(
                status_code=503,
                detail="USDA belum dikonfigurasi. Set USDA_API_KEY di file .env"
            )
        try:
            data = await get_nutrition_usda(class_name)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Gagal mengambil data dari USDA: {str(e)}"
            )
        if not data:
            raise HTTPException(
                status_code=404,
                detail=f"Data nutrisi untuk '{class_name}' tidak ditemukan di USDA"
            )
        return {"class_name": class_name, "satuan": "per 100g", **data}

    # source == "fatsecret"
    if not fatsecret_configured():
        raise HTTPException(
            status_code=503,
            detail="FatSecret belum dikonfigurasi. Set FATSECRET_CLIENT_ID dan FATSECRET_CLIENT_SECRET di file .env"
        )
    try:
        data = await get_nutrition_fatsecret(class_name)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gagal mengambil data dari FatSecret: {str(e)}"
        )
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Data nutrisi untuk '{class_name}' tidak ditemukan di FatSecret"
        )
    return {"class_name": class_name, "satuan": "per 100g", **data}
