'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Locale, Translations, translations } from '@/i18n/locales';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export type Grade = 'gradeA' | 'gradeB' | 'gradeC' | 'unripe' | 'rotten' | 'wilted';

export const ALL_GRADES: Grade[] = ['gradeA', 'gradeB', 'gradeC', 'unripe', 'rotten', 'wilted'];

/** Avg weight per fruit: ~15.4g (6.5 fruits per 100g). Prices are THB/kg. */
export const WEIGHT_PER_FRUIT_KG = 0.01538;

export const GRADE_PRICES: Record<Grade, number> = {
  gradeA: 120,
  gradeB: 80,
  gradeC: 45,
  unripe: 20,
  rotten: 0,
  wilted: 0,
};

export interface Counters {
  gradeA: number;
  gradeB: number;
  gradeC: number;
  unripe: number;
  rotten: number;
  wilted: number;
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

export type Theme = 'dark' | 'light';
export type Defect = 'crack' | 'blackSpot' | 'bruise' | 'spoilage' | null;

export interface FarmInfo {
  _id: string;
  name: string;
  location: string;
  contact: string;
}

export interface GradingResult {
  grade: Grade;
  fruitType: string;
  confidence: number;
  timestamp: number;
  defect?: Defect;
  revenueEstimate?: number;
  farmOrigin?: string;       // farm _id
  farmOriginName?: string;   // farm name for display
}

export interface AnomalyAlert {
  grade: string;
  ratio: number;
  threshold: number;
  count: number;
  total: number;
  timestamp: number;
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  socket: Socket | null;
  isConnected: boolean;
  counters: Counters;
  latestGrading: GradingResult | null;
  currentFruitType: string;
  setCurrentFruitType: (type: string) => void;
  machineState: MachineState;
  sendMachineCommand: (action: string, value?: any) => Promise<void>;
  isSimulating: boolean;
  toggleSimulation: () => void;
  resetCounters: () => void;
  alerts: AnomalyAlert[];
  dismissAlert: (index: number) => void;
  gradingHistory: GradingResult[];
  gradePrices: Record<Grade, number>;
  setGradePrices: (prices: Record<Grade, number>) => void;
  // Farm traceability
  activeFarm: FarmInfo | null;
  setActiveFarm: (farm: FarmInfo | null) => void;
}

const defaultMachineState: MachineState = {
  conveyorSpeed: 50,
  isRunning: false,
  bins: {
    gradeA: { capacity: 200, current: 0 },
    gradeB: { capacity: 200, current: 0 },
    gradeC: { capacity: 150, current: 0 },
    unripe: { capacity: 100, current: 0 },
    rotten: { capacity: 100, current: 0 },
    wilted: { capacity: 100, current: 0 },
  },
  connected: false,
  machineId: '',
  uptime: 0,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [locale, setLocale] = useState<Locale>('en');
  const [selectedModel, setSelectedModel] = useState('yolo11n-tomato');
  const [counters, setCounters] = useState<Counters>({ gradeA: 0, gradeB: 0, gradeC: 0, unripe: 0, rotten: 0, wilted: 0, total: 0 });
  const [latestGrading, setLatestGrading] = useState<GradingResult | null>(null);
  const [currentFruitType, setCurrentFruitType] = useState('tomato');
  const [machineState, setMachineState] = useState<MachineState>(defaultMachineState);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [gradingHistory, setGradingHistory] = useState<GradingResult[]>([]);
  const [gradePrices, setGradePrices] = useState<Record<Grade, number>>({ ...GRADE_PRICES });
  const [activeFarm, setActiveFarm] = useState<FarmInfo | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('counters:update', (data: Counters) => setCounters(data));
    socket.on('grading:live', (data: GradingResult) => {
      setLatestGrading(data);
      setGradingHistory((prev) => [...prev.slice(-199), data]);
    });
    socket.on('machine:status', (data: MachineState) => setMachineState(data));
    socket.on('anomaly:alert', (data: AnomalyAlert) => {
      setAlerts((prev) => [...prev, data]);
    });

    return () => { socket.disconnect(); };
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
      socket.emit('simulation:start', { farmOrigin: activeFarm?._id, farmOriginName: activeFarm?.name });
    }
    setIsSimulating(!isSimulating);
  }, [isSimulating, activeFarm]);

  const resetCounters = useCallback(() => {
    socketRef.current?.emit('counters:reset');
    setGradingHistory([]);
    setAlerts([]);
  }, []);

  const dismissAlert = useCallback((index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const t = translations[locale];

  return (
    <AppContext.Provider
      value={{
        theme, toggleTheme,
        locale, setLocale, t,
        selectedModel, setSelectedModel,
        socket: socketRef.current, isConnected, counters,
        latestGrading, currentFruitType, setCurrentFruitType,
        machineState, sendMachineCommand,
        isSimulating, toggleSimulation, resetCounters,
        alerts, dismissAlert, gradingHistory, gradePrices, setGradePrices,
        activeFarm, setActiveFarm,
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
