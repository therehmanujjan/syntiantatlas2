'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiMessageCircle,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { MetricCard } from '@/components/ui/metric-card';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { DividendPayment } from '@/types';

function formatPKR(value: string | number | null | undefined): string {
  if (value == null) return 'PKR 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'PKR 0';
  return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
          <div className="h-7 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { key: 'rentals', label: 'Rentals & Credits' },
  { key: 'rewards', label: 'Rewards & Commissions' },
];

const columns: Column<Record<string, unknown>>[] = [
  {
    key: 'property',
    header: 'Property',
    render: (row) => {
      const p = (row as unknown as DividendPayment);
      return (
        <div>
          <p className="font-medium text-gray-900">{p.property.title}</p>
          {p.property.city && (
            <p className="text-xs text-gray-400">{p.property.city}</p>
          )}
        </div>
      );
    },
  },
  {
    key: 'quarter',
    header: 'Period',
    render: (row) => {
      const p = (row as unknown as DividendPayment);
      return p.dividend.quarter && p.dividend.year
        ? `Q${p.dividend.quarter} ${p.dividend.year}`
        : '-';
    },
  },
  {
    key: 'amountPaid',
    header: 'Amount',
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-gray-900">{formatPKR((row as unknown as DividendPayment).amountPaid)}</span>
    ),
  },
  {
    key: 'sharesOwned',
    header: 'Shares',
    render: (row) => parseFloat((row as unknown as DividendPayment).sharesOwned).toLocaleString(),
  },
  {
    key: 'paidAt',
    header: 'Date',
    sortable: true,
    render: (row) => {
      const p = (row as unknown as DividendPayment);
      return p.paidAt
        ? new Date(p.paidAt).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '-';
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={(row as unknown as DividendPayment).status} />,
  },
];

export default function IncomePage() {
  const [activeTab, setActiveTab] = useState('rentals');

  const { data, isLoading } = useQuery({
    queryKey: ['my-dividends'],
    queryFn: () => api.getMyDividends(),
  });

  const payments = data?.payments ?? [];
  const summary = data?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Income Streams</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your rental income, dividends, and commission earnings.
        </p>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<FiDollarSign />}
            label="Total Income"
            value={formatPKR(summary?.totalEarned)}
          />
          <MetricCard
            icon={<FiTrendingUp />}
            label="Dividend Payments"
            value={summary?.paymentCount ?? 0}
          />
          <MetricCard
            icon={<FiCalendar />}
            label="Latest Payment"
            value={
              payments.length > 0 && payments[0].paidAt
                ? new Date(payments[0].paidAt).toLocaleDateString('en-PK', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'None yet'
            }
          />
        </div>
      )}

      {/* Tabs */}
      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'rentals' && (
        <div>
          {isLoading ? (
            <div className="card animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<FiDollarSign />}
              heading="No Income Yet"
              message="Once you receive dividend payments from your property investments, they will appear here."
              actionLabel="View Investments"
              actionHref="/active-investments"
            />
          ) : (
            <div className="card !p-0 overflow-hidden">
              <DataTable
                columns={columns}
                data={payments as unknown as Record<string, unknown>[]}
                keyField="id"
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="card text-center py-16">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-dao-blue/10 text-dao-blue text-3xl mx-auto mb-4">
            <FiTrendingUp />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Coming Soon</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Rewards and commissions feature is currently under development.
            Stay tuned for updates.
          </p>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm !px-4 !py-2 inline-flex items-center gap-2"
          >
            <FiMessageCircle /> Contact Support
          </a>
        </div>
      )}
    </div>
  );
}
