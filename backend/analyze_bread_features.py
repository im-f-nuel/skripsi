"""
Analisis fitur warna dari kedua folder test (roti_tawar + roti_utuh)
untuk pilih threshold pct_crust yang aman.

Mencetak per-gambar: V_p25, V_mean, pct_white, S_mean, pct_crust.
Lalu meringkas distribusi per folder.
"""
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.yolo import YOLODetector
from app.bread_classifier import compute_color_stats

MODEL_PATH = Path(__file__).resolve().parent / "models" / "best.pt"
TEST_ROOT  = Path(r"F:\KULIAH SEM 8\Skripsi\image test")


def pct_crust(crop: np.ndarray) -> float:
    """% pixel berwarna golden-brown (crust loaf utuh).

    Hue OpenCV 0..179 — golden/brown crust ada di sekitar 10..25 (oranye-coklat).
    Saturation cukup tinggi (>= 80) untuk membuang background netral.
    Value range moderat (80..230) untuk membuang shadow & highlight.
    """
    if crop is None or crop.size == 0:
        return 0.0
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    mask = (h >= 8) & (h <= 25) & (s >= 80) & (v >= 80) & (v <= 230)
    return float(mask.mean() * 100)


def analyze(folder: Path, detector: YOLODetector, expected: str):
    print(f"\n{'='*100}")
    print(f"FOLDER: {folder.name}  (expected: {expected})")
    print("="*100)
    print(f"{'file':<45} {'V_p25':>6} {'V_mean':>7} {'pct_w':>6} {'S_mean':>7} {'pct_crust':>10} {'model':>11}")
    print("-"*100)

    rows = []
    for p in sorted(folder.iterdir()):
        if p.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        img = cv2.imread(str(p))
        if img is None:
            continue
        dets = detector.predict(img, conf=0.25, iou=0.45)
        if not dets:
            print(f"{p.name[:43]:<45}  (no detection)")
            continue
        top = max(dets, key=lambda d: d["confidence"])
        bbox = top["bbox"]
        # Crop & compute fitur
        h_img, w_img = img.shape[:2]
        x1, y1, x2, y2 = bbox
        x1 = max(0, int(round(x1))); y1 = max(0, int(round(y1)))
        x2 = min(w_img, int(round(x2))); y2 = min(h_img, int(round(y2)))
        crop = img[y1:y2, x1:x2]
        stats = compute_color_stats(crop)
        pc = pct_crust(crop)
        model_raw = top.get("original_class_name") or top["class_name"]
        print(f"{p.name[:43]:<45} {stats['V_p25']:>6.1f} {stats['V_mean']:>7.1f} "
              f"{stats['pct_white']:>6.1f} {stats['S_mean']:>7.1f} {pc:>10.1f} {model_raw:>11}")
        rows.append((stats["V_p25"], stats["V_mean"], stats["pct_white"], stats["S_mean"], pc))

    if rows:
        arr = np.array(rows)
        print("-"*100)
        print(f"{'MEAN':<45} {arr[:,0].mean():>6.1f} {arr[:,1].mean():>7.1f} "
              f"{arr[:,2].mean():>6.1f} {arr[:,3].mean():>7.1f} {arr[:,4].mean():>10.1f}")
        print(f"{'MIN ':<45} {arr[:,0].min():>6.1f} {arr[:,1].min():>7.1f} "
              f"{arr[:,2].min():>6.1f} {arr[:,3].min():>7.1f} {arr[:,4].min():>10.1f}")
        print(f"{'MAX ':<45} {arr[:,0].max():>6.1f} {arr[:,1].max():>7.1f} "
              f"{arr[:,2].max():>6.1f} {arr[:,3].max():>7.1f} {arr[:,4].max():>10.1f}")


def main():
    if not MODEL_PATH.exists():
        print(f"ERROR: model tidak ada di {MODEL_PATH}")
        return 1
    detector = YOLODetector(str(MODEL_PATH))
    analyze(TEST_ROOT / "roti_tawar", detector, "roti_tawar")
    analyze(TEST_ROOT / "roti_utuh",  detector, "roti_utuh")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
