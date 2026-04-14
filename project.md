Berikut **dokumen project lengkap** untuk implementasi skripsi kamu: **Service Deteksi Makanan Karbohidrat berbasis YOLOv8 (best.pt) + API + Web Demo + Mobile Consume**. Format ini bisa kamu taruh jadi `README.md` / `PROJECT_DOC.md`.

---

# CarbFood Detector API & Demo (YOLOv8)

**Skripsi Implementation Project Document**

## 1) Ringkasan

Project ini mengimplementasikan model **YOLOv8** hasil training (`best.pt`) untuk **deteksi makanan karbohidrat** (mis. nasi merah/riceberry, roti tawar, dst) dalam bentuk:

* **REST API** (agar bisa di-consume dari mobile/web)
* **Web Demo** (upload gambar dan lihat hasil deteksi)
* (Opsional) **Mobile Demo** (Flutter/Kotlin) sebagai consumer API

Tujuan utama: membuktikan model hasil penelitian bisa dipakai pada sistem nyata (deployment-ready) dan menghasilkan output deteksi yang terukur (bbox, confidence, class).

---

## 2) Tujuan Project

### 2.1 Tujuan Umum

Membangun sistem layanan deteksi objek makanan karbohidrat berbasis YOLOv8 yang dapat diakses melalui API dan digunakan oleh aplikasi web/mobile.

### 2.2 Tujuan Khusus

1. Menyediakan endpoint API untuk:

   * prediksi dari gambar
   * output JSON (bbox, confidence, class)
   * output gambar hasil overlay bbox
2. Menyediakan UI web demo untuk pengujian model (upload & tampil hasil).
3. Menyediakan dokumentasi dan prosedur deployment agar dapat direplikasi.
4. Menyediakan modul evaluasi dan pengujian endpoint (test request, logging).

---

## 3) Ruang Lingkup

### 3.1 In-Scope

* Inference YOLOv8 `.pt` di server (CPU/GPU)
* Endpoint upload gambar (multipart/form-data)
* Output:

  * JSON deteksi
  * gambar hasil deteksi (render overlay)
* Web demo untuk uji coba
* Docker & deployment guide

### 3.2 Out-of-Scope (opsional tahap lanjut)

* Streaming realtime video (RTSP/WebRTC) (bisa tahap 2)
* Training ulang di server (fokus inference)
* Database besar untuk dataset (cukup logging sederhana)

---

## 4) User & Use Case

### 4.1 User

* **Mahasiswa/peneliti**: menguji performa model dan demo skripsi
* **Pengguna aplikasi mobile**: memotret makanan → dapat hasil deteksi

### 4.2 Use Case Utama

1. User upload foto makanan karbohidrat → sistem mengembalikan hasil deteksi (bbox + confidence).
2. User melihat foto yang sudah di-overlay bbox → validasi visual.
3. (Opsional) User atur threshold confidence → melihat pengaruh filter deteksi.

---

## 5) Kebutuhan Fungsional

### 5.1 Backend/API

* [F01] Endpoint cek status layanan dan model (`/health`)
* [F02] Endpoint prediksi dari gambar → output JSON (`/predict/image`)
* [F03] Endpoint prediksi dari gambar → output gambar overlay (`/predict/image-render`)
* [F04] Parameter `conf` dan `iou` dapat diubah via query untuk kontrol threshold
* [F05] Menangani error input gambar invalid (response jelas)

### 5.2 Web Demo

* [F06] Upload gambar
* [F07] Tampilkan hasil render (gambar bbox)
* [F08] Tampilkan tabel deteksi (class, confidence, bbox)
* [F09] Input slider/field untuk `conf` & `iou`

### 5.3 Mobile Consumer (opsional)

* [F10] Ambil gambar dari kamera/galeri
* [F11] Kirim gambar ke API (multipart)
* [F12] Tampilkan hasil (JSON/table atau gambar overlay)

---

## 6) Kebutuhan Non-Fungsional

* [NF01] Response time inference wajar (tergantung device; target < 2–5 detik per gambar di CPU laptop)
* [NF02] Konsisten (hasil sama pada input sama & threshold sama)
* [NF03] Aman dari input berbahaya dasar (validasi file type & size)
* [NF04] Mudah dipasang ulang (reproducible dengan Docker)

---

## 7) Teknologi yang Digunakan (Rekomendasi)

### Backend (Inference Service)

* Python 3.10+
* FastAPI
* Uvicorn
* Ultralytics YOLOv8
* OpenCV (untuk decode/encode gambar)
* Docker (deployment)

### Frontend Web Demo

* Next.js / Vite + React
* Axios/fetch untuk call API

### Mobile (Opsional)

* Flutter (dio/http) atau Kotlin (OkHttp/Retrofit)

---

## 8) Arsitektur Sistem

**Client (Web/Mobile) → REST API → YOLOv8 Model (best.pt) → Output JSON / Rendered Image**

Komponen:

1. **Inference API**

   * memuat model `best.pt` sekali saat startup
   * menerima file image → prediksi → mengembalikan hasil
2. **Web UI**

   * upload & tampilkan output
3. **(Opsional) Mobile App**

   * foto → request API → tampil hasil

---

## 9) Struktur Repository (Disarankan: Monorepo)

