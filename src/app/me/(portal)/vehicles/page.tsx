'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Hash, Calendar, Palette, Gauge } from 'lucide-react';
import { api } from '@/lib/apiClient';
import type { Vehicle } from '@/types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<{ vehicles: Vehicle[] }>('/api/me/vehicles')
      .then((res) => { if (!cancelled) setVehicles(res.vehicles ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Vehicles</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Cars we have on file for you.</p>
      </motion.div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">Loading…</p>
      ) : vehicles.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Car className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-tertiary)]">No vehicles on file yet. Book a service and we&apos;ll add yours automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/15 to-red-600/10 flex items-center justify-center flex-shrink-0">
                  <Car className="h-6 w-6 text-red-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                    {v.make} {v.model}
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{v.licensePlate}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Year" value={String(v.year)} />
                <Row icon={<Palette className="h-3.5 w-3.5" />} label="Color" value={v.color || '—'} />
                <Row icon={<Hash className="h-3.5 w-3.5" />} label="VIN" value={v.vin && v.vin !== '—' ? v.vin : '—'} mono />
                <Row icon={<Gauge className="h-3.5 w-3.5" />} label="Mileage" value={v.mileage ? `${v.mileage.toLocaleString()} km` : '—'} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
      <span className="flex items-center gap-2 text-[var(--text-tertiary)]">
        {icon} {label}
      </span>
      <span className={`text-[var(--text-secondary)] ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
