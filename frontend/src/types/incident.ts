export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'open' | 'investigating' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  service: string;
  severity: Severity;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedIncidents {
  data: Incident[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IncidentFilters {
  status?: Status | '';
  severity?: Severity | '';
  service?: string;
  page?: number;
  limit?: number;
}
