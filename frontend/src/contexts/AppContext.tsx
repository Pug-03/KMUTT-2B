'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Locale, Translations, translations } from '@/i18n/locales';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export type Grade = 'damaged' | 'old' | 'ripe' | 'unripe';

export interface Counters {
  damaged: number;
  old: number;
  ripe: number;
  unripe: number;
  total: number;
}

export interface MachineState {
  conveyorSpeed: number;
  isRunning: boolean;
  bins: Record<Grade, { capacity: number; current: number }>;
  connected: boolean;
  machineId: string;
  uptime: number;
}

export interface GradingResult {
  grade: Grade;
  fruitType: string;
  confidence: number;
  timestamp: number;
}

interface AppContextType {
  // i18n
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;

  // AI Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Socket & Real-time data
  socket: Socket | null;
  isConnected: boolean;
  counters: Counters;

  // Latest grading
  latestGrading: GradingResult | null;
  currentFruitType: string;
  setCurrentFruitType: (type: string) => void;

  // Machine
  machineState: MachineState;
  sendMachineCommand: (action: string, value?: any) => Promise<void>;

  // Simulation
  isSimulating: boolean;
  toggleSimulation: () => void;
  resetCounters: () => void;
}

const defaultMachineState: MachineState = {
  conveyorSpeed: 50,
  isRunning: false,
  bins: {
    damaged: { capacity: 100, current: 0 },
    old: { capacity: 100, current: 0 },
    ripe: { capacity: 200, current: 0 },
    unripe: { capacity: 150, current: 0 },
  },
  connected: false,
  machineId: '',
  uptime: 0,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [selectedModel, setSelectedModel] = useState('yolo11n-tomato');
  const [counters, setCounters] = useState<Counters>({ damaged: 0, old: 0, ripe: 0, unripe: 0, total: 0 });
  const [latestGrading, setLatestGrading] = useState<GradingResult | null>(null);
  const [currentFruitType, setCurrentFruitType] = useState('tomato');
  const [machineState, setMachineState] = useState<MachineState>(defaultMachineState);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('counters:update', (data: Counters) => setCounters(data));
    socket.on('grading:live', (data: GradingResult) => setLatestGrading(data));
    socket.on('machine:status', (data: MachineState) => setMachineState(data));

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMachineCommand = useCallback(async (action: string, value?: any) => {
    const res = await fetch(`${BACKEND_URL}/api/machine-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, value, machineId: machineState.machineId }),
    });
    const data = await res.json();
    if (data.state) setMachineState(data.state);
  }, [machineState.machineId]);

  const toggleSimulation = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (isSimulating) {
      socket.emit('simulation:stop');
    } else {
      socket.emit('simulation:start');
    }
    setIsSimulating(!isSimulating);
  }, [isSimulating]);

  const resetCounters = useCallback(() => {
    socketRef.current?.emit('counters:reset');
  }, []);

  const t = translations[locale];

  return (
    <AppContext.Provider
      value={{
        locale, setLocale, t,
        selectedModel, setSelectedModel,
        socket: socketRef.current, isConnected, counters,
        latestGrading, currentFruitType, setCurrentFruitType,
        machineState, sendMachineCommand,
        isSimulating, toggleSimulation, resetCounters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
