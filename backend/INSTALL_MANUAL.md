# Panduan Install Manual Backend

## Persiapan

- Python 3.10+ sudah terinstall (cek: `python --version`)
- Berada di folder `backend`

## Langkah 1: Masuk ke Folder Backend

```bash
cd "F:\KULIAH SEM 8\Skripsi\service\CarbFood Detector\backend"
```

> Sesuaikan path dengan lokasi folder project Anda.

## Langkah 2: Buat Virtual Environment Baru

**PENTING:** Jika sudah ada folder `.venv` lama (terutama jika folder project pernah dipindah), hapus dulu:

```bash
rmdir /s /q .venv
```

Buat venv baru:

```bash
python -m venv .venv
```

Tunggu hingga selesai (bisa 1-5 menit, tergantung antivirus).

## Langkah 3: Install pip

```bash
.venv\Scripts\python.exe -m ensurepip --upgrade
```

## Langkah 4: Install Dependencies

```bash
.venv\Scripts\python.exe -m pip install fastapi "uvicorn[standard]" python-multipart pillow numpy opencv-python
```

Lalu install ultralytics + PyTorch (file besar ~500MB-1GB, butuh waktu):

```bash
.venv\Scripts\python.exe -m pip install ultralytics
```

## Langkah 5: Verifikasi

```bash
.venv\Scripts\python.exe -c "import fastapi; import uvicorn; import torch; import ultralytics; print('Semua library berhasil terinstall!')"
```

## Langkah 6: Jalankan Backend

```bash
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Tunggu hingga muncul:
```
INFO:     Application startup complete.
```

Backend siap di: http://localhost:8000/docs

---

## Troubleshooting

### Venv tidak bisa diaktifkan / "cannot find the file specified"
- **Penyebab:** Folder project pernah dipindah, path di venv sudah tidak valid.
- **Solusi:** Hapus `.venv` dan buat ulang dari Langkah 2.

### `uvicorn` / `pip` not recognized
- **Penyebab:** Menggunakan `uvicorn` atau `pip` langsung tanpa path venv.
- **Solusi:** Selalu gunakan `.venv\Scripts\python.exe -m uvicorn` dan `.venv\Scripts\python.exe -m pip`.

### PowerShell: "running scripts is disabled"
- **Penyebab:** Execution policy PowerShell memblokir `.ps1`.
- **Solusi:** Gunakan CMD (bukan PowerShell), atau gunakan perintah dengan `python.exe -m` seperti di atas.

### Install lambat / hang saat loading model
- **Penyebab:** Windows Defender scanning file.
- **Solusi:** Tambahkan folder project ke exclusion Windows Defender, lalu coba lagi.

### Pip notice "new release available"
- Bukan error, abaikan saja. Install tetap berhasil.

---

## Jalankan Frontend (web-skripsi)

```bash
cd "..\web-skripsi"
npm install
node "F:\instalasi\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```

Atau jika `npm` langsung bisa dipakai di CMD:

```bash
npm run dev
```

Frontend thesis: http://localhost:3001
