# API Usage Examples

Contoh lengkap penggunaan CarbFood Detector API.

## Base URL
```
http://localhost:8000
```

## Endpoints Summary

| Method | Endpoint | Deskripsi | Response |
|--------|----------|-----------|----------|
| GET | `/` | Root endpoint | JSON |
| GET | `/health` | Health check | JSON |
| POST | `/predict/image` | Deteksi → JSON | JSON |
| POST | `/predict/image-render` | Deteksi → Image | JPEG |
| GET | `/models/info` | Info model | JSON |

---

## 1. Health Check

Cek status API dan model.

### Request

```bash
curl http://localhost:8000/health
```

### Response

```json
{
  "status": "ok",
  "model": "models/best.pt",
  "model_loaded": true
}
```

---

## 2. Predict Image (JSON Output)

Upload gambar dan dapatkan hasil deteksi dalam JSON.

### Request (cURL)

```bash
curl -X POST "http://localhost:8000/predict/image?conf=0.25&iou=0.45" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@gambar_makanan.jpg"
```

### Request (Python)

```python
import requests

url = "http://localhost:8000/predict/image"
files = {"file": open("gambar_makanan.jpg", "rb")}
params = {
    "conf": 0.25,  # Confidence threshold
    "iou": 0.45    # IoU threshold
}

response = requests.post(url, files=files, params=params)
result = response.json()

print("Deteksi:")
for det in result["detections"]:
    print(f"- {det['class_name']}: {det['confidence']:.2%}")
```

### Request (JavaScript/Axios)

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('gambar_makanan.jpg'));

axios.post('http://localhost:8000/predict/image', form, {
  headers: form.getHeaders(),
  params: {
    conf: 0.25,
    iou: 0.45
  }
})
.then(response => {
  console.log('Deteksi:', response.data.detections);
})
.catch(error => {
  console.error('Error:', error.message);
});
```

### Response

```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "nasi_merah",
      "confidence": 0.9123,
      "bbox": [100.5, 200.3, 300.7, 400.9]
    },
    {
      "class_id": 1,
      "class_name": "roti_tawar",
      "confidence": 0.8547,
      "bbox": [450.2, 180.1, 600.3, 350.8]
    }
  ]
}
```

### Bbox Format
```
bbox: [x1, y1, x2, y2]
- x1, y1: Top-left corner (kiri atas)
- x2, y2: Bottom-right corner (kanan bawah)
- Unit: pixels
```

---

## 3. Predict Image (Rendered Image Output)

Upload gambar dan dapatkan gambar dengan bounding boxes.

### Request (cURL)

```bash
curl -X POST "http://localhost:8000/predict/image-render?conf=0.25&iou=0.45" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@gambar_makanan.jpg" \
  --output hasil_deteksi.jpg
```

### Request (Python)

```python
import requests

url = "http://localhost:8000/predict/image-render"
files = {"file": open("gambar_makanan.jpg", "rb")}
params = {"conf": 0.25, "iou": 0.45}

response = requests.post(url, files=files, params=params)

# Save rendered image
with open("hasil_deteksi.jpg", "wb") as f:
    f.write(response.content)

print("Gambar hasil deteksi disimpan ke hasil_deteksi.jpg")
```

### Request (JavaScript/Axios)

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('gambar_makanan.jpg'));

axios.post('http://localhost:8000/predict/image-render', form, {
  headers: form.getHeaders(),
  params: { conf: 0.25, iou: 0.45 },
  responseType: 'arraybuffer'
})
.then(response => {
  fs.writeFileSync('hasil_deteksi.jpg', response.data);
  console.log('Gambar tersimpan!');
})
.catch(error => {
  console.error('Error:', error.message);
});
```

### Response

Binary image data (JPEG) dengan bounding boxes dan labels.

---

## 4. Model Information

Lihat informasi tentang model yang digunakan.

### Request

```bash
curl http://localhost:8000/models/info
```

### Response

```json
{
  "model_path": "models/best.pt",
  "class_names": {
    "0": "nasi_merah",
    "1": "roti_tawar",
    "2": "nasi_putih",
    "3": "roti_gandum",
    "4": "mie_goreng"
  },
  "num_classes": 5
}
```

---

## Parameter Guidelines

### Confidence Threshold (conf)

| Nilai | Use Case | Karakteristik |
|-------|----------|---------------|
| 0.15-0.25 | Deteksi maksimal | Recall tinggi, banyak false positive |
| 0.25-0.35 | **Umum (Default)** | **Seimbang** |
| 0.40-0.60 | High precision | Precision tinggi, mungkin miss beberapa objek |
| 0.70-0.90 | Very high precision | Hanya objek yang sangat jelas |

