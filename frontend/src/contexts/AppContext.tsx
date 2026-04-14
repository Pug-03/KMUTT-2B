'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Locale, Translations, translations } from '@/i18n/locales';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export type Grade = 'gradeA' | 'gradeB' | 'gradeC' | 'unripe' | 'rotten' | 'wilted';

export const ALL_GRADES: Grade[] = ['gradeA', 'gradeB', 'gradeC', 'unripe', 'rotten', 'wilted'];

/* ── Tomato Varieties ─────────────────────────────────────── */
export type VarietyRegion = 'TH' | 'UK' | 'CN';

export interface TomatoVariety {
  id: string;
  name: string;
  nameLocal: string;
  region: VarietyRegion;
  weightMinG: number;
  weightMaxG: number;
  /** Default base price THB/kg (user can adjust) */
  defaultPricePerKg: number;
  desc: string;
}

export const TOMATO_VARIETIES: TomatoVariety[] = [
  // ── Thailand ──────────────────────────────────────────
  {
    id: 'th-peach', name: 'Peach Tomato', nameLocal: 'มะเขือเทศท้อ',
    region: 'TH', weightMinG: 80, weightMaxG: 140,
    defaultPricePerKg: 120,
    desc: 'เนื้อแน่น หนังบาง ทรงกลมรี นิยมใช้ทำอาหารและซอส',
  },
  {
    id: 'th-sida', name: 'Sida Tomato', nameLocal: 'มะเขือเทศสีดา',
    region: 'TH', weightMinG: 40, weightMaxG: 60,
    defaultPricePerKg: 200,
    desc: 'ผลเล็กทรงยาว สีแดงสด รสหวานอมเปรี้ยว นิยมกินสด',
  },
  {
    id: 'th-sisaket', name: 'Sisaket Tomato', nameLocal: 'มะเขือเทศศรีสะเกษ',
    region: 'TH', weightMinG: 20, weightMaxG: 30,
    defaultPricePerKg: 150,
    desc: 'พันธุ์จิ๋วจากศรีสะเกษ สีแดงเข้ม รสเปรี้ยวจัด ให้ผลดก',
  },
  // ── United Kingdom ────────────────────────────────────
  {
    id: 'uk-beef', name: 'Beefsteak', nameLocal: 'Beefsteak Tomato',
    region: 'UK', weightMinG: 200, weightMaxG: 400,
    defaultPricePerKg: 250,
    desc: 'Classic large beefsteak, rich red, dense flesh, ideal for slicing',
  },
  {
    id: 'uk-marmande', name: 'Marmande', nameLocal: 'Marmande',
    region: 'UK', weightMinG: 180, weightMaxG: 250,
    defaultPricePerKg: 220,
    desc: 'French heirloom, ribbed shape, deep crimson, full flavour',
  },
  {
    id: 'uk-costoluto', name: 'Costoluto', nameLocal: 'Costoluto Fiorentino',
    region: 'UK', weightMinG: 150, weightMaxG: 300,
    defaultPricePerKg: 230,
    desc: 'Italian heirloom, deeply ribbed, intense red, rich aroma',
  },
  // ── China ─────────────────────────────────────────────
  {
    id: 'cn-dahong', name: 'Big Red', nameLocal: '大红番茄',
    region: 'CN', weightMinG: 150, weightMaxG: 250,
    defaultPricePerKg: 140,
    desc: '标准大红番茄，圆形，产量高，市场常见品种',
  },
  {
    id: 'cn-yingguo', name: 'Hard Fruit Red', nameLocal: '硬果红番茄',
    region: 'CN', weightMinG: 140, weightMaxG: 220,
    defaultPricePerKg: 150,
    desc: '果肉紧实，耐运输，厚壁红色，适合长途销售',
  },
  {
    id: 'cn-daguo', name: 'Large Fruit', nameLocal: '大果番茄',
    region: 'CN', weightMinG: 200, weightMaxG: 350,
    defaultPricePerKg: 180,
    desc: '大果型番茄，深红色，汁多肉厚，口感优质',
  },
];

/**
 * Grade multipliers applied to the variety base price.
 * Grade A = full price, B = 85%, C = 65%, Unripe = 25%, Rotten/Wilted = 0.
 */
export const GRADE_PRICE_MULTIPLIER: Record<Grade, number> = {
  gradeA: 1.0,
  gradeB: 0.85,
  gradeC: 0.65,
  unripe: 0.25,
  rotten: 0,
  wilted: 0,
};

/** Derive per-grade prices from a base price/kg. */
export function basePriceToGradePrices(basePerKg: number): Record<Grade, number> {
  const prices = {} as Record<Grade, number>;
  for (const g of ALL_GRADES) {
    prices[g] = Math.round(basePerKg * GRADE_PRICE_MULTIPLIER[g]);
  }
  return prices;
}

/** How many fruits make 1 kg (returns [max-count, min-count] for [minWeight, maxWeight]). */
export function fruitsPerKg(v: TomatoVariety): [number, number] {
  return [
    Math.ceil(1000 / v.weightMinG),   // more small fruits needed
    Math.ceil(1000 / v.weightMaxG),    // fewer large fruits needed
  ];
}

export const GRADE_PRICES: Record<Grade, number> = {
  gradeA: 240,
  gradeB: 180,
  gradeC: 90,
  unripe: 45,
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
  basePricePerKg: number;
  setBasePricePerKg: (price: number) => void;
  selectedVarietyId: string;
  selectVariety: (id: string) => void;
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
  const defaultVariety = TOMATO_VARIETIES[0];
  const [selectedVarietyId, setSelectedVarietyId] = useState(defaultVariety.id);
  const [basePricePerKg, setBasePricePerKgRaw] = useState(defaultVariety.defaultPricePerKg);
  const [gradePrices, setGradePrices] = useState<Record<Grade, number>>(basePriceToGradePrices(defaultVariety.defaultPricePerKg));
  const [activeFarm, setActiveFarm] = useState<FarmInfo | null>(null);

  const setBasePricePerKg = useCallback((price: number) => {
    setBasePricePerKgRaw(price);
    setGradePrices(basePriceToGradePrices(price));
  }, []);

  const selectVariety = useCallback((id: string) => {
    const v = TOMATO_VARIETIES.find((t) => t.id === id);
    if (!v) return;
    setSelectedVarietyId(id);
    setBasePricePerKgRaw(v.defaultPricePerKg);
    setGradePrices(basePriceToGradePrices(v.defaultPricePerKg));
  }, []);

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
        alerts, dismissAlert, gradingHistory, gradePrices,
        basePricePerKg, setBasePricePerKg,
        selectedVarietyId, selectVariety,
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
