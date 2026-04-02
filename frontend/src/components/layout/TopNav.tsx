'use client';

import { useApp } from '@/contexts/AppContext';
import { Locale, localeNames } from '@/i18n/locales';

const AI_MODELS = [
  { id: 'yolo11n-tomato', name: 'YOLO v11 Tomato (Best)' },
  { id: 'yolo11n-cls', name: 'YOLO v11 Nano (Base)' },
];

export default function TopNav() {
  const { t, locale, setLocale, selectedModel, setSelectedModel, isConnected } = useApp();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
      {/* Logo / Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
          FG
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-white truncate">{t.app.title}</h1>
          <p className="text-xs text-gray-400 truncate hidden sm:block">{t.app.subtitle}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-400 hidden sm:inline">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 hidden md:inline">{t.nav.modelSelector}:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {AI_MODELS.map((model) => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 hidden md:inline">{t.nav.language}:</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {(Object.keys(localeNames) as Locale[]).map((loc) => (
              <option key={loc} value={loc}>{localeNames[loc]}</option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
