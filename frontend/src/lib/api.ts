import { Incident, IncidentFilters, PaginatedIncidents } from '@/types/incident';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  list(filters: IncidentFilters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.status) params.set('status', filters.status);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.service) params.set('service', filters.service);
    return request<PaginatedIncidents>(`/incidents?${params}`);
  },

  get(id: string) {
    return request<Incident>(`/incidents/${id}`);
  },

  create(body: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    return request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(body) });
  },

  update(id: string, body: Partial<Pick<Incident, 'status' | 'severity' | 'description'>>) {
    return request<Incident>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  },

  delete(id: string) {
    return request<void>(`/incidents/${id}`, { method: 'DELETE' });
  },
};
