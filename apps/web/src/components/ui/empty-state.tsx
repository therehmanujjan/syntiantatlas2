'use client';

import clsx from 'clsx';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  heading,
  message,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 text-3xl mb-4">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-dao-dark mb-1">{heading}</h3>

      {message && <p className="text-sm text-gray-500 max-w-sm mb-6">{message}</p>}

      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary text-sm">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="btn-primary text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
