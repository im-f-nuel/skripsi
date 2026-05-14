"""
YOLOv8 Inference Wrapper
"""
import os

# Nonaktifkan update check & telemetry Ultralytics agar tidak hang saat offline/koneksi lambat
os.environ.setdefault('YOLO_VERBOSE', '0')
os.environ.setdefault('ULTRALYTICS_AUTO_UPDATE', '0')

from typing import List, Dict, Any, Optional
import numpy as np
from ultralytics import YOLO
from ultralytics.utils import SETTINGS
SETTINGS.update({'sync': False})

from .bread_classifier import classify_bread_by_color

BREAD_CLASSES = {"roti_tawar", "roti_utuh"}


class YOLODetector:
    """Wrapper class for YOLOv8 model inference"""

    def __init__(self, model_path: str):
        """
        Initialize YOLO detector

        Args:
            model_path: Path to YOLOv8 model file (.pt)
        """
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load YOLOv8 model from file"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found: {self.model_path}")

        print(f"Loading YOLOv8 model from {self.model_path}...")
        self.model = YOLO(self.model_path)
        print(f"Model loaded successfully. Classes: {self.model.names}")

    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None

    def predict(
        self,
        image: np.ndarray,
        conf: float = 0.25,
        iou: float = 0.45
    ) -> List[Dict[str, Any]]:
        """
        Run inference on image and return detections

        Args:
            image: Input image as numpy array (BGR format)
            conf: Confidence threshold
            iou: IoU threshold for NMS

        Returns:
            List of detections, each containing:
                - class_id: int
                - class_name: str
                - confidence: float
                - bbox: [x1, y1, x2, y2]
        """
        if not self.is_loaded():
            raise RuntimeError("Model not loaded")

        # Run inference
        results = self.model.predict(
            image,
            conf=conf,
            iou=iou,
            verbose=False
        )

        # Build reverse map sekali: class_name -> class_id (utk override roti_tawar/utuh)
        name_to_id = {v: k for k, v in self.model.names.items()}

        # Parse results
        detections = []
        for result in results:
            boxes = result.boxes
            for i in range(len(boxes)):
                class_id = int(boxes.cls[i])
                class_name = self.model.names[class_id]
                confidence = float(boxes.conf[i])
                bbox = boxes.xyxy[i].cpu().numpy().tolist()  # [x1, y1, x2, y2]

                det = {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": round(confidence, 4),
                    "bbox": [round(coord, 2) for coord in bbox],
                }

                # Post-processing roti_tawar vs roti_utuh: model YOLOv8 cenderung
                # bias ke roti_utuh karena dataset asli labelnya tidak konsisten.
                # Override ONE-WAY saja: utuh → tawar bila heuristic yakin slice.
                # Kalau model sudah bilang roti_tawar, percaya saja (model jarang
                # salah ke arah ini, dan classifier kadang false-positive crust).
                if class_name == "roti_utuh":
                    pred, score, stats = classify_bread_by_color(image, bbox)
                    if pred == "roti_tawar":
                        new_id = name_to_id.get(pred, class_id)
                        det["original_class_name"] = class_name
                        det["class_name"] = pred
                        det["class_id"]   = new_id
                    det["bread_score"] = score
                elif class_name == "roti_tawar":
                    # Tidak ditimpa, hanya catat score utk transparansi.
                    _, score, _ = classify_bread_by_color(image, bbox)
                    det["bread_score"] = score

                detections.append(det)

        return detections

    def predict_and_render(
        self,
        image: np.ndarray,
        conf: float = 0.25,
        iou: float = 0.45
    ) -> np.ndarray:
        """
        Run inference and return image with bounding boxes drawn.

        Non-bread classes: rendered via YOLO's native result.plot() (PIL font, anti-aliased).
        Bread classes (roti_tawar/roti_utuh): rendered via Ultralytics Annotator with the
        heuristic-corrected label, same visual style as YOLO native.
        """
        import torch
        from ultralytics.utils.plotting import Annotator, colors as yolo_colors

        if not self.is_loaded():
            raise RuntimeError("Model not loaded")

        results = self.model.predict(image, conf=conf, iou=iou, verbose=False)

        if not results or len(results[0].boxes) == 0:
            return image

        result = results[0]
        name_to_id = {v: k for k, v in self.model.names.items()}

        bread_dets = []
        non_bread_flags = []

        for i in range(len(result.boxes)):
            cls_id   = int(result.boxes.cls[i])
            cls_name = self.model.names[cls_id]
            conf_val = float(result.boxes.conf[i])
            bbox     = result.boxes.xyxy[i].cpu().numpy().tolist()

            if cls_name in BREAD_CLASSES:
                non_bread_flags.append(False)
                if cls_name == "roti_utuh":
                    pred, _, _ = classify_bread_by_color(image, bbox)
                    final_class = pred
                    final_id    = name_to_id.get(pred, cls_id)
                else:
                    final_class = cls_name
                    final_id    = cls_id
                bread_dets.append({
                    "class_id":   final_id,
                    "class_name": final_class,
                    "confidence": conf_val,
                    "bbox":       bbox,
                })
            else:
                non_bread_flags.append(True)

        # Non-bread: bawaan YOLO (PIL font, warna palette resmi)
        non_bread_mask = torch.tensor(non_bread_flags, dtype=torch.bool)
        if non_bread_mask.any():
            result.boxes = result.boxes[non_bread_mask]
            rendered = result.plot()
        else:
            rendered = image.copy()

        # Bread: Annotator dengan style persis sama YOLO tapi label sudah dikoreksi
        if bread_dets:
            annotator = Annotator(rendered)
            for det in bread_dets:
                label = f'{det["class_name"]} {det["confidence"]:.2f}'
                color = yolo_colors(det["class_id"], bgr=True)
                annotator.box_label(det["bbox"], label, color=color)
            rendered = annotator.result()

        return rendered

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        if not self.is_loaded():
            return {"error": "Model not loaded"}

        return {
            "model_path": self.model_path,
            "class_names": self.model.names,
            "num_classes": len(self.model.names)
        }
