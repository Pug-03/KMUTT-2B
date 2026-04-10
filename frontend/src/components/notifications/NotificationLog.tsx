'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp, GradingResult, AnomalyAlert } from '@/contexts/AppContext';

type LogEntry = {
  type: 'grading' | 'alert';
  timestamp: number;
  grade: string;
  confidence?: number;
  fruitType?: string;
  farmOriginName?: string;
  ratio?: number;
  threshold?: number;
};

export default function NotificationLog() {
  const { t, gradingHistory, alerts } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'grading' | 'alert'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => {
    const items: LogEntry[] = [];
    gradingHistory.forEach((g: GradingResult) => {
      items.push({ type: 'grading', timestamp: g.timestamp, grade: g.grade, confidence: g.confidence, fruitType: g.fruitType, farmOriginName: g.farmOriginName });
    });
    alerts.forEach((a: AnomalyAlert) => {
      items.push({ type: 'alert', timestamp: a.timestamp, grade: a.grade, ratio: a.ratio, threshold: a.threshold });
    });
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [gradingHistory, alerts]);

  const filtered = useMemo(() => {
    let result = entries;
    if (filter !== 'all') result = result.filter((e) => e.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => {
        const gradeName = t.grades[e.grade as keyof typeof t.grades] || e.grade;
        return gradeName.toLowerCase().includes(q) || e.grade.toLowerCase().includes(q) || e.type.includes(q) || (e.fruitType && e.fruitType.toLowerCase().includes(q));
      });
    }
    return result;
  }, [entries, filter, search, t.grades]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [filtered.length]);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 space-y-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">{t.notificationLog.title}</h3>
          <span className="text-[11px] text-muted tabular-nums px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-input)' }}>
            {filtered.length} {t.notificationLog.entries}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.notificationLog.searchPlaceholder}
              className="apple-input apple-input-sm w-full !pl-9"
            />
          </div>
          {/* Segmented filter */}
          <div className="flex p-0.5 rounded-[8px] shrink-0" style={{ background: 'var(--bg-input)' }}>
            {(['all', 'grading', 'alert'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-[6px] transition-all ${
                  filter === f
                    ? 'bg-[var(--bg-card-solid)] text-primary shadow-sm'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                {f === 'all' ? t.notificationLog.all : f === 'grading' ? t.notificationLog.gradings : t.notificationLog.alerts}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log */}
      <div ref={scrollRef} className="flex-1 scroll-area-hover">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">{t.notificationLog.empty}</p>
          </div>
        ) : (
          <div>
            {filtered.map((entry, i) => (
              <div
                key={`${entry.timestamp}-${i}`}
                className="px-4 sm:px-5 py-3 flex items-center gap-3 transition-all hover:bg-[var(--bg-card-hover)]"
                style={{ borderBottom: '1px solid var(--border)', animation: `slide-in-up 0.3s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 30, 300)}ms both` }}
              >
                {/* Icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  entry.type === 'alert' ? 'bg-[#ff453a]/10' : 'bg-[#34c759]/10'
                }`}>
                  {entry.type === 'alert' ? (
                    <svg className="w-3.5 h-3.5 text-[#ff453a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {entry.type === 'grading' ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`grade-badge grade-${entry.grade} !text-[10px] !px-2 !py-0.5`}>
                        {t.grades[entry.grade as keyof typeof t.grades] || entry.grade}
                      </span>
                      {entry.fruitType && (
                        <span className="text-xs text-secondary capitalize">{entry.fruitType}</span>
                      )}
                      {entry.confidence !== undefined && (
                        <span className="text-[11px] text-muted tabular-nums">
                          {(entry.confidence * 100).toFixed(1)}%
                        </span>
                      )}
                      {entry.farmOriginName && (
                        <span className="text-[10px] text-muted px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-input)' }}>
                          {entry.farmOriginName}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-[#ff453a]">{t.notifications.anomalyTitle}</span>
                      <p className="text-[11px] text-secondary mt-0.5">
                        {t.grades[entry.grade as keyof typeof t.grades] || entry.grade}: {entry.ratio}% ({t.notificationLog.threshold}: {entry.threshold}%)
                      </p>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted tabular-nums">{formatTime(entry.timestamp)}</p>
                  <p className="text-[10px] text-muted tabular-nums">{formatDate(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
