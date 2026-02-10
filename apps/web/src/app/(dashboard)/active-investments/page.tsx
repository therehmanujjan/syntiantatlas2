'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FiTrendingUp,
  FiDollarSign,
  FiGrid,
  FiCalendar,
  FiExternalLink,
  FiHelpCircle,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
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

function InvestmentCard({ investment }: { investment: Investment & { property: Property } }) {
  const property = investment.property;
  const fundingTarget = parseFloat(property?.fundingTarget ?? '0') || 1;
  const fundingRaised = parseFloat(property?.fundingRaised ?? '0');
  const progressPct = Math.min(100, (fundingRaised / fundingTarget) * 100);

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {property?.title ?? `Property #${investment.propertyId}`}
          </h3>
          {property?.city && (
            <p className="text-xs text-gray-500 mt-0.5">{property.city}</p>
          )}
        </div>
        <StatusBadge status={property?.status ?? 'active'} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">Invested</p>
          <p className="text-sm font-bold text-gray-900">{formatPKR(investment.amountInvested)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Ownership</p>
          <p className="text-sm font-bold text-gray-900">
            {investment.ownershipPercentage
              ? `${parseFloat(investment.ownershipPercentage).toFixed(2)}%`
              : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Shares</p>
          <p className="text-sm font-medium text-gray-700">
            {investment.sharesOwned ? parseFloat(investment.sharesOwned).toLocaleString() : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Date</p>
          <p className="text-sm font-medium text-gray-700">{formatDate(investment.investmentDate)}</p>
        </div>
      </div>

      {/* Funding Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Funding Progress</span>
          <span>{progressPct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-dao-blue rounded-full h-2 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Expected Returns */}
      {property?.expectedReturnsAnnual && (
        <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
          <FiTrendingUp />
          <span>{parseFloat(property.expectedReturnsAnnual).toFixed(1)}% expected annual return</span>
        </div>
      )}

      <Link
        href={`/properties/${investment.propertyId}`}
        className="inline-flex items-center gap-1 text-sm text-dao-blue hover:text-dao-blue-dark font-medium"
      >
        View Property <FiExternalLink className="text-xs" />
      </Link>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 bg-gray-100 rounded w-16 mb-1" />
            <div className="h-4 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
      <div className="h-2 bg-gray-100 rounded-full w-full mb-4" />
      <div className="h-4 bg-gray-100 rounded w-28" />
    </div>
  );
}

export default function ActiveInvestmentsPage() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const investments = portfolio?.investments ?? [];
  const summary = portfolio?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Investments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your active property investments and their performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm !px-4 !py-2 inline-flex items-center gap-2"
          >
            <FiHelpCircle /> Help
          </a>
          <Link href="/properties" className="btn-primary text-sm !px-4 !py-2">
            Explore Properties
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<FiDollarSign />}
            label="Total Invested"
            value={formatPKR(summary?.totalInvested)}
          />
          <MetricCard
            icon={<FiGrid />}
            label="Properties"
            value={summary?.propertyCount ?? 0}
          />
          <MetricCard
            icon={<FiCalendar />}
            label="Total Shares"
            value={summary?.totalShares ? parseFloat(summary.totalShares).toLocaleString() : '0'}
          />
        </div>
      )}

      {/* Investments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : investments.length === 0 ? (
        <EmptyState
          icon={<FiTrendingUp />}
          heading="No Active Investments"
          message="Start building your real estate portfolio by purchasing your first property investment."
          actionLabel="Browse Properties"
          actionHref="/properties"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investments.map((inv) => (
            <InvestmentCard key={inv.id} investment={inv as Investment & { property: Property }} />
          ))}
        </div>
      )}
    </div>
  );
}
