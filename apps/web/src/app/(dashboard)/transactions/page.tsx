'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Transaction, TransactionSummary } from '@/types';
import { format } from 'date-fns';
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiTrendingUp,
  FiDollarSign,
  FiInbox,
  FiX,
} from 'react-icons/fi';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FilterPanel } from '@/components/ui/filter-panel';
import { StatusBadge } from '@/components/ui/status-badge';
import { CopyButton } from '@/components/ui/copy-button';
import { ExportButton } from '@/components/ui/export-button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  deposit: 'bg-green-100 text-green-700',
  withdrawal: 'bg-red-100 text-red-700',
  investment: 'bg-blue-100 text-blue-700',
  dividend: 'bg-purple-100 text-purple-700',
};

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_BADGE_STYLES[type] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${style}`}>
      {type}
    </span>
  );
}

const FILTER_FIELDS = [
  {
    key: 'type',
    label: 'Type',
    type: 'select' as const,
    options: [
      { label: 'Deposit', value: 'deposit' },
      { label: 'Withdrawal', value: 'withdrawal' },
      { label: 'Investment', value: 'investment' },
      { label: 'Dividend', value: 'dividend' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Completed', value: 'completed' },
      { label: 'Pending', value: 'pending' },
      { label: 'Failed', value: 'failed' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    type: 'date-range' as const,
  },
];

/* ─── Skeleton Loaders ─── */
function SummarySkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
          <div className="h-7 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

/* ─── Detail Modal ─── */
function TransactionDetailModal({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Type</span>
            <TypeBadge type={tx.type} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold text-gray-900">PKR {formatCurrency(tx.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <StatusBadge status={tx.status ?? 'unknown'} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-700">
              {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-gray-700">{tx.paymentMethod ?? '-'}</span>
          </div>
          {tx.referenceNumber && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Reference</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-mono text-xs">{tx.referenceNumber}</span>
                <CopyButton value={tx.referenceNumber} />
              </div>
            </div>
          )}
          {tx.description && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Description</span>
              <span className="text-gray-700 text-right max-w-[200px]">{tx.description}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Transactions Page ─── */
export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    type: '',
    status: '',
    dateRange: { from: '', to: '' },
  });
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const limit = 10;

  // Build query params from filter values
  const params: Record<string, string | number> = { page, limit };
  if (filterValues.type) params.type = filterValues.type;
  if (filterValues.status) params.status = filterValues.status;
  if (filterValues.dateRange?.from) params.startDate = filterValues.dateRange.from;
  if (filterValues.dateRange?.to) params.endDate = filterValues.dateRange.to;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.getTransactions(params),
  });

  const transactions: Transaction[] = data?.data ?? [];
  const summary: TransactionSummary | undefined = data?.summary;
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0, limit: 10 };
  const totalPages = typeof pagination.totalPages === 'string'
    ? parseInt(pagination.totalPages)
    : pagination.totalPages;

  const handleExport = async (format: string) => {
    try {
      const blob = await api.exportTransactions({
        format,
        ...(filterValues.type && { type: filterValues.type }),
        ...(filterValues.status && { status: filterValues.status }),
        ...(filterValues.dateRange?.from && { startDate: filterValues.dateRange.from }),
        ...(filterValues.dateRange?.to && { endDate: filterValues.dateRange.to }),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export endpoint not available yet — silent fail
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (row) => {
        const tx = row as unknown as Transaction;
        return (
          <div>
            <span className="text-sm text-gray-700">
              {format(new Date(tx.createdAt), 'MMM d, yyyy')}
            </span>
            <span className="block text-xs text-gray-400">
              {format(new Date(tx.createdAt), 'h:mm a')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <TypeBadge type={(row as unknown as Transaction).type} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900">
          PKR {formatCurrency((row as unknown as Transaction).amount)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (row) => (
        <span className="text-gray-600">{(row as unknown as Transaction).paymentMethod ?? '-'}</span>
      ),
    },
    {
      key: 'referenceNumber',
      header: 'Reference',
      render: (row) => {
        const ref = (row as unknown as Transaction).referenceNumber;
        if (!ref) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-gray-500">{ref}</span>
            <CopyButton value={ref} />
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={(row as unknown as Transaction).status ?? 'unknown'} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and filter all your financial transactions.
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* Summary Cards */}
      {isLoading || !summary ? (
        <SummarySkeletons />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<FiArrowDownCircle />}
            label="Total Deposits"
            value={`PKR ${formatCurrency(summary.totalDeposits)}`}
          />
          <MetricCard
            icon={<FiArrowUpCircle />}
            label="Total Withdrawals"
            value={`PKR ${formatCurrency(summary.totalWithdrawals)}`}
          />
          <MetricCard
            icon={<FiTrendingUp />}
            label="Total Investments"
            value={`PKR ${formatCurrency(summary.totalInvestments)}`}
          />
          <MetricCard
            icon={<FiDollarSign />}
            label="Total Dividends"
            value={`PKR ${formatCurrency(summary.totalDividends)}`}
          />
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        filters={FILTER_FIELDS}
        values={filterValues}
        onChange={(v) => {
          setFilterValues(v);
          setPage(1);
        }}
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<FiInbox />}
          heading="No transactions found"
          message="Try adjusting your filters or make your first transaction."
        />
      ) : (
        <>
          <div className="card !p-0 overflow-hidden">
            <DataTable
              columns={columns}
              data={transactions as unknown as Record<string, unknown>[]}
              keyField="id"
              onRowClick={(row) => setSelectedTx(row as unknown as Transaction)}
            />
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={pagination.total}
            pageSize={limit}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Detail Modal */}
      {selectedTx && (
        <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
}
