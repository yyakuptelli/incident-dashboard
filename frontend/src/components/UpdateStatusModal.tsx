'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Incident, Severity, Status } from '@/types/incident';

interface Props {
  incident: Incident;
  onOptimisticUpdate: (incident: Incident) => void;
  onRefresh: () => void;
}

export function UpdateStatusModal({ incident, onOptimisticUpdate, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(incident.status);
  const [severity, setSeverity] = useState<Severity>(incident.severity);
  const [description, setDescription] = useState(incident.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = (val: boolean) => {
    if (val) {
      setStatus(incident.status);
      setSeverity(incident.severity);
      setDescription(incident.description ?? '');
      setError('');
    }
    setOpen(val);
  };

  const handleSave = async () => {
    const patch: Partial<Pick<Incident, 'status' | 'severity' | 'description'>> = {};
    if (status !== incident.status)           patch.status = status;
    if (severity !== incident.severity)       patch.severity = severity;
    if (description !== (incident.description ?? '')) patch.description = description;

    if (Object.keys(patch).length === 0) { setOpen(false); return; }

    const optimistic: Incident = { ...incident, ...patch };
    onOptimisticUpdate(optimistic);
    setOpen(false);
    setLoading(true);
    setError('');
    try {
      const real = await api.update(incident.id, patch);
      onOptimisticUpdate(real);
    } catch (e) {
      onOptimisticUpdate(incident);
      onRefresh();
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        title="Edit incident"
        className="p-1.5 rounded-md text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
      >
        <Pencil size={15} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Incident</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-gray-500 truncate">{incident.title}</p>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the incident..."
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
