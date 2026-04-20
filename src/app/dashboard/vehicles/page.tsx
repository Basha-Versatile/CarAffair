'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Car, Gauge, Palette } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ViewToggle from '@/components/ui/ViewToggle';
import Pagination from '@/components/ui/Pagination';

export default function VehiclesPage() {
  const { vehicles, customers } = useAppSelector((state) => state.customers);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const debouncedSearch = useDebounce(searchQuery);

  const filteredVehicles = useMemo(() => {
    if (!debouncedSearch) return vehicles;
    const q = debouncedSearch.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.licensePlate.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q)
    );
  }, [vehicles, debouncedSearch]);

  const totalPages = Math.ceil(filteredVehicles.length / pageSize);
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vehicles</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{vehicles.length} registered vehicles</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by plate, make, model, VIN..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all backdrop-blur-sm"
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedVehicles.map((vehicle, idx) => (
            <motion.div key={vehicle.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                      <Car className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-xs text-[var(--text-tertiary)]">{vehicle.year}</p>
                    </div>
                  </div>
                  <Badge variant="info">{vehicle.licensePlate}</Badge>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Palette className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />Color</div>
                    <span className="text-[var(--text-primary)] font-medium">{vehicle.color}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Gauge className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />Mileage</div>
                    <span className="text-[var(--text-primary)] font-medium">{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
                    <span className="text-[var(--text-secondary)]">Owner</span>
                    <span className="text-[var(--text-primary)] font-medium">{getCustomerName(vehicle.customerId)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
                    <span className="text-[var(--text-secondary)]">VIN</span>
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{vehicle.vin}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[var(--border-color)]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Plate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Color</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Mileage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Owner</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">VIN</th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {paginatedVehicles.map((vehicle, idx) => (
                  <motion.tr key={vehicle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-[var(--bg-glass-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center"><Car className="h-4 w-4 text-red-500" /></div>
                        <div><p className="text-sm font-medium text-[var(--text-primary)]">{vehicle.make} {vehicle.model}</p><p className="text-xs text-[var(--text-tertiary)]">{vehicle.year}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge variant="info">{vehicle.licensePlate}</Badge></td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)]">{vehicle.color}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)]">{vehicle.mileage.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{getCustomerName(vehicle.customerId)}</td>
                    <td className="px-6 py-4 text-xs text-[var(--text-tertiary)] font-mono">{vehicle.vin}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredVehicles.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Car className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-tertiary)]">No vehicles found</p>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
