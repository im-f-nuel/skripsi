# Panduan Menjalankan CarbFood Detector Secara Lokal

## Persiapan Awal

### 1. Install Python 3.10+
Pastikan Python sudah terinstall:
```bash
python --version
```

### 2. Install Node.js 18+
Download dari https://nodejs.org atau cek:
```bash
node --version
npm --version
```

## Langkah 1: Setup & Jalankan Backend

### A. Masuk ke folder backend
```bash
cd backend
```

### B. Buat Virtual Environment
```bash
python -m venv .venv
```

### C. Aktifkan Virtual Environment

**Windows (CMD):**
```bash
.venv\Scripts\activate
```

**Windows (PowerShell):**
```bash
.venv\Scripts\Activate.ps1
```

**Mac/Linux:**
```bash
source .venv/bin/activate
```

Jika berhasil, akan muncul `(.venv)` di awal prompt terminal.

### D. Install Dependencies
```bash
pip install -r requirements.txt
```

Proses ini akan memakan waktu beberapa menit (download PyTorch, Ultralytics, dll).

### E. Download Model Sample (Untuk Testing)

**Karena best.pt belum ada, download model sample dulu:**

```bash
python download_sample_model.py
```

Model YOLOv8n akan didownload ke `models/best.pt` (sekitar 6MB).

**CATATAN:** Model ini untuk testing saja. Deteksi 80 COCO classes (person, car, dog, dll), bukan makanan karbohidrat. Nanti ganti dengan `best.pt` hasil training kamu.

### F. Jalankan Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Output yang diharapkan:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
Loading YOLOv8 model from models/best.pt...
Model loaded successfully. Classes: {0: 'person', 1: 'bicycle', ...}
```

**Jangan tutup terminal ini!** Biarkan backend tetap running.

### G. Test Backend

Buka browser baru, akses:
- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

Atau test via curl:
```bash
curl http://localhost:8000/health
```

Harusnya return:
```json
{
  "status": "ok",
  "model": "models/best.pt",
  "model_loaded": true
}
```

---

## Langkah 2: Setup & Jalankan Frontend

**BUKA TERMINAL BARU** (jangan tutup terminal backend!)

### A. Masuk ke folder web
```bash
cd web
```

### B. Install Dependencies

**Menggunakan npm:**
```bash
npm install
```

**Atau menggunakan bun (lebih cepat):**
```bash
bun install
```

Proses ini download semua dependencies React, Vite, dll.

### C. Jalankan Development Server

**Menggunakan npm:**
```bash
npm run dev
```

**Atau menggunakan bun:**
```bash
bun run dev
```

**Output yang diharapkan:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### D. Akses Web Demo

Buka browser:
**http://localhost:3000**

---

## Testing Aplikasi

### 1. Upload Gambar
- Klik area upload atau drag-drop gambar
- Gunakan foto apapun dulu (karena pakai model sample)

### 2. Atur Threshold (Opsional)
- **Confidence**: 0.25 (default)
- **IoU**: 0.45 (default)

### 3. Klik "Detect Objects"
- Tunggu 2-5 detik
- Hasil deteksi akan muncul (gambar + tabel)

### 4. Lihat Hasil
- Gambar dengan bounding box
- Tabel deteksi (class, confidence, bbox)

---

## Troubleshooting

### Backend Error: ModuleNotFoundError

**Masalah:** Import error atau module tidak ditemukan

**Solusi:**
1. Pastikan virtual environment aktif (ada `(.venv)` di prompt)
2. Re-install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Backend Error: Model file not found

**Masalah:** FileNotFoundError: Model file not found

**Solusi:**
```bash
# Pastikan di folder backend, lalu:
python download_sample_model.py
```

### Frontend Error: ECONNREFUSED

**Masalah:** Frontend tidak bisa connect ke backend

**Solusi:**
1. Pastikan backend running di http://localhost:8000
2. Test backend: http://localhost:8000/health
3. Restart frontend

### Port Sudah Digunakan

**Backend (port 8000):**
```bash
# Ganti port di command
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Frontend (port 3000):**
Edit `web/vite.config.ts`, ubah port:
```typescript
server: {
  port: 3001,  // ganti dari 3000
  ...
}
```

---

## Struktur Terminal

Setelah semua running, akan ada 2 terminal:

**Terminal 1 - Backend:**
```
(.venv) PS P:\Skripsi\service\CarbFood Detector\backend>
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
INFO:     Uvicorn running on http://0.0.0.0:8000
...
```

**Terminal 2 - Frontend:**
```
PS P:\Skripsi\service\CarbFood Detector\web>
npm run dev
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
...
```

---

## Mengganti dengan Model Kamu Sendiri

Ketika model hasil training kamu (`best.pt`) sudah siap:

### 1. Stop Backend (Ctrl+C di terminal backend)

### 2. Ganti Model
```bash
# Copy best.pt ke folder models
copy /path/ke/best.pt backend/models/best.pt
```

### 3. Jalankan Ulang Backend
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Model akan auto-reload dan siap deteksi makanan karbohidrat!

---

## Stop Aplikasi

**Backend:** Ctrl+C di terminal backend
**Frontend:** Ctrl+C di terminal frontend

---

## Next Steps

Setelah berhasil running lokal:
1. ✅ Test dengan berbagai gambar
2. ✅ Coba atur threshold confidence & IoU
3. ✅ Screenshot hasil untuk dokumentasi skripsi
4. ✅ Ganti dengan model best.pt hasil training
5. ✅ Siap deploy dengan Docker Compose

---

## Quick Reference

| Service  | URL                          | Kegunaan              |
|----------|------------------------------|-----------------------|
| Frontend | http://localhost:3000        | Web Demo UI           |
| Backend  | http://localhost:8000/docs   | API Documentation     |
| Health   | http://localhost:8000/health | Check Backend Status  |

**Happy Testing! 🚀**
