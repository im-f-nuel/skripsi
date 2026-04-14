"""
Script untuk download model YOLOv8 sample untuk testing
Jalankan: python download_sample_model.py
"""
from ultralytics import YOLO
import os

# Buat folder models jika belum ada
os.makedirs("models", exist_ok=True)

print("Downloading YOLOv8n (nano) model untuk testing...")
print("Model ini bisa deteksi 80 COCO classes (person, car, etc)")
print("Nanti bisa diganti dengan best.pt hasil training kamu\n")

# Download model YOLOv8 nano (paling kecil dan cepat)
model = YOLO('yolov8n.pt')

# Copy ke models/best.pt
import shutil
shutil.copy('yolov8n.pt', 'models/best.pt')

print("✓ Model berhasil didownload ke models/best.pt")
print("✓ Sekarang bisa jalankan backend!")
print("\nCatatan: Model ini deteksi 80 COCO classes, bukan makanan karbohidrat")
print("Ganti dengan best.pt hasil training untuk deteksi makanan karbohidrat")
