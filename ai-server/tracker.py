"""
Tomato Grading Pipeline with Tracking & Single-Count Logic
===========================================================
Reads a live camera stream, detects tomato-coloured regions via HSV
segmentation, tracks each fruit with a centroid tracker, and classifies
(grades) each tomato **exactly once** when it crosses a configurable
counting line.

Usage:
    python tracker.py                    # webcam 0, default settings
    python tracker.py --source 1         # webcam index 1
    python tracker.py --source video.mp4 # video file
    python tracker.py --line-y 0.6       # counting line at 60% height
"""

from __future__ import annotations

import argparse
import csv
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

# ─── Configuration ────────────────────────────────────────────────────────────

MODEL_PATH = Path(__file__).parent / "best.pt"
CONFIDENCE_THRESHOLD = 0.55          # min classification confidence
MAX_DISAPPEARED_FRAMES = 30          # drop track after this many misses
MAX_MATCH_DISTANCE = 80              # max px distance to match centroids
MIN_CONTOUR_AREA_RATIO = 0.015       # min area as fraction of frame
MAX_ASPECT_RATIO = 3.0               # reject elongated shapes
MIN_CIRCULARITY = 0.35               # reject non-round shapes
OUTPUT_CSV = Path(__file__).parent / "grading_log.csv"

CLASS_MAP = {0: "gradeA", 1: "gradeB", 2: "gradeC", 3: "unripe", 4: "rotten", 5: "wilted"}

DEFECT_MAP = {
    "rotten": "spoilage",
    "wilted": "bruise",
    "gradeC": "blackSpot",
}


# ─── Data structures ─────────────────────────────────────────────────────────

@dataclass
class TrackedObject:
    object_id: int
    centroid: tuple[int, int]
    bbox: tuple[int, int, int, int]   # x, y, w, h
    disappeared: int = 0
    crossed_line: bool = False
    graded: bool = False
    grade: str | None = None
    confidence: float = 0.0
    defect: str | None = None
    frame_first_seen: int = 0
    positions: list[tuple[int, int]] = field(default_factory=list)


# ─── Centroid Tracker ─────────────────────────────────────────────────────────

class CentroidTracker:
    """Assigns persistent IDs to detected objects across frames using
    centroid distance matching (Hungarian-free greedy variant)."""

    def __init__(
        self,
        max_disappeared: int = MAX_DISAPPEARED_FRAMES,
        max_distance: int = MAX_MATCH_DISTANCE,
    ):
        self.next_id = 0
        self.objects: OrderedDict[int, TrackedObject] = OrderedDict()
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance
        self._frame_count = 0

    @property
    def frame_count(self) -> int:
        return self._frame_count

    # ── public API ──

    def update(self, detections: list[tuple[int, int, int, int]]) -> OrderedDict[int, TrackedObject]:
        """Accept a list of (x, y, w, h) bounding boxes and return updated
        tracked objects dict."""
        self._frame_count += 1

        if len(detections) == 0:
            for oid in list(self.objects):
                self.objects[oid].disappeared += 1
                if self.objects[oid].disappeared > self.max_disappeared:
                    del self.objects[oid]
            return self.objects

        input_centroids = []
        for (x, y, w, h) in detections:
            cx = x + w // 2
            cy = y + h // 2
            input_centroids.append((cx, cy))

        if len(self.objects) == 0:
            for i, (x, y, w, h) in enumerate(detections):
                self._register(input_centroids[i], (x, y, w, h))
        else:
            self._match(input_centroids, detections)

        return self.objects

    # ── internals ──

    def _register(self, centroid: tuple[int, int], bbox: tuple[int, int, int, int]):
        obj = TrackedObject(
            object_id=self.next_id,
            centroid=centroid,
            bbox=bbox,
            frame_first_seen=self._frame_count,
            positions=[centroid],
        )
        self.objects[self.next_id] = obj
        self.next_id += 1

    def _match(self, input_centroids, detections):
        object_ids = list(self.objects.keys())
        existing_centroids = [self.objects[oid].centroid for oid in object_ids]

        # Compute distance matrix
        D = np.zeros((len(existing_centroids), len(input_centroids)), dtype=np.float64)
        for i, ec in enumerate(existing_centroids):
            for j, ic in enumerate(input_centroids):
                D[i, j] = np.sqrt((ec[0] - ic[0]) ** 2 + (ec[1] - ic[1]) ** 2)

        # Greedy matching: closest pairs first
        rows = D.min(axis=1).argsort()
        cols = D.argmin(axis=1)[rows]

        used_rows: set[int] = set()
        used_cols: set[int] = set()

        for row, col in zip(rows, cols):
            if row in used_rows or col in used_cols:
                continue
            if D[row, col] > self.max_distance:
                continue

            oid = object_ids[row]
            self.objects[oid].centroid = input_centroids[col]
            self.objects[oid].bbox = detections[col]
            self.objects[oid].disappeared = 0
            self.objects[oid].positions.append(input_centroids[col])

            used_rows.add(row)
            used_cols.add(col)

        # Handle unmatched existing objects
        for row in set(range(len(existing_centroids))) - used_rows:
            oid = object_ids[row]
            self.objects[oid].disappeared += 1
            if self.objects[oid].disappeared > self.max_disappeared:
                del self.objects[oid]

        # Register unmatched new detections
        for col in set(range(len(input_centroids))) - used_cols:
            self._register(input_centroids[col], detections[col])


