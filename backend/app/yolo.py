"""
YOLOv8 Inference Wrapper
"""
import os

# Nonaktifkan update check & telemetry Ultralytics agar tidak hang saat offline/koneksi lambat
os.environ.setdefault('YOLO_VERBOSE', '0')
os.environ.setdefault('ULTRALYTICS_AUTO_UPDATE', '0')

from typing import List, Dict, Any, Optional
import numpy as np
import cv2
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
        Run inference and return image with bounding boxes drawn

        Args:
            image: Input image as numpy array (BGR format)
            conf: Confidence threshold
            iou: IoU threshold for NMS

        Returns:
            Image with bounding boxes and labels drawn
        """
        if not self.is_loaded():
            raise RuntimeError("Model not loaded")

        # Reuse predict() supaya rendering konsisten dgn class hasil koreksi heuristic
        detections = self.predict(image, conf=conf, iou=iou)

        if not detections:
            return image

        # Plot manual: bbox + label class hasil koreksi
        rendered = image.copy()
        for det in detections:
            x1, y1, x2, y2 = [int(round(c)) for c in det["bbox"]]
            label = f'{det["class_name"]} {det["confidence"]:.2f}'
            # Warna BGR (deterministic dari class_id)
            cid = det["class_id"]
            color = (
                int((cid * 67) % 200 + 55),
                int((cid * 131) % 200 + 55),
                int((cid * 199) % 200 + 55),
            )
            cv2.rectangle(rendered, (x1, y1), (x2, y2), color, 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(
                rendered, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1
            )
            cv2.putText(
                rendered, label, (x1 + 2, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2,
            )
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
