'use client';

import { useState } from 'react';
import { useApp, Grade, ALL_GRADES, WEIGHT_PER_FRUIT_KG } from '@/contexts/AppContext';
import GradeDistributionChart from '@/components/charts/GradeDistributionChart';
import NotificationLog from '@/components/notifications/NotificationLog';
import FarmManager from '@/components/farm/FarmManager';
import MiniScanner from '@/components/scanner/MiniScanner';
import GradeIcon from '@/components/ui/GradeIcon';

const APPLE_GRADE_COLORS: Record<Grade, string> = {
  gradeA: '#34c759',
  gradeB: '#0a84ff',
  gradeC: '#ff9f0a',
  unripe: '#a8d830',
  rotten: '#ff453a',
  wilted: '#bf5af2',
};

export default function AnalyticsDashboard() {
  const { t, counters, latestGrading, gradePrices, setGradePrices, activeFarm } = useApp();
  const [editingPrices, setEditingPrices] = useState(false);

  const maxCount = Math.max(...ALL_GRADES.map((g) => counters[g]), 1);
  const totalWeightKg = counters.total * WEIGHT_PER_FRUIT_KG;
  const totalRevenue = ALL_GRADES.reduce((sum, g) => sum + counters[g] * WEIGHT_PER_FRUIT_KG * gradePrices[g], 0);
  const gradeARate = counters.total > 0 ? ((counters.gradeA / counters.total) * 100) : 0;
  const defectRate = counters.total > 0
    ? (((counters.rotten + counters.wilted) / counters.total) * 100)
    : 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight">{t.analytics.title}</h2>
        <p className="text-sm text-secondary mt-1">Real-time quality metrics and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 stagger-children">
        {/* Total Processed */}
        <div className="glass p-5 lg:p-6">
          <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.analytics.totalProcessed}</p>
          <p className="text-3xl lg:text-4xl font-bold text-primary mt-3 tabular-nums tracking-tight animate-count">
            {counters.total.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted mt-1.5">{totalWeightKg.toFixed(2)} kg</p>
        </div>

        {/* Grade A Rate */}
        <div className="glass p-5 lg:p-6 glow-gradeA">
          <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">Grade A Rate</p>
          <p className="text-3xl lg:text-4xl font-bold mt-3 tabular-nums tracking-tight" style={{ color: '#34c759' }}>
            {gradeARate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-muted mt-1.5">{counters.gradeA} of {counters.total}</p>
        </div>

        {/* Revenue */}
        <div className="glass p-5 lg:p-6 glow-gradeB">
          <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.analytics.revenueEstimate}</p>
          <p className="text-3xl lg:text-4xl font-bold mt-3 tabular-nums tracking-tight" style={{ color: '#0a84ff' }}>
            {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-muted mt-1.5">THB ({totalWeightKg.toFixed(2)} kg)</p>
        </div>

        {/* Defect Rate */}
        <div className={`glass p-5 lg:p-6 ${defectRate > 15 ? 'glow-rotten' : ''}`}>
          <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">Defect Rate</p>
          <p className={`text-3xl lg:text-4xl font-bold mt-3 tabular-nums tracking-tight ${defectRate > 15 ? 'text-[#ff453a]' : 'text-secondary'}`}>
            {defectRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-muted mt-1.5">rotten + wilted</p>
        </div>
      </div>

      {/* Latest Detection Banner */}
      {latestGrading && (
        <div className={`glass p-4 sm:p-5 flex items-center justify-between animate-scale-in glow-${latestGrading.grade}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`grade-badge grade-${latestGrading.grade} text-sm px-4 py-2 inline-flex items-center gap-1.5`}>
              <GradeIcon grade={latestGrading.grade} size={14} />
              {t.grades[latestGrading.grade]}
            </span>
            <span className="text-sm text-secondary">{t.scanner.tomatoDetected}</span>
            {latestGrading.defect && (
              <span className="text-xs text-[#ff453a] bg-[#ff453a]/10 px-2.5 py-1 rounded-full font-medium">
                {t.defects[latestGrading.defect]}
              </span>
            )}
            {latestGrading.farmOriginName && (
              <span className="text-xs text-muted px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--bg-input)' }}>
                {t.farms.origin}: {latestGrading.farmOriginName}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted">{t.scanner.confidence}</span>
            <p className="text-xl font-bold text-primary tabular-nums">{(latestGrading.confidence * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Mini Scanner + Pie Chart + Notification Log Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Mini Scanner */}
        <div className="glass p-5 lg:p-6 animate-slide-up">
          <MiniScanner />
        </div>

        {/* Pie Chart */}
        <div className="glass p-5 lg:p-6 animate-slide-up">
          <p className="text-sm font-semibold text-primary mb-1">Grade Distribution</p>
          <p className="text-[11px] text-muted mb-4">Hover segments for details</p>
          <GradeDistributionChart height={280} />
        </div>

        {/* Notification Log */}
        <div className="glass !p-0 overflow-hidden animate-slide-up" style={{ minHeight: '400px', maxHeight: '500px' }}>
          <NotificationLog />
        </div>
      </div>

      {/* Grade Breakdown + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Grade Breakdown */}
        <div className="glass p-5 lg:p-6 space-y-3">
          <p className="text-sm font-semibold text-primary">{t.analytics.gradeBreakdown}</p>
          <div className="space-y-2.5">
            {ALL_GRADES.map((grade) => {
              const count = counters[grade];
              const percentage = counters.total > 0 ? (count / counters.total) * 100 : 0;
              const barWidth = (count / maxCount) * 100;
              const color = APPLE_GRADE_COLORS[grade];

              return (
                <div key={grade} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color }}>
                      <GradeIcon grade={grade} size={14} />
                      {t.grades[grade]}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary tabular-nums">{count}</span>
                      <span className="text-xs text-muted tabular-nums w-14 text-right font-medium">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        boxShadow: barWidth > 0 ? `0 0 8px ${color}30` : 'none',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue */}
        <div className="glass p-5 lg:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">{t.analytics.revenueEstimate}</p>
            <button
              onClick={() => setEditingPrices(!editingPrices)}
              className="text-xs font-semibold transition-all px-3 py-1.5 rounded-full"
              style={{
                color: 'var(--accent)',
                background: 'rgba(10, 132, 255, 0.1)',
              }}
            >
              {editingPrices ? 'Done' : 'Edit Prices'}
            </button>
          </div>

          <div className="space-y-1">
            {ALL_GRADES.map((grade) => {
              const count = counters[grade];
              const price = gradePrices[grade];
              const weightKg = count * WEIGHT_PER_FRUIT_KG;
              const revenue = weightKg * price;
              const color = APPLE_GRADE_COLORS[grade];
              return (
                <div key={grade} className="flex items-center justify-between gap-2 py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm font-medium shrink-0 inline-flex items-center gap-1.5" style={{ color }}>
                    <GradeIcon grade={grade} size={13} />
                    {t.grades[grade]}
                  </span>
                  {editingPrices ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setGradePrices({ ...gradePrices, [grade]: Number(e.target.value) })}
                        className="apple-input apple-input-sm w-20 text-right"
                        min={0}
                      />
                      <span className="text-xs text-muted">THB/kg</span>
                    </div>
                  ) : (
                    <span className="text-sm text-primary tabular-nums">
                      {price > 0 ? `${weightKg.toFixed(2)} kg \u00d7 ${price} = ${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} THB` : '\u2014'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-strong)' }}>
            <span className="text-base text-primary font-bold">Total Revenue</span>
            <span className="text-xl font-bold tabular-nums" style={{ color: '#34c759' }}>
              {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} THB
            </span>
          </div>
        </div>
      </div>

      {/* Farm Management */}
      <div className="glass !p-0 overflow-hidden">
        <FarmManager />
      </div>
    </div>
  );
}
