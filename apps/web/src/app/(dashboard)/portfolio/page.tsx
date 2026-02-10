'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FiDollarSign,
  FiGrid,
  FiTrendingUp,
  FiExternalLink,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { MetricCard } from '@/components/ui/metric-card';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import type { Investment, Property } from '@/types';

function formatPKR(value: string | null | undefined): string {
  if (!value) return 'PKR 0';
  const num = parseFloat(value);
  if (isNaN(num)) return 'PKR 0';
  if (num >= 10_000_000) return `PKR ${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `PKR ${(num / 100_000).toFixed(2)} Lac`;
  return `PKR ${num.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
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
    <div className="card animate-pulse space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

const TABS = [
  { key: 'ownership', label: 'Area Ownership' },
  { key: 'accumulated', label: 'Accumulated Property' },
];

type InvestmentWithProperty = Investment & { property: Property };

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('ownership');

  const { data: portfolio, isLoading, isError } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const investments = (portfolio?.investments ?? []) as InvestmentWithProperty[];
  const summary = portfolio?.summary;

  // Compute total area owned (sum of areaSqft * ownershipPercentage)
  const totalAreaOwned = investments.reduce((total, inv) => {
    const areaSqft = parseFloat(inv.property?.areaSqft ?? '0');
    const ownership = parseFloat(inv.ownershipPercentage ?? '0') / 100;
    return total + areaSqft * ownership;
  }, 0);

  const ownershipColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'property',
      header: 'Property',
      render: (row) => {
        const inv = row as unknown as InvestmentWithProperty;
        return (
          <div>
            <p className="font-medium text-gray-900">
              {inv.property?.title || `Property #${inv.propertyId}`}
            </p>
            {inv.property?.city && (
              <p className="text-xs text-gray-400 mt-0.5">{inv.property.city}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'amountInvested',
      header: 'Amount Invested',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-800">
          {formatPKR((row as unknown as InvestmentWithProperty).amountInvested)}
        </span>
      ),
    },
    {
      key: 'sharesOwned',
      header: 'Shares',
      sortable: true,
      render: (row) => {
        const shares = (row as unknown as InvestmentWithProperty).sharesOwned;
        return shares ? parseFloat(shares).toLocaleString() : '-';
      },
    },
    {
      key: 'ownershipPercentage',
      header: 'Ownership %',
      sortable: true,
      render: (row) => {
        const pct = (row as unknown as InvestmentWithProperty).ownershipPercentage;
        return pct ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dao-blue/10 text-dao-blue">
            {parseFloat(pct).toFixed(2)}%
          </span>
        ) : (
          '-'
        );
      },
    },
    {
      key: 'areaSqft',
      header: 'Area Owned (sq ft)',
      render: (row) => {
        const inv = row as unknown as InvestmentWithProperty;
        const areaSqft = parseFloat(inv.property?.areaSqft ?? '0');
        const ownership = parseFloat(inv.ownershipPercentage ?? '0') / 100;
        const area = areaSqft * ownership;
        return area > 0 ? area.toFixed(2) : '-';
      },
    },
    {
      key: 'investmentDate',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-gray-500">
          {formatDate((row as unknown as InvestmentWithProperty).investmentDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const inv = row as unknown as InvestmentWithProperty;
        return inv.propertyId ? (
          <Link
            href={`/properties/${inv.propertyId}`}
            className="text-dao-blue hover:text-dao-blue-dark text-xs font-medium hover:underline inline-flex items-center gap-1"
          >
            View <FiExternalLink className="text-[10px]" />
          </Link>
        ) : null;
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage your real estate investments.
        </p>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            icon={<FiDollarSign />}
            label="Net Amount Invested (PKR)"
            value={formatPKR(summary?.totalInvested)}
            subText={`${summary?.propertyCount ?? 0} properties`}
          />
          <MetricCard
            icon={<FiGrid />}
            label="Total Area Owned (sq ft)"
            value={totalAreaOwned > 0 ? totalAreaOwned.toFixed(2) : '0'}
            subText={`${summary?.totalShares ? parseFloat(summary.totalShares).toLocaleString() : '0'} shares`}
          />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-16">
          <p className="text-red-500 text-lg font-medium">Failed to load portfolio.</p>
          <p className="text-gray-500 mt-1 text-sm">Please try again later.</p>
        </div>
      )}

      {/* Tabs */}
      {!isError && (
        <TabNavigation
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      )}

      {/* Tab Content: Area Ownership */}
      {!isError && activeTab === 'ownership' && (
        <>
          {isLoading ? (
            <TableSkeleton />
          ) : investments.length === 0 ? (
            <EmptyState
              icon={<FiTrendingUp />}
              heading="No investments yet"
              message="Start building your real estate portfolio today."
              actionLabel="Browse Properties"
              actionHref="/properties"
            />
          ) : (
            <div className="card !p-0 overflow-hidden">
              <DataTable
                columns={ownershipColumns}
                data={investments as unknown as Record<string, unknown>[]}
                keyField="id"
              />
            </div>
          )}
        </>
      )}

      {/* Tab Content: Accumulated Property */}
      {!isError && activeTab === 'accumulated' && (
        <>
          {isLoading ? (
            <TableSkeleton />
          ) : investments.length === 0 ? (
            <EmptyState
              icon={<FiGrid />}
              heading="No accumulated property"
              message="Your demarcated investments and accumulated units will appear here once available."
              actionLabel="Browse Properties"
              actionHref="/properties"
            />
          ) : (
            <div className="space-y-4">
              {investments.map((inv) => {
                const areaSqft = parseFloat(inv.property?.areaSqft ?? '0');
                const ownership = parseFloat(inv.ownershipPercentage ?? '0') / 100;
                const ownedArea = areaSqft * ownership;

                return (
                  <div key={inv.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {inv.property?.title ?? `Property #${inv.propertyId}`}
                        </h3>
                        {inv.property?.city && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {inv.property.city} &bull; {inv.property.propertyType ?? 'Property'}
                          </p>
                        )}
                      </div>
                      {inv.propertyId && (
                        <Link
                          href={`/properties/${inv.propertyId}`}
                          className="text-dao-blue text-xs font-medium hover:underline"
                        >
                          Details
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Invested</p>
                        <p className="font-semibold text-gray-800">{formatPKR(inv.amountInvested)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ownership</p>
                        <p className="font-semibold text-gray-800">
                          {inv.ownershipPercentage ? `${parseFloat(inv.ownershipPercentage).toFixed(2)}%` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Area (sq ft)</p>
                        <p className="font-semibold text-gray-800">{ownedArea > 0 ? ownedArea.toFixed(2) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total Area</p>
                        <p className="font-medium text-gray-600">
                          {areaSqft > 0 ? `${areaSqft.toLocaleString()} sq ft` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
