'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp, Grade, ALL_GRADES } from '@/contexts/AppContext';

const APPLE_COLORS: Record<Grade, string> = {
  gradeA: '#34c759',
  gradeB: '#0a84ff',
  gradeC: '#ff9f0a',
  unripe: '#a8d830',
  rotten: '#ff453a',
  wilted: '#bf5af2',
};

interface Props {
  height?: number;
}

export default function GradeDistributionChart({ height = 280 }: Props) {
  const { t, counters } = useApp();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = ALL_GRADES
    .map((g) => ({
      name: t.grades[g],
      value: counters[g],
      grade: g,
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-muted" style={{ height }}>
        <svg className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-sm">{t.analytics.noDetection}</p>
      </div>
    );
  }

  const hoveredEntry = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              onMouseLeave={() => setHoveredIndex(null)}
              animationBegin={0}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.grade}
                  fill={APPLE_COLORS[entry.grade]}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    filter: hoveredIndex === index ? `drop-shadow(0 0 12px ${APPLE_COLORS[entry.grade]}60)` : 'none',
                    opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1,
                    transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                const pct = counters.total > 0 ? ((Number(item.value) / counters.total) * 100).toFixed(1) : '0';
                return (
                  <div
                    className="rounded-[12px] px-3.5 py-2.5 text-xs shadow-xl"
                    style={{
                      background: 'var(--bg-card-solid)',
                      border: '1px solid var(--border)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <p className="font-semibold text-primary">{item.name}</p>
                    <p className="text-secondary mt-0.5">{item.value} fruits ({pct}%)</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {hoveredEntry ? (
            <div className="text-center animate-fade-in">
              <p className="text-2xl font-bold text-primary tabular-nums">{hoveredEntry.value}</p>
              <p className="text-[11px] text-secondary font-medium">{hoveredEntry.name}</p>
              <p className="text-[10px] text-muted">{counters.total > 0 ? ((hoveredEntry.value / counters.total) * 100).toFixed(1) : 0}%</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl font-bold text-primary tabular-nums">{counters.total}</p>
              <p className="text-[11px] text-muted">Total</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex flex-wrap justify-center gap-2 mt-3 px-2">
        {data.map((entry, index) => (
          <button
            key={entry.grade}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
              hoveredIndex === index ? 'scale-105' : hoveredIndex !== null ? 'opacity-50' : 'opacity-80 hover:opacity-100'
            }`}
            style={{
              background: hoveredIndex === index ? `${APPLE_COLORS[entry.grade]}15` : 'transparent',
              color: APPLE_COLORS[entry.grade],
            }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: APPLE_COLORS[entry.grade] }} />
            {entry.name}: {entry.value}
          </button>
        ))}
      </div>
    </div>
  );
}
