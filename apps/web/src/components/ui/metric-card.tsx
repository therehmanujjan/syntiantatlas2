'use client';

import clsx from 'clsx';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  trend?: { value: number; label?: string };
  className?: string;
}

export function MetricCard({ icon, label, value, subText, trend, className }: MetricCardProps) {
  return (
    <div className={clsx('card flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {icon && (
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-dao-blue/10 text-dao-blue text-lg">
            {icon}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-dao-dark">{value}</p>

      <div className="flex items-center gap-2 min-h-[20px]">
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center gap-1 text-xs font-medium',
              trend.value >= 0 ? 'text-green-600' : 'text-red-600',
            )}
          >
            {trend.value >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            {Math.abs(trend.value)}%
          </span>
        )}
        {(subText || trend?.label) && (
          <span className="text-xs text-gray-400">{trend?.label ?? subText}</span>
        )}
        {!trend && subText && <span className="text-xs text-gray-400">{subText}</span>}
      </div>
    </div>
  );
}
