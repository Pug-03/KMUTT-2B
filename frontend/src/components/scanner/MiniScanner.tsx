'use client';

import { useApp, Grade } from '@/contexts/AppContext';

const GRADE_COLORS: Record<Grade, string> = {
  gradeA: '#34c759',
  gradeB: '#0a84ff',
  gradeC: '#ff9f0a',
  unripe: '#a8d830',
  rotten: '#ff453a',
  wilted: '#bf5af2',
};

/** Short label for the scanning circle */
const GRADE_LABELS: Record<Grade, string> = {
  gradeA: 'A',
  gradeB: 'B',
  gradeC: 'C',
  unripe: 'UR',
  rotten: 'X',
  wilted: 'W',
};

export default function MiniScanner() {
  const { t, latestGrading, isSimulating, counters, activeFarm } = useApp();

  const gradeColor = latestGrading ? GRADE_COLORS[latestGrading.grade] : 'var(--border)';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-primary">Live Scanner</p>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[11px] text-muted font-medium">{isSimulating ? 'Active' : 'Idle'}</span>
        </span>
      </div>

      {/* Mini viewport */}
      <div
        className="relative flex-1 rounded-[16px] overflow-hidden min-h-[160px] transition-all duration-500"
        style={{
          background: 'var(--bg-elevated)',
          border: `2px solid ${gradeColor}`,
          boxShadow: latestGrading ? `0 0 24px ${gradeColor}30` : 'none',
        }}
      >
        {/* Latest grading display */}
        {latestGrading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
            {/* Scanning circle with pulse ring */}
            <div className="relative mb-3">
              {/* Outer pulse ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `2px solid ${gradeColor}`,
                  animation: 'scanner-ring-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
              {/* Main circle */}
              <div
                className="relative w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-500"
                style={{
                  background: `${gradeColor}12`,
                  border: `2.5px solid ${gradeColor}`,
                  boxShadow: `0 0 32px ${gradeColor}25, inset 0 0 20px ${gradeColor}08`,
                }}
              >
                {/* Grade letter — bold SF Pro */}
                <span
                  className="text-2xl font-black leading-none tracking-tight"
                  style={{
                    color: gradeColor,
                    textShadow: `0 0 16px ${gradeColor}40`,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                >
                  {GRADE_LABELS[latestGrading.grade]}
                </span>
                {/* Confidence inside circle */}
                <span
                  className="text-[10px] font-bold tabular-nums mt-0.5 opacity-70"
                  style={{ color: gradeColor }}
                >
                  {(latestGrading.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Grade name badge */}
            <span className={`grade-badge grade-${latestGrading.grade} !text-xs px-3 py-1.5`}>
              {t.grades[latestGrading.grade]}
            </span>

            {/* Defect + farm info */}
            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
              {latestGrading.defect && (
                <span className="text-[10px] text-[#ff453a] bg-[#ff453a]/10 px-2 py-0.5 rounded-full font-medium">
                  {t.defects[latestGrading.defect]}
                </span>
              )}
              {latestGrading.farmOriginName && (
                <span className="text-[10px] text-muted px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-input)' }}>
                  {latestGrading.farmOriginName}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
            {/* Idle scanning circle */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
              style={{
                border: '2px dashed var(--border-strong)',
                background: 'var(--bg-input)',
              }}
            >
              <svg className="w-8 h-8 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs">{t.analytics.noDetection}</p>
          </div>
        )}
      </div>

      {/* Mini stats bar */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-muted">
        <span className="tabular-nums font-medium">{counters.total.toLocaleString()} scanned</span>
        {activeFarm && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
            {activeFarm.name}
          </span>
        )}
      </div>
    </div>
  );
}
