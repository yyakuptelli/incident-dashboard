'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Incident, IncidentFilters, PaginatedIncidents } from '@/types/incident';

export function useIncidents(filters: IncidentFilters = {}) {
  const [data, setData] = useState<PaginatedIncidents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.list(filtersRef.current);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch, filters.status, filters.severity, filters.service, filters.page]);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (incident: Incident) => {
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, data: [incident, ...prev.data], total: prev.total + 1 };
      });
    };

    const onUpdated = (incident: Incident) => {
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, data: prev.data.map((i) => (i.id === incident.id ? incident : i)) };
      });
    };

    const onDeleted = ({ id }: { id: string }) => {
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, data: prev.data.filter((i) => i.id !== id), total: prev.total - 1 };
      });
    };

    socket.on('incident:created', onCreated);
    socket.on('incident:updated', onUpdated);
    socket.on('incident:deleted', onDeleted);

    return () => {
      socket.off('incident:created', onCreated);
      socket.off('incident:updated', onUpdated);
      socket.off('incident:deleted', onDeleted);
    };
  }, []);

  return { data, loading, error, refetch: fetch };
}
