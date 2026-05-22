import os
import json
import base64
import logging
import numpy as np
from PIL import Image
from io import BytesIO
from ultralytics import YOLO

# Set up logging so we can see what's happening in SageMaker logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SageMaker looks for the model in this exact directory
MODEL_PATH = "/opt/ml/model/yolov8n.pt"


def model_fn(model_dir):
    """
    Called once when SageMaker starts the container.
    Loads the YOLOv8 model into memory so it's ready to process frames.
    """
    logger.info("Loading YOLOv8 model...")
    model = YOLO(MODEL_PATH)
    logger.info("Model loaded successfully")
    return model


def input_fn(request_body, request_content_type):
    """
    Called every time a frame comes in for processing.
    Converts the raw request data into a PIL Image that YOLOv8 can read.
    """
    logger.info(f"Received request with content type: {request_content_type}")

    if request_content_type == "application/json":
        body = json.loads(request_body)
        image_data = base64.b64decode(body["image"])
        image = Image.open(BytesIO(image_data)).convert("RGB")
        return image

    raise ValueError(f"Unsupported content type: {request_content_type}")


def predict_fn(image, model):
    """
    Called after input_fn. Runs YOLOv8 on the frame and returns raw results.
    This is where the actual ball detection happens.
    """
    logger.info("Running inference...")

    # Run YOLOv8 - it returns a list of Results objects
    results = model(image, verbose=False)
    result = results[0]

    detections = []
    for box in result.boxes:
        detection = {
            "class_id": int(box.cls[0]),
            "class_name": result.names[int(box.cls[0])],
            "confidence": float(box.conf[0]),
            "bbox": {
                "x1": float(box.xyxy[0][0]),
                "y1": float(box.xyxy[0][1]),
                "x2": float(box.xyxy[0][2]),
                "y2": float(box.xyxy[0][3]),
            }
        }
        detections.append(detection)

    logger.info(f"Found {len(detections)} detections")
    return detections


def output_fn(detections, response_content_type):
    """
    Called after predict_fn. Formats the detections as JSON
    to send back to whoever called the SageMaker endpoint.
    """
    return json.dumps({"detections": detections}), response_content_type