```
carbfood-yolov8-system/
  backend/
    app/
      main.py
      yolo.py
    models/
      best.pt
    requirements.txt
    Dockerfile
    README.md
  web/
    src/
    package.json
    README.md
  mobile/                 # opsional
    README.md
  docs/
    API_SPEC.md
    ARCHITECTURE.md
    THESIS_IMPLEMENTATION.md
```

Kalau kamu mau lebih sederhana: cukup `backend/` dulu.

---

## 10) Spesifikasi API

### 10.1 Health Check

**GET** `/health`

Response:

```json
{
  "status": "ok",
  "model": "best.pt"
}
```

### 10.2 Predict JSON

**POST** `/predict/image?conf=0.25&iou=0.45`
Body: `multipart/form-data` field `file`

Response:

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

### 10.3 Predict Rendered Image

**POST** `/predict/image-render?conf=0.25&iou=0.45`
Body: `multipart/form-data` field `file`

Response:

* `image/jpeg` (gambar sudah ada bbox overlay)

### 10.4 Error Response (contoh)

* 400 jika file bukan image / decode gagal:

```json
{ "detail": "Invalid image" }
```

---

## 11) Setup & Instalasi (Local Development)

### 11.1 Backend

Masuk folder:

```bash
cd backend
```

Buat environment & install:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Pastikan file model ada:

```
backend/models/best.pt
```

Run server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Testing:

* Swagger UI: `http://localhost:8000/docs`

### 11.2 Web Demo (opsional)

```bash
cd web
npm install
npm run dev
```

---

## 12) Docker (Deployment Ready)

### 12.1 Backend Dockerfile (ringkas)

Target: build image dan run service.

Contoh konsep:

* base python
* install requirements
* copy `app/` dan `models/`
* expose 8000
* run uvicorn

(Ini bisa kamu implement langsung di `backend/Dockerfile`)

Run:

```bash
docker build -t carbfood-api ./backend
docker run -p 8000:8000 carbfood-api
```

---

## 13) Deployment (Opsi)

Paling umum dan gampang:

1. **VPS** (Ubuntu): Docker + Nginx reverse proxy
2. **Cloud Run** (Google) / **Render** / **Railway**
3. Jika butuh GPU: **server GPU** / **cloud GPU**

Catatan:

* Untuk skripsi, deployment di laptop + demo local biasanya cukup, tapi punya Docker + dokumentasi deployment itu nilai plus.

---

## 14) Pengujian (Testing Plan)

### 14.1 Functional Testing

* Upload beberapa gambar sample:

  * gambar yang jelas (target harus terdeteksi)
  * gambar blur / gelap (lihat perubahan confidence)
  * gambar tanpa objek target (harus kosong/false positive minimal)
* Uji parameter:

  * `conf` dinaikkan → deteksi berkurang tapi lebih yakin
  * `iou` mempengaruhi overlap box/NMS

### 14.2 Performance Testing (sederhana)

* Catat waktu respons per image
* Bandingkan CPU vs GPU (jika ada)

### 14.3 Reliability

* Jalankan 20–50 request beruntun, pastikan tidak crash dan memory stabil.

---

## 15) Logging & Output untuk Bab Implementasi

Agar gampang masuk Bab 4:

* Simpan output request (JSON) untuk beberapa sample gambar
* Simpan screenshot web demo (sebelum & sesudah render)
* Buat tabel:

  * gambar ke-1: jumlah deteksi, class, confidence tertinggi
  * gambar ke-2: dst
* Jelaskan penggunaan threshold (conf/iou) sebagai kontrol kualitas hasil

---

## 16) Mapping ke Skripsi (Bab Implementasi)

Yang bisa kamu tulis:

1. **Desain sistem** (arsitektur client-server)
2. **Implementasi backend** (FastAPI + YOLOv8)
3. **Implementasi UI web** (upload → hasil)
4. **Skenario pengujian** (threshold, variasi kondisi foto)
5. **Hasil implementasi** (contoh output JSON + screenshot overlay)

---

## 17) Risiko & Mitigasi

* **False positive**: tambah data training, perbaiki labeling, tuning conf threshold
* **Model berat di CPU**: resize input, gunakan image lebih kecil, atau GPU
* **Input buruk (blur)**: arahkan user pakai cahaya cukup, jarak wajar

---

## 18) Roadmap Pengembangan

### Tahap 1 (MVP)

* API inference + JSON + render image
* Web demo upload

### Tahap 2

* Mobile app consume API
* Logging history (opsional)

### Tahap 3 (opsional)

* Realtime camera streaming
* Optimasi ONNX/TensorRT (jika butuh cepat)

---

## 19) Checklist Deliverables (yang kamu bisa kumpulkan)

* `best.pt` (model final)
* Source code backend (FastAPI)
* Dokumentasi endpoint (API_SPEC)
* Web demo (upload & hasil)
* Bukti pengujian (screenshots + JSON sample)
* Dockerfile + cara run

---

Kalau kamu mau, saya bisa sekalian:

1. bikinin **file-file nyata** (backend + web) dengan struktur repo di atas, **siap kamu copy**, atau
2. kamu kirim `names:` dari `data.yaml` model kamu, nanti saya sesuaikan dokumentasi output dan contoh class sesuai skripsi kamu.