### IoU Threshold (iou)

| Nilai | Use Case | Karakteristik |
|-------|----------|---------------|
| 0.30-0.40 | Objek overlap | Toleransi overlap tinggi |
| 0.45 | **Default** | **Seimbang** |
| 0.50-0.60 | Objek terpisah | Overlap rendah, objek jelas terpisah |

---

## Error Handling

### 400 Bad Request

**Penyebab**: File bukan gambar valid

**Response**:
```json
{
  "detail": "Invalid image file. Pastikan file adalah gambar valid (JPEG, PNG, dll)"
}
```

**Solusi**:
- Periksa format file (harus JPEG, PNG, BMP, dll)
- Pastikan file tidak corrupt
- Coba gambar lain

### 500 Internal Server Error

**Penyebab**: Error saat inference

**Response**:
```json
{
  "detail": "Prediction error: [error message]"
}
```

**Solusi**:
- Cek logs backend
- Restart service
- Coba dengan gambar berbeda
- Hubungi admin jika persisten

---

## Integration Examples

### React/Next.js

```typescript
// components/ImageDetector.tsx
import { useState } from 'react';
import axios from 'axios';

export default function ImageDetector() {
  const [image, setImage] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);

  const handleDetect = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await axios.post(
        'http://localhost:8000/predict/image',
        formData,
        { params: { conf: 0.25, iou: 0.45 } }
      );
      setResults(response.data);
    } catch (error) {
      console.error('Detection failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
      />
      <button onClick={handleDetect}>Detect</button>

      {results && (
        <div>
          <h3>Results:</h3>
          {results.detections.map((det: any, i: number) => (
            <div key={i}>
              {det.class_name}: {(det.confidence * 100).toFixed(1)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> detectFood(File imageFile) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://localhost:8000/predict/image?conf=0.25&iou=0.45'),
  );

  request.files.add(
    await http.MultipartFile.fromPath('file', imageFile.path),
  );

  var response = await request.send();
  var responseData = await response.stream.bytesToString();

  return json.decode(responseData);
}
```

### Kotlin (Android)

```kotlin
import okhttp3.*
import java.io.File

fun detectFood(imageFile: File, callback: (JSONObject) -> Unit) {
    val client = OkHttpClient()

    val requestBody = MultipartBody.Builder()
        .setType(MultipartBody.FORM)
        .addFormDataPart(
            "file",
            imageFile.name,
            RequestBody.create(MediaType.parse("image/*"), imageFile)
        )
        .build()

    val request = Request.Builder()
        .url("http://localhost:8000/predict/image?conf=0.25&iou=0.45")
        .post(requestBody)
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val json = JSONObject(response.body()?.string())
            callback(json)
        }

        override fun onFailure(call: Call, e: IOException) {
            e.printStackTrace()
        }
    })
}
```

---

## Testing

### Test dengan Sample Images

```bash
# Download sample image
curl -o sample.jpg https://example.com/food-image.jpg

# Test JSON endpoint
curl -X POST "http://localhost:8000/predict/image" \
  -F "file=@sample.jpg" \
  | jq .

# Test render endpoint
curl -X POST "http://localhost:8000/predict/image-render" \
  -F "file=@sample.jpg" \
  -o result.jpg
```

### Load Testing dengan Apache Bench

```bash
# Install apache bench
sudo apt install apache2-utils

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -p sample.jpg -T 'multipart/form-data' \
  http://localhost:8000/predict/image
```

---

## Best Practices

1. **Ukuran Gambar**: Resize ke max 1920x1080 untuk performa optimal
2. **Format**: Gunakan JPEG untuk ukuran file lebih kecil
3. **Batch Processing**: Kirim satu gambar per request (gunakan async untuk multiple)
4. **Error Handling**: Selalu handle error 400 dan 500
5. **Timeout**: Set timeout minimal 10 detik untuk CPU inference
6. **Caching**: Cache hasil jika gambar sama sering di-request
7. **Rate Limiting**: Implement rate limiting di production

---

## Troubleshooting

### Koneksi Ditolak
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Solusi**: Pastikan backend running di port 8000

### Timeout
```
Error: timeout of 5000ms exceeded
```
**Solusi**: Increase timeout (CPU inference bisa 2-5 detik)

### Invalid Image
```
400: Invalid image file
```
**Solusi**: Periksa format dan integritas file

### CORS Error (Browser)
```
Access to fetch blocked by CORS policy
```
**Solusi**: Backend sudah enable CORS untuk semua origin

---

## Support

Untuk pertanyaan atau issue:
- Lihat dokumentasi lengkap di `/docs`
- Check logs backend untuk debugging
- Gunakan `/health` untuk verifikasi service status
