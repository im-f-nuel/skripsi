# CarbFood Detector - Backend API

FastAPI-based REST API for carbohydrate food detection using YOLOv8.

## Prerequisites

- Python 3.10 or higher
- YOLOv8 model file (`best.pt`) placed in `models/` directory

## Setup

### 1. Create Virtual Environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Add Model File

Place your trained YOLOv8 model file at:
```
backend/models/best.pt
```

**Important:** The `best.pt` file is required to run the API. Make sure it exists before starting the server.

## Running the API

### Development Mode (with auto-reload)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### GET /health
Check service status and model information.

**Response:**
```json
{
  "status": "ok",
  "model": "models/best.pt",
  "model_loaded": true
}
```

### POST /predict/image
Upload image and get JSON detections.

**Parameters:**
- `file` (form-data): Image file
- `conf` (query, optional): Confidence threshold (0.0-1.0, default 0.25)
- `iou` (query, optional): IoU threshold (0.0-1.0, default 0.45)

**Response:**
```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "nasi_merah",
      "confidence": 0.91,
      "bbox": [100.5, 200.3, 300.7, 400.9]
    }
  ]
}
```

### POST /predict/image-render
Upload image and get rendered image with bounding boxes.

**Parameters:**
- `file` (form-data): Image file
- `conf` (query, optional): Confidence threshold (0.0-1.0, default 0.25)
- `iou` (query, optional): IoU threshold (0.0-1.0, default 0.45)

**Response:**
- Content-Type: `image/jpeg`
- Body: JPEG image with detection boxes drawn

### GET /models/info
Get information about the loaded model.

**Response:**
```json
{
  "model_path": "models/best.pt",
  "class_names": {
    "0": "nasi_merah",
    "1": "roti_tawar"
  },
  "num_classes": 2
}
```

## Docker Deployment

### Build Image

```bash
docker build -t carbfood-api .
```

### Run Container

```bash
docker run -p 8000:8000 carbfood-api
```

### Run with Model Volume (if model not in image)

```bash
docker run -p 8000:8000 -v /path/to/models:/app/models carbfood-api
```

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:8000/health

# Predict (JSON)
curl -X POST "http://localhost:8000/predict/image?conf=0.25&iou=0.45" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/image.jpg"

# Predict (rendered image)
curl -X POST "http://localhost:8000/predict/image-render?conf=0.25&iou=0.45" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/image.jpg" \
  --output result.jpg
```

### Using Python

```python
import requests

# Predict
url = "http://localhost:8000/predict/image"
files = {"file": open("image.jpg", "rb")}
params = {"conf": 0.25, "iou": 0.45}
response = requests.post(url, files=files, params=params)
print(response.json())
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application
│   └── yolo.py          # YOLOv8 inference wrapper
├── models/
│   └── best.pt          # YOLOv8 model (add this file)
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker configuration
├── .dockerignore
├── .gitignore
└── README.md
```

## Troubleshooting

### Model file not found
**Error:** `FileNotFoundError: Model file not found: models/best.pt`

**Solution:** Ensure `best.pt` exists in the `models/` directory.

### Invalid image error
**Error:** `HTTP 400: Invalid image file`

**Solution:** Verify the uploaded file is a valid image format (JPEG, PNG, etc.).

### GPU support
To use GPU acceleration, ensure:
1. CUDA is installed on your system
2. PyTorch with CUDA support is installed
3. YOLOv8 will automatically use GPU if available

## Performance Notes

- First request may be slower due to model warmup
- CPU inference: ~2-5 seconds per image (depends on image size and model)
- GPU inference: Significantly faster (~0.1-0.5 seconds)
- Consider image size limits for production (e.g., max 5MB)
