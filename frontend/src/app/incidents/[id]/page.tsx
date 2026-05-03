'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Incident } from '@/types/incident';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';

interface AuditEntry {
  id: string;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  createdAt: string;
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get(id), fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/incidents/${id}/audit`).then((r) => r.json())])
      .then(([inc, log]) => {
        setIncident(inc);
        setAudit(log);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !incident) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-500">
      <p className="text-4xl">⚠</p>
      <p>{error || 'Incident not found'}</p>
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to dashboard</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">← Dashboard</Link>
          <span className="text-gray-200">/</span>
          <span className="text-sm text-gray-600 truncate">{incident.title}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">{incident.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Service</p>
              <p className="text-gray-700 font-medium">{incident.service}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created</p>
              <p className="text-gray-700">{new Date(incident.createdAt).toLocaleString('en-US')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Last Updated</p>
              <p className="text-gray-700">{new Date(incident.updatedAt).toLocaleString('en-US')}</p>
            </div>
          </div>

          {incident.description && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Description</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
            </div>
          )}
        </div>

        {audit.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Audit Log</h2>
            <ol className="relative border-l border-gray-100 space-y-4 ml-2">
              {audit.map((entry) => (
                <li key={entry.id} className="ml-4">
                  <span className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                    entry.action === 'created' ? 'bg-emerald-400' :
                    entry.action === 'deleted' ? 'bg-red-400' : 'bg-indigo-400'
                  }`} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold capitalize text-gray-700">{entry.action}</span>
                    <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString('en-US')}</span>
                  </div>
                  {entry.changes && (
                    <ul className="mt-1 space-y-0.5">
                      {Object.entries(entry.changes).map(([field, { from, to }]) => (
                        <li key={field} className="text-xs text-gray-500">
                          <span className="font-medium">{field}:</span> <span className="line-through text-red-400">{String(from)}</span> → <span className="text-emerald-600">{String(to)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
