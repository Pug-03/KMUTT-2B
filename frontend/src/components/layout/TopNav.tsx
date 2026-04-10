'use client';

import { useApp } from '@/contexts/AppContext';
import { Locale, localeNames } from '@/i18n/locales';

const AI_MODELS = [
  { id: 'yolo11n-tomato', name: 'YOLO v11 Tomato' },
  { id: 'yolo11n-cls', name: 'YOLO v11 Nano' },
];

export default function TopNav() {
  const { t, locale, setLocale, selectedModel, setSelectedModel, isConnected, theme, toggleTheme } = useApp();

  return (
    <nav className="glass-nav px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-[10px] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-emerald-500/20">
          FG
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-[15px] font-semibold text-primary truncate tracking-tight">{t.app.title}</h1>
          <p className="text-[11px] text-muted truncate hidden sm:block">{t.app.subtitle}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Connection Pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
          isConnected
            ? 'bg-green-500/10 text-green-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative w-[52px] h-[28px] rounded-full transition-all duration-300 shrink-0"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(135deg, #1c1c1e, #2c2c2e)'
              : 'linear-gradient(135deg, #e5e5ea, #f5f5f7)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
          }}
          aria-label="Toggle theme"
        >
          <span
            className={`absolute top-[3px] w-[22px] h-[22px] rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
              theme === 'dark'
                ? 'left-[3px] bg-indigo-500'
                : 'left-[27px] bg-amber-400'
            }`}
          >
            {theme === 'dark' ? (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        </button>

        {/* Model Selector */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="apple-input apple-input-sm max-w-[140px] sm:max-w-none hidden sm:block"
        >
          {AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>

        {/* Language Switcher */}
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="apple-input apple-input-sm"
        >
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <option key={loc} value={loc}>{localeNames[loc]}</option>
          ))}
        </select>
      </div>
    </nav>
  );
}
