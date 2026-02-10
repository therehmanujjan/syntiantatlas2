'use client';

import clsx from 'clsx';

type StatusVariant =
  | 'active'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'approved'
  | 'funded'
  | 'suspended'
  | 'draft'
  | 'cancelled';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  active: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  funded: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  suspended: 'bg-orange-100 text-orange-700',
};

export function StatusBadge({ status, label, size = 'sm', className }: StatusBadgeProps) {
  const normalised = status.toLowerCase().replace(/[\s_-]+/g, '_') as StatusVariant;
  const style = variantStyles[normalised] ?? 'bg-gray-100 text-gray-600';
  const displayLabel = label ?? status.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full capitalize whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        style,
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
