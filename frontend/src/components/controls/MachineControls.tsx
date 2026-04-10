'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp, Grade, ALL_GRADES } from '@/contexts/AppContext';

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const BIN_COLORS: Record<Grade, string> = {
  gradeA: '#34c759',
  gradeB: '#0a84ff',
  gradeC: '#ff9f0a',
  unripe: '#a8d830',
  rotten: '#ff453a',
  wilted: '#bf5af2',
};

export default function MachineControls() {
  const { t, machineState, sendMachineCommand } = useApp();
  const [speed, setSpeed] = useState(machineState.conveyorSpeed);
  const [liveUptime, setLiveUptime] = useState(0);
  const uptimeRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => { setSpeed(machineState.conveyorSpeed); }, [machineState.conveyorSpeed]);

  useEffect(() => {
    if (machineState.isRunning) {
      setLiveUptime(machineState.uptime);
      uptimeRef.current = setInterval(() => setLiveUptime((prev) => prev + 1000), 1000);
    } else {
      setLiveUptime(0);
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    }
    return () => { if (uptimeRef.current) clearInterval(uptimeRef.current); };
  }, [machineState.isRunning, machineState.uptime]);

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <h2 className="text-lg font-bold text-primary tracking-tight">{t.controls.title}</h2>

      {/* Connection */}
      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.controls.machineStatus}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${machineState.connected ? 'bg-[#34c759]' : 'bg-gray-600'}`} />
              <span className={`text-sm font-medium ${machineState.connected ? 'text-[#34c759]' : 'text-muted'}`}>
                {machineState.connected ? t.controls.connected : t.controls.disconnected}
              </span>
            </div>
            {machineState.connected && (
              <p className="text-[11px] text-muted mt-0.5">ID: {machineState.machineId}</p>
            )}
          </div>
          <button
            onClick={() => sendMachineCommand(machineState.connected ? 'disconnect' : 'connect')}
            className={`btn-sm ${machineState.connected ? 'btn-danger' : 'btn-primary'}`}
          >
            {machineState.connected ? t.controls.disconnect : t.controls.connect}
          </button>
        </div>
      </div>

      {machineState.connected ? (
        <div className="space-y-4 animate-slide-up">
          {/* Uptime */}
          <div className="glass p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.controls.uptime}</p>
                <p className="text-2xl font-mono font-bold text-primary mt-1.5 tabular-nums tracking-tight">{formatUptime(liveUptime)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${machineState.isRunning ? 'bg-[#34c759]/15 text-[#34c759]' : 'text-muted'}`} style={!machineState.isRunning ? { background: 'var(--bg-input)' } : {}}>
                  {machineState.isRunning ? t.controls.running : t.controls.stopped}
                </span>
                <button
                  onClick={() => sendMachineCommand(machineState.isRunning ? 'stop' : 'start')}
                  className={`btn-sm ${machineState.isRunning ? 'btn-danger' : 'btn-primary'}`}
                >
                  {machineState.isRunning ? t.controls.stop : t.controls.start}
                </button>
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.controls.conveyorSpeed}</p>
              <span className="text-sm font-bold text-primary tabular-nums">{speed}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              onMouseUp={() => sendMachineCommand('setSpeed', speed)}
              onTouchEnd={() => sendMachineCommand('setSpeed', speed)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1.5">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Bins */}
          <div className="glass p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.controls.binCapacity}</p>
              <button onClick={() => sendMachineCommand('resetBins')} className="text-[11px] text-muted hover:text-primary transition-colors font-medium">
                {t.controls.resetBins}
              </button>
            </div>
            {ALL_GRADES.map((grade) => {
              const bin = machineState.bins[grade];
              const percentage = (bin.current / bin.capacity) * 100;
              const isNearFull = percentage >= 80;
              const color = BIN_COLORS[grade];

              return (
                <div key={grade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-secondary font-medium">{t.grades[grade]}</span>
                    <span className={`text-[11px] tabular-nums font-medium ${isNearFull ? 'text-[#ff453a]' : 'text-muted'}`}>
                      {bin.current}/{bin.capacity}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${isNearFull ? 'animate-pulse' : ''}`}
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        boxShadow: percentage > 0 ? `0 0 8px ${color}30` : 'none',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass text-center py-10 animate-fade-in">
          <svg className="w-14 h-14 mx-auto text-muted mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-muted">{t.controls.proprietaryOnly}</p>
          <button onClick={() => sendMachineCommand('connect')} className="btn-primary btn-sm mt-4">
            {t.controls.connect}
          </button>
        </div>
      )}
    </div>
  );
}
