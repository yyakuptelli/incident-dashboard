'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Incident } from '@/types/incident';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { UpdateStatusModal } from './UpdateStatusModal';
import { api } from '@/lib/api';

interface Props {
  incidents: Incident[];
  onOptimisticDelete: (id: string) => void;
  onOptimisticUpdate: (incident: Incident) => void;
  onRefresh: () => void;
  newIds?: Set<string>;
  updatedIds?: Set<string>;
}

export function IncidentTable({
  incidents,
  onOptimisticDelete,
  onOptimisticUpdate,
  onRefresh,
  newIds = new Set(),
  updatedIds = new Set(),
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this incident?')) return;
    onOptimisticDelete(id);
    setDeletingId(id);
    try {
      await api.delete(id);
    } catch {
      alert('Failed to delete. Refreshing...');
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <th className="px-5 py-3.5 text-left">Title</th>
            <th className="px-5 py-3.5 text-left">Service</th>
            <th className="px-5 py-3.5 text-left">Severity</th>
            <th className="px-5 py-3.5 text-left">Status</th>
            <th className="px-5 py-3.5 text-left">Created</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              className={`group border-b border-gray-50 hover:bg-gray-50/60 transition-colors duration-100 ${
                newIds.has(incident.id) || updatedIds.has(incident.id) ? 'animate-highlight' : ''
              }`}
            >
              <td className="px-5 py-3.5 font-medium text-gray-900 max-w-xs">
                <Link href={`/incidents/${incident.id}`} className="hover:text-indigo-600 transition-colors">
                  <div className="truncate">{incident.title}</div>
                </Link>
                {incident.description && (
                  <div className="text-xs text-gray-400 truncate mt-0.5 font-normal">{incident.description}</div>
                )}
              </td>
              <td className="px-5 py-3.5 text-gray-500">{incident.service}</td>
              <td className="px-5 py-3.5">
                <SeverityBadge severity={incident.severity} />
              </td>
              <td className="px-5 py-3.5">
                <span className="transition-all duration-300">
                  <StatusBadge status={incident.status} />
                </span>
              </td>
              <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                {new Date(incident.createdAt).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <UpdateStatusModal
                    incident={incident}
                    onOptimisticUpdate={onOptimisticUpdate}
                    onRefresh={onRefresh}
                  />
                  <button
                    onClick={() => handleDelete(incident.id)}
                    disabled={deletingId === incident.id}
                    title="Delete incident"
                    className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {deletingId === incident.id
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Trash2 size={15} />
                    }
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
