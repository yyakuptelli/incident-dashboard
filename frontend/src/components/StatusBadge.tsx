import { Status } from '@/types/incident';

const config: Record<Status, { label: string; className: string; dot: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  investigating: { label: 'Investigating', className: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  resolved: { label: 'Resolved', className: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className, dot } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
