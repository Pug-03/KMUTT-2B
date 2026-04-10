'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';

const GRADE_GLOW: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  gradeA: { bg: 'rgba(52, 199, 89, 0.08)', border: 'rgba(52, 199, 89, 0.3)', text: '#34c759', glow: '0 0 30px rgba(52, 199, 89, 0.2)' },
  gradeB: { bg: 'rgba(10, 132, 255, 0.08)', border: 'rgba(10, 132, 255, 0.3)', text: '#0a84ff', glow: '0 0 30px rgba(10, 132, 255, 0.2)' },
  gradeC: { bg: 'rgba(255, 159, 10, 0.08)', border: 'rgba(255, 159, 10, 0.3)', text: '#ff9f0a', glow: '0 0 30px rgba(255, 159, 10, 0.2)' },
  unripe: { bg: 'rgba(168, 216, 48, 0.08)', border: 'rgba(168, 216, 48, 0.3)', text: '#a8d830', glow: '0 0 30px rgba(168, 216, 48, 0.2)' },
  rotten: { bg: 'rgba(255, 69, 58, 0.08)', border: 'rgba(255, 69, 58, 0.3)', text: '#ff453a', glow: '0 0 30px rgba(255, 69, 58, 0.2)' },
  wilted: { bg: 'rgba(191, 90, 242, 0.08)', border: 'rgba(191, 90, 242, 0.3)', text: '#bf5af2', glow: '0 0 30px rgba(191, 90, 242, 0.2)' },
};

/** Auto-dismiss timer per alert */
function AlertCard({ alert, index, onDismiss, t }: {
  alert: any; index: number; onDismiss: (i: number) => void; t: any;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(index), 400);
    }, 6000);
    return () => clearTimeout(timer);
  }, [index, onDismiss]);

  const style = GRADE_GLOW[alert.grade] || GRADE_GLOW.rotten;

  return (
    <div
      className={`rounded-[16px] p-4 backdrop-blur-xl transition-all duration-400 ${
        exiting ? 'opacity-0 translate-x-20' : 'animate-slide-in'
      }`}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: style.glow,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${style.text}15` }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={style.text} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: style.text }}>
              {t.notifications.anomalyTitle}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {t.notifications.anomalyBody
                .replace('{grade}', t.grades[alert.grade as keyof typeof t.grades] || alert.grade)
                .replace('{ratio}', String(alert.ratio))
                .replace('{threshold}', String(alert.threshold))}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setExiting(true); setTimeout(() => onDismiss(index), 300); }}
          className="text-muted hover:text-primary transition-colors shrink-0 mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function NotificationToast() {
  const { t, alerts, dismissAlert } = useApp();

  return (
    <>
      {/* Anomaly Alerts (top-right) */}
      {alerts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm">
          {alerts.slice(-3).map((alert, i) => (
            <AlertCard
              key={alert.timestamp + '-' + i}
              alert={alert}
              index={i}
              onDismiss={dismissAlert}
              t={t}
            />
          ))}
        </div>
      )}

    </>
  );
}