# ─── HSV Tomato Detector (improved) ──────────────────────────────────────────

def detect_tomato_regions(frame_bgr: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Detect tomato-coloured blobs via HSV segmentation.

    Returns list of (x, y, w, h) bounding boxes, sorted largest-first.
    Applies circularity + aspect ratio filters to reject non-tomato shapes
    (faces, hands, background objects).
    """
    hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
    h, w = frame_bgr.shape[:2]

    # Colour masks for every tomato stage
    mask_red1 = cv2.inRange(hsv, np.array([0, 70, 50]), np.array([12, 255, 255]))
    mask_red2 = cv2.inRange(hsv, np.array([155, 70, 50]), np.array([180, 255, 255]))
    mask_orange = cv2.inRange(hsv, np.array([12, 70, 50]), np.array([25, 255, 255]))
    mask_yellow = cv2.inRange(hsv, np.array([25, 60, 50]), np.array([35, 255, 255]))
    mask_green = cv2.inRange(hsv, np.array([35, 50, 50]), np.array([85, 255, 255]))
    mask_dark = cv2.inRange(hsv, np.array([0, 30, 20]), np.array([25, 100, 90]))

    mask = mask_red1 | mask_red2 | mask_orange | mask_yellow | mask_green | mask_dark

    # Morphology
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_small)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return []

    min_area = h * w * MIN_CONTOUR_AREA_RATIO
    results = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue

        x1, y1, bw, bh = cv2.boundingRect(cnt)

        # Aspect ratio filter
        aspect = max(bw, bh) / max(min(bw, bh), 1)
        if aspect > MAX_ASPECT_RATIO:
            continue

        # Circularity filter — tomatoes are roughly round
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue
        circularity = 4 * np.pi * area / (perimeter * perimeter)
        if circularity < MIN_CIRCULARITY:
            continue

        # Padding 10%
        pad_x = int(bw * 0.10)
        pad_y = int(bh * 0.10)
        x1 = max(0, x1 - pad_x)
        y1 = max(0, y1 - pad_y)
        bw = min(w - x1, bw + 2 * pad_x)
        bh = min(h - y1, bh + 2 * pad_y)

        results.append((x1, y1, bw, bh))

    results.sort(key=lambda r: r[2] * r[3], reverse=True)
    return results


# ─── YOLO Classification ─────────────────────────────────────────────────────

def load_model(model_path: Path) -> YOLO:
    print(f"Loading YOLO model from {model_path} ...")
    model = YOLO(str(model_path))
    # Warm-up
    dummy = Image.new("RGB", (224, 224), (128, 128, 128))
    model.predict(dummy, verbose=False)
    # Sync class map
    if hasattr(model, "names") and model.names:
        for idx, name in model.names.items():
            CLASS_MAP[idx] = name.lower()
    print(f"Model loaded. Classes: {CLASS_MAP}")
    return model


def classify_crop(model: YOLO, crop_bgr: np.ndarray) -> tuple[str, float]:
    """Classify a BGR crop. Returns (grade, confidence)."""
    crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(crop_rgb)
    results = model.predict(pil_img, imgsz=224, verbose=False)
    probs = results[0].probs

    top_idx = probs.top1
    grade = CLASS_MAP.get(top_idx, f"class_{top_idx}")
    confidence = round(probs.top1conf.item(), 4)
    return grade, confidence


# ─── Grading callback ────────────────────────────────────────────────────────

def on_tomato_graded(obj: TrackedObject):
    """Called exactly ONCE per tomato when it crosses the counting line.

    Replace or extend this function to trigger sorting hardware,
    send data to your API, update a database, etc.
    """
    defect_str = f"  Defect={obj.defect}" if obj.defect else ""
    print(
        f"  [GRADED] ID={obj.object_id:>4d}  "
        f"Grade={obj.grade:<8s}  "
        f"Confidence={obj.confidence:.2%}"
        f"{defect_str}"
    )


# ─── CSV logger ───────────────────────────────────────────────────────────────

class CSVLogger:
    def __init__(self, path: Path):
        self.path = path
        self._file = open(path, "w", newline="")
        self._writer = csv.writer(self._file)
        self._writer.writerow(["id", "grade", "confidence", "defect", "timestamp"])

    def log(self, obj: TrackedObject):
        self._writer.writerow([
            obj.object_id,
            obj.grade,
            f"{obj.confidence:.4f}",
            obj.defect or "",
            time.strftime("%Y-%m-%d %H:%M:%S"),
        ])
        self._file.flush()

    def close(self):
        self._file.close()


# ─── Drawing helpers ──────────────────────────────────────────────────────────

GRADE_COLORS = {
    "gradeA":  (0, 200, 0),      # green
    "gradeB":  (230, 165, 14),   # sky blue (BGR)
    "gradeC":  (0, 165, 255),    # orange
    "unripe":  (22, 204, 132),   # lime
    "rotten":  (0, 0, 255),      # red
    "wilted":  (247, 85, 168),   # purple
}


def draw_overlay(
    frame: np.ndarray,
    objects: OrderedDict[int, TrackedObject],
    line_y: int,
    total_count: int,
    grade_counts: dict[str, int],
):
    """Draw bounding boxes, IDs, counting line, and stats on the frame."""
    h, w = frame.shape[:2]

    # Counting line
    cv2.line(frame, (0, line_y), (w, line_y), (0, 255, 255), 2)
    cv2.putText(frame, "COUNTING LINE", (10, line_y - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

    # Tracked objects
    for obj in objects.values():
        x, y, bw, bh = obj.bbox
        color = (128, 128, 128)  # default grey for ungraded

        if obj.graded and obj.grade:
            color = GRADE_COLORS.get(obj.grade, (255, 255, 255))

        cv2.rectangle(frame, (x, y), (x + bw, y + bh), color, 2)

        label = f"ID:{obj.object_id}"
        if obj.graded:
            label += f" {obj.grade} {obj.confidence:.0%}"

        cv2.putText(frame, label, (x, y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Draw centroid
        cx, cy = obj.centroid
        cv2.circle(frame, (cx, cy), 4, color, -1)

    # Stats panel
    cv2.rectangle(frame, (0, 0), (220, 30 + 25 * (len(grade_counts) + 1)), (0, 0, 0), -1)
    cv2.putText(frame, f"Total: {total_count}", (10, 22),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    for i, (grade, count) in enumerate(grade_counts.items()):
        color = GRADE_COLORS.get(grade, (255, 255, 255))
        cv2.putText(frame, f"{grade}: {count}", (10, 47 + i * 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    return frame


# ─── Main pipeline ────────────────────────────────────────────────────────────

def run(source, line_y_ratio: float = 0.5, show_gui: bool = True):
    """Main loop: detect → track → count → classify → log."""

    model = load_model(MODEL_PATH)
    tracker = CentroidTracker()
    logger = CSVLogger(OUTPUT_CSV)

    # Open video source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video source: {source}")

    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    line_y = int(frame_h * line_y_ratio)

    total_count = 0
    grade_counts: dict[str, int] = {g: 0 for g in CLASS_MAP.values()}

    print(f"Video: {frame_w}x{frame_h}  |  Counting line at y={line_y}")
    print("Press 'q' to quit.\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 1. Detect tomato-coloured regions
        detections = detect_tomato_regions(frame)

        # 2. Update tracker
        objects = tracker.update(detections)

        # 3. Check line crossing & grade once
        for obj in objects.values():
            if obj.graded or obj.disappeared > 0:
                continue

            cx, cy = obj.centroid

            # Record whether the object has crossed the counting line.
            # We check if the centroid has moved from above to at/below the line.
            prev_above = any(py < line_y for (_, py) in obj.positions[:-1]) if len(obj.positions) > 1 else False
            now_at_or_below = cy >= line_y

            if prev_above and now_at_or_below and not obj.crossed_line:
                obj.crossed_line = True

                # Crop & classify
                x, y, bw, bh = obj.bbox
                crop = frame[y:y + bh, x:x + bw]
                if crop.size == 0:
                    continue

                grade, confidence = classify_crop(model, crop)

                if confidence >= CONFIDENCE_THRESHOLD:
                    obj.graded = True
                    obj.grade = grade
                    obj.confidence = confidence
                    obj.defect = DEFECT_MAP.get(grade)

                    total_count += 1
                    grade_counts[grade] = grade_counts.get(grade, 0) + 1

                    # Trigger callback — 1 tomato = 1 entry
                    on_tomato_graded(obj)
                    logger.log(obj)
                else:
                    # Below threshold → likely a false positive, ignore
                    obj.crossed_line = False  # allow re-check next frame

        # 4. Draw & display
        if show_gui:
            display = draw_overlay(frame.copy(), objects, line_y, total_count, grade_counts)
            cv2.imshow("Tomato Grading", display)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    # Cleanup
    cap.release()
    if show_gui:
        cv2.destroyAllWindows()
    logger.close()

    print(f"\nSession complete. {total_count} tomatoes graded.")
    print(f"Grade breakdown: {dict(grade_counts)}")
    print(f"Log saved to {OUTPUT_CSV}")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Tomato Grading with Tracking")
    parser.add_argument(
        "--source", default=0,
        help="Camera index (int) or video file path (default: 0)",
    )
    parser.add_argument(
        "--line-y", type=float, default=0.5,
        help="Counting line position as fraction of frame height (default: 0.5)",
    )
    parser.add_argument(
        "--no-gui", action="store_true",
        help="Run without OpenCV display window (headless mode)",
    )
    parser.add_argument(
        "--model", type=str, default=None,
        help="Path to YOLO model (default: best.pt in same directory)",
    )
    args = parser.parse_args()

    if args.model:
        global MODEL_PATH
        MODEL_PATH = Path(args.model)

    # Parse source: integer = camera index, otherwise file path
    try:
        source = int(args.source)
    except ValueError:
        source = args.source

    run(source=source, line_y_ratio=args.line_y, show_gui=not args.no_gui)


if __name__ == "__main__":
    main()
