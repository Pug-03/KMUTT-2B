'use client';

import { useApp, Grade } from '@/contexts/AppContext';

const GRADE_COLORS: Record<Grade, { bg: string; text: string; bar: string }> = {
  damaged: { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' },
  old: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  ripe: { bg: 'bg-green-500/10', text: 'text-green-400', bar: 'bg-green-500' },
  unripe: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
};

const GRADE_ICONS: Record<Grade, string> = {
  damaged: '⚠',
  old: '⏳',
  ripe: '✓',
  unripe: '○',
};

export default function AnalyticsSidebar() {
  const { t, counters, latestGrading, currentFruitType } = useApp();

  const grades: Grade[] = ['damaged', 'old', 'ripe', 'unripe'];
  const maxCount = Math.max(...grades.map((g) => counters[g]), 1);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-white">{t.analytics.title}</h2>

      {/* Current Detection */}
      <div className="card space-y-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{t.analytics.currentFruit}</p>
          <p className="text-xl font-semibold text-white capitalize mt-1">
            {latestGrading?.fruitType || currentFruitType}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{t.analytics.detectedGrade}</p>
          {latestGrading ? (
            <div className="mt-1 flex items-center gap-2">
              <span className={`grade-badge grade-${latestGrading.grade}`}>
                {GRADE_ICONS[latestGrading.grade]} {t.grades[latestGrading.grade]}
              </span>
              <span className="text-xs text-gray-500">
                {(latestGrading.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">{t.analytics.noDetection}</p>
          )}
        </div>
      </div>

      {/* Total Counter */}
      <div className="card">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{t.analytics.totalProcessed}</p>
        <p className="text-4xl font-bold text-white mt-2 tabular-nums">{counters.total.toLocaleString()}</p>
      </div>

      {/* Grade Breakdown */}
      <div className="card space-y-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{t.analytics.gradeBreakdown}</p>
        {grades.map((grade) => {
          const count = counters[grade];
          const percentage = counters.total > 0 ? (count / counters.total) * 100 : 0;
          const barWidth = (count / maxCount) * 100;
          const colors = GRADE_COLORS[grade];

          return (
            <div key={grade} className={`${colors.bg} rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-sm font-medium ${colors.text}`}>
                  {GRADE_ICONS[grade]} {t.grades[grade]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tabular-nums">{count}</span>
                  <span className="text-xs text-gray-400 tabular-nums w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className={`${colors.bar} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
