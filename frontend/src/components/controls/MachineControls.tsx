'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp, Grade } from '@/contexts/AppContext';

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const BIN_COLORS: Record<Grade, string> = {
  damaged: 'bg-red-500',
  old: 'bg-amber-500',
  ripe: 'bg-green-500',
  unripe: 'bg-blue-500',
};

export default function MachineControls() {
  const { t, machineState, sendMachineCommand } = useApp();
  const [speed, setSpeed] = useState(machineState.conveyorSpeed);
  const [liveUptime, setLiveUptime] = useState(0);
  const uptimeRef = useRef<ReturnType<typeof setInterval>>();

  // Sync speed slider with machine state
  useEffect(() => {
    setSpeed(machineState.conveyorSpeed);
  }, [machineState.conveyorSpeed]);

  // Live uptime counter
  useEffect(() => {
    if (machineState.isRunning) {
      setLiveUptime(machineState.uptime);
      uptimeRef.current = setInterval(() => {
        setLiveUptime((prev) => prev + 1000);
      }, 1000);
    } else {
      setLiveUptime(0);
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    }
    return () => {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    };
  }, [machineState.isRunning, machineState.uptime]);

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleSpeedCommit = () => {
    sendMachineCommand('setSpeed', speed);
  };

  const grades: Grade[] = ['damaged', 'old', 'ripe', 'unripe'];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-white">{t.controls.title}</h2>

      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{t.controls.machineStatus}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2.5 h-2.5 rounded-full ${machineState.connected ? 'bg-green-400' : 'bg-gray-600'}`} />
              <span className={`text-sm font-medium ${machineState.connected ? 'text-green-400' : 'text-gray-500'}`}>
                {machineState.connected ? t.controls.connected : t.controls.disconnected}
              </span>
            </div>
            {machineState.connected && (
              <p className="text-xs text-gray-500 mt-0.5">ID: {machineState.machineId}</p>
            )}
          </div>
          <button
            onClick={() => sendMachineCommand(machineState.connected ? 'disconnect' : 'connect')}
            className={machineState.connected ? 'btn-danger' : 'btn-primary'}
          >
            {machineState.connected ? t.controls.disconnect : t.controls.connect}
          </button>
        </div>
      </div>

      {/* Proprietary Controls - Only when connected */}
      {machineState.connected ? (
        <>
          {/* Start/Stop & Uptime */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{t.controls.uptime}</p>
                <p className="text-2xl font-mono font-bold text-white mt-1">{formatUptime(liveUptime)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${machineState.isRunning ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {machineState.isRunning ? t.controls.running : t.controls.stopped}
                </span>
                <button
                  onClick={() => sendMachineCommand(machineState.isRunning ? 'stop' : 'start')}
                  className={machineState.isRunning ? 'btn-danger' : 'btn-primary'}
                >
                  {machineState.isRunning ? t.controls.stop : t.controls.start}
                </button>
              </div>
            </div>
          </div>

          {/* Conveyor Belt Speed */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{t.controls.conveyorSpeed}</p>
              <span className="text-sm font-bold text-white tabular-nums">{speed}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={speed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              onMouseUp={handleSpeedCommit}
              onTouchEnd={handleSpeedCommit}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Storage Bin Capacity */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{t.controls.binCapacity}</p>
              <button
                onClick={() => sendMachineCommand('resetBins')}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {t.controls.resetBins}
              </button>
            </div>
            {grades.map((grade) => {
              const bin = machineState.bins[grade];
              const percentage = (bin.current / bin.capacity) * 100;
              const isNearFull = percentage >= 80;

              return (
                <div key={grade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{t.grades[grade]}</span>
                    <span className={`text-xs tabular-nums ${isNearFull ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                      {bin.current}/{bin.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className={`${BIN_COLORS[grade]} h-3 rounded-full transition-all duration-500 ${isNearFull ? 'animate-pulse' : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-500">{t.controls.proprietaryOnly}</p>
          <button
            onClick={() => sendMachineCommand('connect')}
            className="btn-primary mt-4"
          >
            {t.controls.connect}
          </button>
        </div>
      )}
    </div>
  );
}
