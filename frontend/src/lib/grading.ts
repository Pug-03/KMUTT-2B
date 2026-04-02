import type { Grade } from '@/contexts/AppContext';

const AI_SERVER_URL = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000';

/**
 * AI Grading Logic - YOLO v11 Tomato Classification
 *
 * Captures frames from the video element, sends them to the Python FastAPI
 * server running the trained YOLO model, and returns the classification.
 *
 * Classes: Damaged, Old, Ripe, Unripe
 */

/** Bounding box as fractions of image size: [x, y, width, height] (0-1). */
export type BBox = [number, number, number, number];

export interface GradingPrediction {
  detected: boolean;
  grade: Grade | null;
  confidence: number;
  scores: Record<Grade, number>;
  fruitType: string | null;
  bbox: BBox | null;
}

/**
 * Capture a frame from the video element and return as base64 JPEG.
 */
function captureFrame(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Classify a video frame using the YOLO v11 model via the Python AI server.
 */
export async function classifyFrame(
  videoElement: HTMLVideoElement,
  _modelId: string
): Promise<GradingPrediction> {
  const base64Image = captureFrame(videoElement);

  const response = await fetch(`${AI_SERVER_URL}/api/classify-base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    throw new Error(`AI server error: ${response.status}`);
  }

  const data = await response.json();

  return _mapResponse(data);
}

/**
 * Classify a still image file (for upload-based classification).
 */
export async function classifyImage(file: File): Promise<GradingPrediction> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${AI_SERVER_URL}/api/classify`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`AI server error: ${response.status}`);
  }

  const data = await response.json();

  return _mapResponse(data);
}

function _mapResponse(data: any): GradingPrediction {
  return {
    detected: data.detected ?? true,
    grade: data.detected ? (data.grade as Grade) : null,
    confidence: data.confidence,
    scores: {
      damaged: data.scores?.damaged ?? 0,
      old: data.scores?.old ?? 0,
      ripe: data.scores?.ripe ?? 0,
      unripe: data.scores?.unripe ?? 0,
    },
    fruitType: data.fruitType ?? null,
    bbox: data.bbox ?? null,
  };
}
