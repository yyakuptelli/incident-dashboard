import { Severity } from '@/types/incident';

const config: Record<Severity, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className } = config[severity];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  );
}
