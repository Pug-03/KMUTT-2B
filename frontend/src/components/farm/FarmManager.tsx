'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface Farm { _id: string; name: string; location: string; contact: string; notes: string; }
interface FarmBatch { _id: string; farmId: string; dateFrom: string; dateTo: string; notes: string; }
interface FarmStats { total: number; grades: Record<string, number>; }

export default function FarmManager() {
  const { t, activeFarm, setActiveFarm } = useApp();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newContact, setNewContact] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);
  const [batches, setBatches] = useState<FarmBatch[]>([]);
  const [farmStats, setFarmStats] = useState<FarmStats | null>(null);
  const [batchFrom, setBatchFrom] = useState('');
  const [batchTo, setBatchTo] = useState('');

  const loadFarms = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/farms`);
      const data = await res.json();
      if (Array.isArray(data)) setFarms(data);
    } catch { /* DB might not be connected */ }
  }, []);

  useEffect(() => { loadFarms(); }, [loadFarms]);

  const loadBatches = useCallback(async (farmId: string) => {
    try {
      const [batchRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/farms/${farmId}/batches`),
        fetch(`${BACKEND_URL}/api/farms/stats/${farmId}`),
      ]);
      const batchData = await batchRes.json();
      const statsData = await statsRes.json();
      if (Array.isArray(batchData)) setBatches(batchData);
      if (statsData && typeof statsData.total === 'number') setFarmStats(statsData);
    } catch { setBatches([]); setFarmStats(null); }
  }, []);

  useEffect(() => { if (selectedFarm) loadBatches(selectedFarm); }, [selectedFarm, loadBatches]);

  const addFarm = async () => {
    if (!newName.trim()) return;
    try {
      await fetch(`${BACKEND_URL}/api/farms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, location: newLocation, contact: newContact }) });
      setNewName(''); setNewLocation(''); setNewContact(''); loadFarms();
    } catch { /* ignore */ }
  };

  const deleteFarm = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/farms/${id}`, { method: 'DELETE' });
      if (selectedFarm === id) { setSelectedFarm(null); setBatches([]); setFarmStats(null); }
      loadFarms();
    } catch { /* ignore */ }
  };

  const addBatch = async () => {
    if (!selectedFarm || !batchFrom || !batchTo) return;
    try {
      await fetch(`${BACKEND_URL}/api/farms/${selectedFarm}/batches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dateFrom: batchFrom, dateTo: batchTo }) });
      setBatchFrom(''); setBatchTo(''); loadBatches(selectedFarm);
    } catch { /* ignore */ }
  };

  return (
    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
      <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">{t.farms.title}</h2>

      {/* Active Farm Indicator */}
      {activeFarm && (
        <div className="glass p-3 sm:p-4 glow-gradeA animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#34c759] animate-pulse" />
              <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.farms.activeFarm}</p>
            </div>
            <button
              onClick={() => setActiveFarm(null)}
              className="text-[11px] text-muted hover:text-primary transition-colors font-medium"
            >
              Clear
            </button>
          </div>
          <p className="text-sm font-bold text-primary mt-2">{activeFarm.name}</p>
          {activeFarm.location && <p className="text-[11px] text-muted">{activeFarm.location}</p>}
        </div>
      )}

      {/* Add Farm */}
      <div className="glass p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.farms.addFarm}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.farms.farmName} className="apple-input apple-input-mobile flex-1 min-w-0" />
          <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder={t.farms.location} className="apple-input apple-input-mobile flex-1 min-w-0" />
        </div>
        <input type="text" value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder={t.farms.contact} className="apple-input apple-input-mobile w-full" />
        <button onClick={addFarm} className="btn-primary btn-sm-mobile w-full">{t.farms.addFarm}</button>
      </div>

      {/* Farm List */}
      {farms.length === 0 ? (
        <div className="glass text-center py-8">
          <p className="text-sm text-muted">{t.farms.noFarms}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {farms.map((farm) => {
            const isSelected = selectedFarm === farm._id;
            const isActive = activeFarm?._id === farm._id;
            return (
              <div
                key={farm._id}
                className={`glass glass-hover cursor-pointer transition-all duration-300 p-3 sm:p-4 ${isSelected ? 'glow-gradeB scale-[1.01]' : ''} ${isActive ? 'ring-2 ring-[#34c759]/40' : ''}`}
                onClick={() => setSelectedFarm(farm._id === selectedFarm ? null : farm._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-primary truncate">{farm.name}</p>
                      {isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#34c759]/15 text-[#34c759] shrink-0">ACTIVE</span>
                      )}
                    </div>
                    {farm.location && <p className="text-[11px] text-muted mt-0.5 truncate">{farm.location}</p>}
                    {farm.contact && <p className="text-[11px] text-muted truncate">{farm.contact}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveFarm({ _id: farm._id, name: farm.name, location: farm.location, contact: farm.contact }); }}
                        className="text-[11px] sm:text-[11px] font-semibold px-3 py-2 sm:px-2.5 sm:py-1 rounded-full transition-all active:scale-95"
                        style={{ color: 'var(--accent)', background: 'rgba(10, 132, 255, 0.12)', minHeight: '36px' }}
                      >
                        {t.farms.setActive}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFarm(farm._id); }}
                      className="text-muted hover:text-[#ff453a] transition-colors flex items-center justify-center rounded-full active:scale-90"
                      style={{ minWidth: '36px', minHeight: '36px' }}
                      aria-label="Delete farm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Management */}
      {selectedFarm && (
        <div className="space-y-4 animate-slide-up">
          {farmStats && farmStats.total > 0 && (
            <div className="glass p-3 sm:p-4 space-y-2">
              <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">Farm Grade Breakdown</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(farmStats.grades).map(([grade, count]) => (
                  <div key={grade} className="text-center rounded-[10px] p-2.5" style={{ background: 'var(--bg-input)' }}>
                    <p className="text-[11px] text-muted">{grade}</p>
                    <p className="text-lg font-bold text-primary">{count}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted text-right">Total: {farmStats.total}</p>
            </div>
          )}

          <div className="glass p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.farms.addBatch}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <label className="text-[11px] text-muted">{t.farms.dateFrom}</label>
                <input type="date" value={batchFrom} onChange={(e) => setBatchFrom(e.target.value)} className="apple-input apple-input-mobile w-full mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] text-muted">{t.farms.dateTo}</label>
                <input type="date" value={batchTo} onChange={(e) => setBatchTo(e.target.value)} className="apple-input apple-input-mobile w-full mt-1" />
              </div>
            </div>
            <button onClick={addBatch} className="btn-primary btn-sm-mobile w-full">{t.farms.addBatch}</button>
          </div>

          {batches.length > 0 && (
            <div className="glass p-3 sm:p-4 space-y-2">
              <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">{t.farms.batchHistory}</p>
              {batches.map((batch) => (
                <div key={batch._id} className="rounded-[10px] p-2.5" style={{ background: 'var(--bg-input)' }}>
                  <p className="text-xs text-secondary">
                    {new Date(batch.dateFrom).toLocaleDateString()} — {new Date(batch.dateTo).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
