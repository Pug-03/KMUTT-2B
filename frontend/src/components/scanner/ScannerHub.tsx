'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp, Grade } from '@/contexts/AppContext';
import { classifyFrame, GradingPrediction, BBox } from '@/lib/grading';

const GRADE_COLORS: Record<Grade, string> = {
  damaged: 'border-red-500 text-red-400',
  old: 'border-amber-500 text-amber-400',
  ripe: 'border-green-500 text-green-400',
  unripe: 'border-blue-500 text-blue-400',
};

const GRADE_BOX_COLORS: Record<Grade, string> = {
  damaged: '#ef4444',
  old: '#f59e0b',
  ripe: '#22c55e',
  unripe: '#3b82f6',
};

export default function ScannerHub() {
  const { t, socket, selectedModel, isSimulating, toggleSimulation, resetCounters } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prediction, setPrediction] = useState<GradingPrediction | null>(null);

  // Draw bounding box on canvas overlay
  const drawBBox = useCallback((bbox: BBox | null, grade: Grade | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!canvas || !video || !container) return;

    // Match canvas size to the container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!bbox || !grade) return;

    const [bx, by, bw, bh] = bbox;

    // The video uses object-cover, so we need to calculate the visible area
    const videoRatio = video.videoWidth / video.videoHeight;
    const containerRatio = rect.width / rect.height;

    let drawW: number, drawH: number, offsetX: number, offsetY: number;
    if (videoRatio > containerRatio) {
      // Video is wider — cropped left/right
      drawH = rect.height;
      drawW = rect.height * videoRatio;
      offsetX = (rect.width - drawW) / 2;
      offsetY = 0;
    } else {
      // Video is taller — cropped top/bottom
      drawW = rect.width;
      drawH = rect.width / videoRatio;
      offsetX = 0;
      offsetY = (rect.height - drawH) / 2;
    }

    const x = offsetX + bx * drawW;
    const y = offsetY + by * drawH;
    const w = bw * drawW;
    const h = bh * drawH;

    const color = GRADE_BOX_COLORS[grade];

    // Draw box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);

    // Draw corner accents
    const cornerLen = Math.min(w, h) * 0.15;
    ctx.lineWidth = 5;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen);
    ctx.stroke();

    // Label background
    const label = `Tomato`;
    ctx.font = 'bold 14px sans-serif';
    const textWidth = ctx.measureText(label).width;
    const labelH = 24;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - labelH, textWidth + 12, labelH);

    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 6, y - 7);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError(t.scanner.permissionDenied);
      } else {
        setCameraError(t.scanner.noCamera);
      }
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPrediction(null);
    drawBBox(null, null);
    cancelAnimationFrame(animFrameRef.current);
  }, [drawBBox]);

  // Continuous classification loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    let running = true;

    const processFrame = async () => {
      if (!running || !videoRef.current) return;
      setIsProcessing(true);
      try {
        const result = await classifyFrame(videoRef.current, selectedModel);
        setPrediction(result);
        drawBBox(result.bbox, result.grade);
        // Only send grading results when a real tomato is detected
        if (result.detected && result.grade) {
          socket?.emit('grading:result', {
            grade: result.grade,
            fruitType: result.fruitType || 'tomato',
            confidence: result.confidence,
          });
        }
      } catch {
        // ignore frame errors
      }
      setIsProcessing(false);
      if (running) {
        animFrameRef.current = requestAnimationFrame(() => {
          setTimeout(processFrame, 800); // Process ~1 frame per second
        });
      }
    };

    processFrame();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraActive, selectedModel, socket, drawBBox]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const borderColor = prediction
    ? prediction.detected && prediction.grade
      ? GRADE_COLORS[prediction.grade]
      : 'border-yellow-600 text-yellow-400'
    : 'border-gray-700';

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{t.scanner.title}</h2>
        <div className="flex gap-2">
          {!cameraActive ? (
            <button onClick={startCamera} className="btn-primary">
              {t.scanner.startCamera}
            </button>
          ) : (
            <button onClick={stopCamera} className="btn-danger">
              {t.scanner.stopCamera}
            </button>
          )}
          <button
            onClick={toggleSimulation}
            className={isSimulating ? 'btn-danger' : 'btn-secondary'}
          >
            {isSimulating ? t.scanner.stopSimulation : t.scanner.startSimulation}
          </button>
          <button onClick={resetCounters} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div ref={containerRef} className={`relative flex-1 rounded-xl border-2 ${borderColor} bg-gray-900 overflow-hidden min-h-[300px] transition-colors duration-300`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* Bounding box overlay canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Overlay when no camera */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <svg className="w-20 h-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">{cameraError || t.scanner.noCamera}</p>
            <p className="text-xs text-gray-600 mt-1">
              {t.scanner.startSimulation} to test without camera
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-xs text-yellow-400">{t.scanner.processing}</span>
          </div>
        )}

        {/* Prediction overlay */}
        {prediction && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {prediction.detected && prediction.grade ? (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <span className={`grade-badge grade-${prediction.grade} text-base px-3 py-1.5`}>
                      {t.grades[prediction.grade]}
                    </span>
                    <span className="ml-2 text-xs text-emerald-400 font-medium">
                      {t.scanner.tomatoDetected}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{t.scanner.confidence}</p>
                    <p className="text-2xl font-bold text-white tabular-nums">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Score bars */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(['damaged', 'old', 'ripe', 'unripe'] as Grade[]).map((grade) => (
                    <div key={grade} className="text-center">
                      <div className="h-12 bg-gray-800 rounded relative overflow-hidden">
                        <div
                          className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
                            grade === 'damaged' ? 'bg-red-500' :
                            grade === 'old' ? 'bg-amber-500' :
                            grade === 'ripe' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ height: `${(prediction.scores[grade] * 100)}%`, opacity: 0.7 }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{t.grades[grade]}</p>
                      <p className="text-xs text-white font-medium tabular-nums">
                        {(prediction.scores[grade] * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-medium text-sm">
                  {t.scanner.noFruitDetected}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {t.scanner.confidence}: {(prediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model info bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Model: {selectedModel}</span>
        <span>{cameraActive ? 'Live' : isSimulating ? 'Simulating' : 'Idle'}</span>
      </div>
    </div>
  );
}
