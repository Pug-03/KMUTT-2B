"""
AI Inference Server - YOLO v11 Tomato Classification
Loads the trained model and exposes a REST API for real-time classification.
"""

import io
import base64
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics import YOLO

MODEL_PATH = Path(__file__).parent / "best.pt"

# Minimum confidence to consider the object a real tomato.
# Below this threshold the model reports "no fruit detected".
CONFIDENCE_THRESHOLD = 0.55

app = FastAPI(title="Tomato Grading AI Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup
model = None

CLASS_MAP = {
    0: "damaged",
    1: "old",
    2: "ripe",
    3: "unripe",
}


@app.on_event("startup")
def load_model():
    global model
    print(f"Loading YOLO model from {MODEL_PATH}...")
    model = YOLO(str(MODEL_PATH))
    # Warm up with a dummy image
    dummy = Image.new("RGB", (224, 224), (128, 128, 128))
    model.predict(dummy, verbose=False)
    # Read class names from the model itself
    if hasattr(model, "names") and model.names:
        for idx, name in model.names.items():
            CLASS_MAP[idx] = name.lower()
    print(f"Model loaded. Classes: {CLASS_MAP}")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


def _find_tomato_contours(image: Image.Image):
    """Use HSV color segmentation to locate tomato regions in the image.

    Returns a list of (x, y, w, h) bounding boxes in pixel coordinates,
    sorted largest-first.  Returns an empty list when nothing is found.
    """
    img = np.array(image)
    img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    h, w = img.shape[:2]

    # --- colour masks for every tomato stage ---
    # Red / ripe (hue wraps around 0/180)
    mask_red1 = cv2.inRange(hsv, np.array([0, 60, 40]), np.array([12, 255, 255]))
    mask_red2 = cv2.inRange(hsv, np.array([155, 60, 40]), np.array([180, 255, 255]))
    # Orange / old
    mask_orange = cv2.inRange(hsv, np.array([12, 60, 40]), np.array([25, 255, 255]))
    # Yellow-green / turning
    mask_yellow = cv2.inRange(hsv, np.array([25, 50, 40]), np.array([35, 255, 255]))
    # Green / unripe
    mask_green = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
    # Dark / damaged (low saturation + low value = brown/black bruises)
    mask_dark = cv2.inRange(hsv, np.array([0, 20, 20]), np.array([25, 120, 100]))

    mask = mask_red1 | mask_red2 | mask_orange | mask_yellow | mask_green | mask_dark

    # Morphology: close small gaps then remove speckles
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_small)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return []

    min_area = h * w * 0.015  # at least 1.5% of the image
    results = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        x1, y1, bw, bh = cv2.boundingRect(cnt)
        # Reject extremely elongated shapes (aspect ratio guard)
        aspect = max(bw, bh) / max(min(bw, bh), 1)
        if aspect > 4:
            continue
        # Padding 15 %
        pad_x = int(bw * 0.15)
        pad_y = int(bh * 0.15)
        x1 = max(0, x1 - pad_x)
        y1 = max(0, y1 - pad_y)
        bw = min(w - x1, bw + 2 * pad_x)
        bh = min(h - y1, bh + 2 * pad_y)
        results.append((x1, y1, bw, bh))

    # Sort largest first
    results.sort(key=lambda r: r[2] * r[3], reverse=True)
    return results


def _classify_crop(crop: Image.Image) -> dict:
    """Run the YOLO classifier on a single cropped image.

    Returns { grade, confidence, scores }.
    """
    results = model.predict(crop, imgsz=224, verbose=False)
    result = results[0]
    probs = result.probs

    scores = {}
    for idx, score in enumerate(probs.data.tolist()):
        class_name = CLASS_MAP.get(idx, f"class_{idx}")
        scores[class_name] = round(score, 4)

    top_class_idx = probs.top1
    top_class = CLASS_MAP.get(top_class_idx, f"class_{top_class_idx}")
    confidence = round(probs.top1conf.item(), 4)
    return {"grade": top_class, "confidence": confidence, "scores": scores}


def _build_response(image: Image.Image) -> dict:
    """Detect tomato regions ➜ crop ➜ classify each crop."""

    boxes = _find_tomato_contours(image)
    img_w, img_h = image.size  # PIL uses (w, h)

    if not boxes:
        # No tomato-coloured region found — skip classification entirely
        return {
            "detected": False,
            "grade": None,
            "confidence": 0,
            "scores": {v: 0 for v in CLASS_MAP.values()},
            "fruitType": None,
            "bbox": None,
        }

    # Classify the largest detected region
    x, y, bw, bh = boxes[0]
    crop = image.crop((x, y, x + bw, y + bh))
    cls = _classify_crop(crop)

    detected = cls["confidence"] >= CONFIDENCE_THRESHOLD
    bbox_frac = [
        round(x / img_w, 4),
        round(y / img_h, 4),
        round(bw / img_w, 4),
        round(bh / img_h, 4),
    ] if detected else None

    return {
        "detected": detected,
        "grade": cls["grade"] if detected else None,
        "confidence": cls["confidence"],
        "scores": cls["scores"],
        "fruitType": "tomato" if detected else None,
        "bbox": bbox_frac,
    }


@app.post("/api/classify")
async def classify_image(file: UploadFile = File(...)):
    """Classify an uploaded image of a tomato."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    return _build_response(image)


@app.post("/api/classify-base64")
async def classify_base64(body: dict):
    """Classify a base64-encoded image (from webcam frame capture)."""
    data = body.get("image", "")
    # Strip data URL prefix if present
    if "," in data:
        data = data.split(",", 1)[1]

    image_bytes = base64.b64decode(data)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return _build_response(image)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
