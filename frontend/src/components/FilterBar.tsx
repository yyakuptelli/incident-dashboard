'use client';

import { useEffect, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { IncidentFilters, Severity, Status } from '@/types/incident';

interface Props {
  filters: IncidentFilters;
  onChange: (f: IncidentFilters) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  const [serviceInput, setServiceInput] = useState(filters.service ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, service: serviceInput, page: 1 });
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceInput]);

  // sync local input when filters.service is cleared externally (e.g. reset all filters)
  useEffect(() => {
    if (!filters.service) setServiceInput('');
  }, [filters.service]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.status ?? ''}
        onValueChange={(v) => onChange({ ...filters, status: v as Status | '', page: 1 })}
      >
        <SelectTrigger className="w-40 bg-white">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="investigating">Investigating</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.severity ?? ''}
        onValueChange={(v) => onChange({ ...filters, severity: v as Severity | '', page: 1 })}
      >
        <SelectTrigger className="w-40 bg-white">
          <SelectValue placeholder="All severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All severities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Input
        className="w-44 bg-white"
        placeholder="Filter by service..."
        value={serviceInput}
        onChange={(e) => setServiceInput(e.target.value)}
      />
    </div>
  );
}
