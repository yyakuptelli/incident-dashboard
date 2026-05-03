'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Severity } from '@/types/incident';

interface Props {
  onCreated?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function CreateIncidentModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    service: '',
    severity: 'medium' as Severity,
  });

  const handleAiSuggest = async () => {
    if (!form.title.trim()) {
      setAiError('Enter a title first so AI can analyze it.');
      return;
    }
    try {
      setAiLoading(true);
      setAiError('');
      const res = await fetch(`${API_URL}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? 'AI request failed');
      }
      const result = await res.json() as { severity: Severity; service: string; summary: string };
      setForm((prev) => ({
        ...prev,
        severity: result.severity ?? prev.severity,
        service: result.service && !prev.service ? result.service : prev.service,
        description: prev.description || result.summary || prev.description,
      }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.service.trim()) {
      setError('Title and service are required.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.create(form);
      setOpen(false);
      setForm({ title: '', description: '', service: '', severity: 'medium' });
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
        + New Incident
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title *</Label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading || !form.title.trim()}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {aiLoading ? (
                  <>
                    <span className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>✨ AI Suggest</>
                )}
              </button>
            </div>
            <Input
              id="title"
              placeholder="e.g. Database timeout on payment service"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {aiError && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {aiError}
            </p>
          )}

          <div className="space-y-1">
            <Label htmlFor="service">Service *</Label>
            <Input
              id="service"
              placeholder="e.g. Payment API"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="severity">Severity</Label>
            <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as Severity })}>
              <SelectTrigger id="severity">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the incident..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
