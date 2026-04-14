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

        # Parse results
        detections = []
        for result in results:
            boxes = result.boxes
            for i in range(len(boxes)):
                class_id = int(boxes.cls[i])
                class_name = self.model.names[class_id]
                confidence = float(boxes.conf[i])
                bbox = boxes.xyxy[i].cpu().numpy().tolist()  # [x1, y1, x2, y2]

                detections.append({
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": round(confidence, 4),
                    "bbox": [round(coord, 2) for coord in bbox]
                })

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

        # Run inference
        results = self.model.predict(
            image,
            conf=conf,
            iou=iou,
            verbose=False
        )

        # Use YOLOv8's built-in plotting
        if len(results) > 0:
            rendered = results[0].plot()
            return rendered

        return image

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        if not self.is_loaded():
            return {"error": "Model not loaded"}

        return {
            "model_path": self.model_path,
            "class_names": self.model.names,
            "num_classes": len(self.model.names)
        }
