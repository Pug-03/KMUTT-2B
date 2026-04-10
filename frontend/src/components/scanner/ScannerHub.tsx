'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp, Grade, ALL_GRADES } from '@/contexts/AppContext';
import { classifyFrame, GradingPrediction, BBox } from '@/lib/grading';

const GRADE_BORDER: Record<Grade, string> = {
  gradeA: 'border-[#34c759]',
  gradeB: 'border-[#0a84ff]',
  gradeC: 'border-[#ff9f0a]',
  unripe: 'border-[#a8d830]',
  rotten: 'border-[#ff453a]',
  wilted: 'border-[#bf5af2]',
};

const GRADE_BOX_COLORS: Record<Grade, string> = {
  gradeA: '#34c759',
  gradeB: '#0a84ff',
  gradeC: '#ff9f0a',
  unripe: '#a8d830',
  rotten: '#ff453a',
  wilted: '#bf5af2',
};

export default function ScannerHub() {
  const { t, socket, selectedModel, isSimulating, toggleSimulation, resetCounters, latestGrading, counters, activeFarm } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prediction, setPrediction] = useState<GradingPrediction | null>(null);

  const drawBBox = useCallback((bbox: BBox | null, grade: Grade | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!canvas || !video || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!bbox || !grade) return;

    const [bx, by, bw, bh] = bbox;
    const videoRatio = video.videoWidth / video.videoHeight;
    const containerRatio = rect.width / rect.height;

    let drawW: number, drawH: number, offsetX: number, offsetY: number;
    if (videoRatio > containerRatio) {
      drawH = rect.height;
      drawW = rect.height * videoRatio;
      offsetX = (rect.width - drawW) / 2;
      offsetY = 0;
    } else {
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

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);

    const cornerLen = Math.min(w, h) * 0.15;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke();

    const label = 'Tomato';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    const textWidth = ctx.measureText(label).width;
    const labelH = 24;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y - labelH - 4, textWidth + 16, labelH, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 8, y - 11);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(err.name === 'NotAllowedError' ? t.scanner.permissionDenied : t.scanner.noCamera);
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setPrediction(null);
    drawBBox(null, null);
    cancelAnimationFrame(animFrameRef.current);
  }, [drawBBox]);

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
        if (result.detected && result.grade) {
          socket?.emit('grading:result', { grade: result.grade, fruitType: result.fruitType || 'tomato', confidence: result.confidence, defect: result.defect || null, farmOrigin: activeFarm?._id, farmOriginName: activeFarm?.name });
        }
      } catch { /* ignore */ }
      setIsProcessing(false);
      if (running) animFrameRef.current = requestAnimationFrame(() => setTimeout(processFrame, 800));
    };
    processFrame();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [cameraActive, selectedModel, socket, drawBBox, activeFarm]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const borderColor = prediction
    ? prediction.detected && prediction.grade ? GRADE_BORDER[prediction.grade] : 'border-[#ff9f0a]'
    : 'border-[var(--border)]';

  return (
    <div className="p-3 sm:p-5 lg:p-6 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-primary tracking-tight">{t.scanner.title}</h2>
          <span className="hidden sm:inline text-[11px] font-medium px-3 py-1 rounded-full tabular-nums" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
            {counters.total.toLocaleString()} fruits ({(counters.total * 0.01538).toFixed(2)} kg)
          </span>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {!cameraActive ? (
            <button onClick={startCamera} className="btn-primary btn-sm">{t.scanner.startCamera}</button>
          ) : (
            <button onClick={stopCamera} className="btn-danger btn-sm">{t.scanner.stopCamera}</button>
          )}
          <button onClick={toggleSimulation} className={`btn-sm ${isSimulating ? 'btn-danger' : 'btn-secondary'}`}>
            {isSimulating ? t.scanner.stopSimulation : t.scanner.startSimulation}
          </button>
          <button onClick={resetCounters} className="btn-secondary btn-sm">Reset</button>
        </div>
      </div>

      {/* Video Viewport */}
      <div ref={containerRef} className={`relative flex-1 rounded-[20px] border-2 ${borderColor} overflow-hidden min-h-[250px] transition-all duration-500`} style={{ background: 'var(--bg-elevated)' }}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* No camera overlay */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted animate-fade-in">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">{cameraError || t.scanner.noCamera}</p>
            <p className="text-xs text-muted mt-1.5">{t.scanner.startSimulation} to test without camera</p>
          </div>
        )}

        {/* Processing pill */}
        {isProcessing && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-xs text-yellow-400 font-medium">{t.scanner.processing}</span>
          </div>
        )}

        {/* Simulation pill */}
        {isSimulating && !cameraActive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Simulating</span>
          </div>
        )}

        {/* Compact grading strip — simulation (bottom edge only, no center clutter) */}
        {latestGrading && !prediction && (
          <div className="absolute bottom-0 left-0 right-0 backdrop-blur-xl animate-slide-up" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`grade-badge grade-${latestGrading.grade} !text-[11px] !px-2.5 !py-1`}>{t.grades[latestGrading.grade]}</span>
                <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline">{t.scanner.tomatoDetected}</span>
              </div>
              <span className="text-sm font-bold text-white tabular-nums">{(latestGrading.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Compact grading strip — camera prediction (bottom edge only) */}
        {prediction && (
          <div className="absolute bottom-0 left-0 right-0 backdrop-blur-xl animate-slide-up" style={{ background: 'rgba(0,0,0,0.6)' }}>
            {prediction.detected && prediction.grade ? (
              <div className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`grade-badge grade-${prediction.grade} !text-[11px] !px-2.5 !py-1`}>{t.grades[prediction.grade]}</span>
                    <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline">{t.scanner.tomatoDetected}</span>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
                {/* Mini score bars — compact horizontal row */}
                <div className="flex gap-1 mt-2">
                  {ALL_GRADES.map((grade) => (
                    <div key={grade} className="flex-1 flex flex-col items-center">
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${prediction.scores[grade] * 100}%`, backgroundColor: GRADE_BOX_COLORS[grade] }}
                        />
                      </div>
                      <p className="text-[8px] text-gray-400 mt-0.5 tabular-nums">{(prediction.scores[grade] * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[#ff9f0a] font-medium text-[11px]">{t.scanner.noFruitDetected}</span>
                <span className="text-[11px] text-gray-400 tabular-nums">{(prediction.confidence * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-[11px] text-muted px-1">
        <span className="font-medium">Model: {selectedModel}</span>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-green-400' : isSimulating ? 'bg-yellow-400' : 'bg-gray-600'}`} />
          {cameraActive ? 'Live' : isSimulating ? 'Simulating' : 'Idle'}
        </span>
      </div>
    </div>
  );
}
