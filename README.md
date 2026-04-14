# CarbFood Detector

YOLOv8-based carbohydrate food detection system with REST API and web demo.

## Project Structure

```
CarbFood Detector/
├── backend/              # FastAPI backend with YOLOv8
│   ├── app/
│   │   ├── main.py      # API endpoints
│   │   └── yolo.py      # YOLOv8 wrapper
│   ├── models/
│   │   └── best.pt      # YOLOv8 model (add this)
│   ├── requirements.txt
│   └── Dockerfile
├── web/                  # React web demo
│   ├── src/
│   │   ├── components/  # UI components
│   │   └── types/       # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml    # Run both services
├── CLAUDE.md            # Claude Code guidance
└── project.md           # Project documentation
```

## Quick Start with Docker Compose (Recommended)

### Prerequisites
- Docker Desktop installed
- YOLOv8 model file (`best.pt`) in `backend/models/`

### 1. Add Your Model
```bash
# Place your trained YOLOv8 model here:
backend/models/best.pt
```

### 2. Run with Docker Compose
```bash
# Build and start both services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 3. Access the Application
- **Web Demo**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health

### 4. Stop Services
```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Manual Setup (Development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd web

# Install dependencies
npm install
# or
bun install

# Run development server
npm run dev
# or
bun run dev
```

Access at http://localhost:3000

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/health
```

### Predict (JSON)
```bash
POST http://localhost:8000/predict/image?conf=0.25&iou=0.45
Content-Type: multipart/form-data
Body: file=<image>
```

### Predict (Rendered Image)
```bash
POST http://localhost:8000/predict/image-render?conf=0.25&iou=0.45
Content-Type: multipart/form-data
Body: file=<image>
```

### Model Info
```bash
GET http://localhost:8000/models/info
```

## Testing the API

### Using cURL
```bash
# Health check
curl http://localhost:8000/health

# Predict with image
curl -X POST "http://localhost:8000/predict/image?conf=0.25&iou=0.45" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/image.jpg"
```

### Using Python
```python
import requests

url = "http://localhost:8000/predict/image"
files = {"file": open("image.jpg", "rb")}
params = {"conf": 0.25, "iou": 0.45}
response = requests.post(url, files=files, params=params)
print(response.json())
```

## Docker Commands

### Build Services Separately
```bash
# Backend
docker build -t carbfood-backend ./backend

# Frontend
docker build -t carbfood-frontend ./web
```

### Run Services Separately
```bash
# Backend
docker run -p 8000:8000 -v ./backend/models:/app/models carbfood-backend

# Frontend
docker run -p 3000:80 carbfood-frontend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Rebuild After Changes
```bash
# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

## Configuration

### Backend Settings
- **Port**: 8000 (configurable in docker-compose.yml)
- **Model Path**: `models/best.pt`
- **Workers**: 1 (configurable in Dockerfile CMD)

### Frontend Settings
- **Port**: 3000 (mapped to nginx:80)
- **API Proxy**: `/api/*` → `http://backend:8000/*`

### Thresholds (Adjustable via UI)
- **Confidence**: 0.25 (default)
- **IoU**: 0.45 (default)

## Troubleshooting

### Model file not found
**Error**: `FileNotFoundError: Model file not found: models/best.pt`

**Solution**: Ensure `best.pt` exists in `backend/models/` before building

### Backend not responding
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend can't connect to backend
**Solution**: Ensure both services are in the same Docker network (handled by docker-compose)

### Port already in use
```bash
# Change ports in docker-compose.yml
# Backend: "8001:8000"
# Frontend: "3001:80"
```

### GPU Support (Optional)
To use GPU acceleration, modify `backend/Dockerfile` and `docker-compose.yml`:

```yaml
# In docker-compose.yml, add to backend service:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

## Performance Notes

- **CPU Inference**: ~2-5 seconds per image
- **GPU Inference**: ~0.1-0.5 seconds per image
- **First Request**: May be slower due to model warmup
- **Recommended**: Use GPU for production deployments

## Production Deployment

### Using Docker Compose on VPS

```bash
# Clone repository
git clone <your-repo>
cd CarbFood\ Detector

# Add model file
cp /path/to/best.pt backend/models/

# Run in production mode
docker-compose up -d

# Set up nginx reverse proxy (optional)
# Configure SSL/HTTPS
```

### Environment Variables

Create `.env` file for production settings:
```bash
# Backend
WORKERS=4
LOG_LEVEL=info

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

## Tech Stack

### Backend
- Python 3.10+
- FastAPI
- Uvicorn
- Ultralytics YOLOv8
- OpenCV

### Frontend
- React 18
- TypeScript
- Vite
- Nginx (production)

### DevOps
- Docker
- Docker Compose
- Nginx reverse proxy

## License

Part of thesis implementation project.

## Support

For issues or questions, please refer to:
- Backend README: `backend/README.md`
- Frontend README: `web/README.md`
- API Documentation: http://localhost:8000/docs
