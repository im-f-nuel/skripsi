"""
Test end-to-end: YOLODetector + bread_classifier heuristic untuk
kedua arah (roti_tawar slice + roti_utuh loaf).

Jalankan dari folder backend/:
    python test_bread_heuristic.py
"""
import sys
from pathlib import Path

import cv2

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.yolo import YOLODetector

MODEL_PATH = Path(__file__).resolve().parent / "models" / "best.pt"
TEST_ROOT  = Path(r"F:\KULIAH SEM 8\Skripsi\image test")


def evaluate(detector: YOLODetector, folder: Path, expected: str, *, clean_only: bool):
    if not folder.exists():
        print(f"SKIP: folder tidak ada {folder}")
        return
    imgs = sorted([
        p for p in folder.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png"} and p.is_file()
        and (not clean_only or (not p.name.startswith("ro1_") and not p.name.startswith("montage_")))
    ])

    print()
    print("=" * 92)
    print(f"FOLDER: {folder.name}  (expected={expected}, total={len(imgs)})")
    print("=" * 92)
    print(f"{'gambar':<45} {'model':<11} {'final':<11} {'override?':<10} {'score'}")
    print("-" * 92)

    correct = 0
    overridden = 0
    no_detection = 0
    for p in imgs:
        img = cv2.imread(str(p))
        if img is None:
            continue
        dets = detector.predict(img, conf=0.25, iou=0.45)
        if not dets:
            no_detection += 1
            print(f"{p.name[:43]:<45} {'(no det)'}")
            continue
        top = max(dets, key=lambda d: d["confidence"])
        model_class = top.get("original_class_name") or top["class_name"]
        final_class = top["class_name"]
        score = top.get("bread_score", "-")
        override = "OVERRIDE" if "original_class_name" in top else ""
        if "original_class_name" in top:
            overridden += 1
        if final_class == expected:
            correct += 1
        mark = " " if final_class == expected else "✗"
        print(f"{p.name[:43]:<45} {model_class:<11} {final_class:<11} {override:<10} {score} {mark}")

    detected = len(imgs) - no_detection
    print("-" * 92)
    if detected > 0:
        acc = correct / detected * 100
        print(f"  Akurasi: {correct}/{detected} = {acc:.1f}%   (overridden={overridden}, no_det={no_detection})")


def main() -> int:
    if not MODEL_PATH.exists():
        print(f"ERROR: model tidak ada di {MODEL_PATH}")
        return 1
    detector = YOLODetector(str(MODEL_PATH))
    evaluate(detector, TEST_ROOT / "roti_tawar", "roti_tawar", clean_only=True)
    evaluate(detector, TEST_ROOT / "roti_utuh",  "roti_utuh",  clean_only=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
