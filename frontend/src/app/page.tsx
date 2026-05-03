'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { IncidentTable } from '@/components/IncidentTable';
import { CreateIncidentModal } from '@/components/CreateIncidentModal';
import { FilterBar } from '@/components/FilterBar';
import { Incident, IncidentFilters } from '@/types/incident';
import { getSocket } from '@/lib/socket';

export default function Home() {
  const [filters, setFilters] = useState<IncidentFilters>({ page: 1, limit: 10 });
  const { data, loading, error, refetch } = useIncidents(filters);
  const [optimisticList, setOptimisticList] = useState<Incident[] | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const prevIdsRef = useRef<Set<string>>(new Set());

  const displayList = optimisticList ?? data?.data ?? [];

  useEffect(() => {
    if (data) setOptimisticList(null);
  }, [data]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('connect', () => setWsStatus('connected'));
    socket.on('disconnect', () => setWsStatus('disconnected'));
    if (socket.connected) setWsStatus('connected');
    return () => { socket.off('connect'); socket.off('disconnect'); };
  }, []);

  useEffect(() => {
    if (!data) return;
    const incoming = new Set(data.data.map((i) => i.id));
    const fresh = new Set([...incoming].filter((id) => !prevIdsRef.current.has(id)));
    if (fresh.size > 0) {
      setNewIds(fresh);
      setTimeout(() => setNewIds(new Set()), 2000);
    }
    prevIdsRef.current = incoming;
  }, [data]);

  const handleOptimisticDelete = useCallback((id: string) => {
    setOptimisticList((prev) => (prev ?? data?.data ?? []).filter((i) => i.id !== id));
  }, [data]);

  const handleOptimisticUpdate = useCallback((updated: Incident) => {
    setOptimisticList((prev) => (prev ?? data?.data ?? []).map((i) => i.id === updated.id ? updated : i));
    setUpdatedIds(new Set([updated.id]));
    setTimeout(() => setUpdatedIds(new Set()), 2000);
  }, [data]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Incident Dashboard</h1>
              <p className="text-xs text-gray-400">Real-time incident management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400' : wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-gray-500 capitalize">{wsStatus}</span>
              {wsStatus === 'disconnected' && (
                <button
                  onClick={() => { getSocket().connect(); setWsStatus('connecting'); }}
                  className="ml-1 text-indigo-500 hover:underline"
                >
                  Reconnect
                </button>
              )}
            </div>
            <CreateIncidentModal onCreated={refetch} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FilterBar filters={filters} onChange={setFilters} />
          {data && (
            <p className="text-sm text-gray-400">
              {data.total} incident{data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500">
            <p className="text-4xl mb-3">⚠</p>
            <p className="font-medium">Failed to load incidents</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
            <button onClick={refetch} className="mt-4 text-sm text-indigo-600 hover:underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && displayList.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-medium text-gray-500">No incidents found</p>
            <p className="text-sm mt-1">Create a new incident or adjust your filters</p>
          </div>
        )}

        {!loading && !error && displayList.length > 0 && (
          <>
            <IncidentTable
              incidents={displayList}
              onOptimisticDelete={handleOptimisticDelete}
              onOptimisticUpdate={handleOptimisticUpdate}
              onRefresh={refetch}
              newIds={newIds}
              updatedIds={updatedIds}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
                  disabled={(filters.page ?? 1) <= 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {filters.page ?? 1} of {totalPages}
                </span>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
                  disabled={(filters.page ?? 1) >= totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
