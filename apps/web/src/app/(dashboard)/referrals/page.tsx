'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiUsers,
  FiDollarSign,
  FiGift,
  FiClock,
  FiCopy,
  FiCheck,
  FiShare2,
  FiTrendingUp,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import { api } from '@/lib/api-client';
import type { Referral } from '@/types';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { QRCodeDisplay } from '@/components/ui/qr-code-display';

function formatPKR(value: string | null): string {
  if (!value) return 'PKR 0';
  const num = parseFloat(value);
  if (num >= 10_000_000) return `PKR ${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `PKR ${(num / 100_000).toFixed(2)} Lac`;
  return `PKR ${num.toLocaleString()}`;
}

const activityColumns: Column<Record<string, unknown>>[] = [
  {
    key: 'referred',
    header: 'Referred User',
    render: (row) => {
      const r = row as unknown as Referral;
      if (!r.referred) return <span className="text-gray-400">-</span>;
      return (
        <div>
          <p className="font-medium text-gray-900">
            {r.referred.firstName} {r.referred.lastName}
          </p>
          <p className="text-xs text-gray-400">{r.referred.email}</p>
        </div>
      );
    },
  },
  {
    key: 'createdAt',
    header: 'Sign-up Date',
    sortable: true,
    render: (row) => {
      const r = row as unknown as Referral;
      return (
        <span className="text-gray-600 text-sm">
          {new Date(r.createdAt).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const r = row as unknown as Referral;
      return <StatusBadge status={r.status} />;
    },
  },
  {
    key: 'investmentAmount',
    header: 'Investment',
    sortable: true,
    render: (row) => {
      const r = row as unknown as Referral;
      return (
        <span className="font-medium text-gray-900">
          {r.investmentAmount ? formatPKR(r.investmentAmount) : '-'}
        </span>
      );
    },
  },
  {
    key: 'commission',
    header: 'Earnings',
    sortable: true,
    render: (row) => {
      const r = row as unknown as Referral;
      return (
        <span className="font-semibold text-green-600">
          {r.commission ? formatPKR(r.commission) : '-'}
        </span>
      );
    },
  },
];

const REWARD_TIERS = [
  { level: 'Tier 1', range: '1 - 5 referrals', reward: '2% commission', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { level: 'Tier 2', range: '6 - 15 referrals', reward: '3% commission', color: 'bg-green-50 text-green-700 border-green-200' },
  { level: 'Tier 3', range: '16 - 50 referrals', reward: '4% commission', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { level: 'Tier 4', range: '50+ referrals', reward: '5% commission', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['referral-summary'],
    queryFn: () => api.getReferralSummary(),
  });

  const referralCode = summary?.referralCode ?? '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${baseUrl}/register?ref=${referralCode}` : '';
  const activity = summary?.activity ?? [];

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = 'Join Syntiant Atlas and start investing in real estate! Use my referral link:';
  const encodedText = encodeURIComponent(shareText);
  const encodedLink = encodeURIComponent(referralLink);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-100 rounded" /></div>
          ))}
        </div>
        <div className="card animate-pulse"><div className="h-40 bg-gray-100 rounded" /></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
        <p className="text-gray-500 text-sm mt-1">Invite friends and earn commission on their investments</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<FiUsers />}
          label="Total Referrals"
          value={(summary?.totalReferrals ?? 0).toString()}
        />
        <MetricCard
          icon={<FiCheck />}
          label="Active Referrals"
          value={(summary?.activeReferrals ?? 0).toString()}
        />
        <MetricCard
          icon={<FiDollarSign />}
          label="Total Earnings"
          value={formatPKR(summary?.totalEarnings ?? '0')}
        />
        <MetricCard
          icon={<FiClock />}
          label="Pending Rewards"
          value={formatPKR(summary?.pendingRewards ?? '0')}
        />
      </div>

      {/* Referral Link Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiShare2 className="text-dao-blue" />
          Your Referral Link
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {/* Referral URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-dao-blue text-white hover:bg-dao-blue-dark'
                }`}
              >
                {copied ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
              </button>
            </div>

            {/* Referral Code */}
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Referral Code</p>
                <p className="text-lg font-bold text-gray-900 tracking-wider">{referralCode || '-'}</p>
              </div>
            </div>

            {/* Share Buttons */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Share via</p>
              <div className="flex gap-3">
                <a
                  href={`https://wa.me/?text=${encodedText}%20${encodedLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition"
                >
                  <FaWhatsapp />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
                >
                  <FaFacebookF />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition"
                >
                  <FaXTwitter />
                </a>
                <a
                  href={`mailto:?subject=Join%20Syntiant%20Atlas&body=${encodedText}%20${encodedLink}`}
                  className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center hover:bg-gray-600 transition text-sm"
                >
                  @
                </a>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {referralLink && (
            <div className="shrink-0">
              <QRCodeDisplay value={referralLink} size={160} />
            </div>
          )}
        </div>
      </div>

      {/* Reward Tiers */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiGift className="text-dao-blue" />
          Reward Tiers
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REWARD_TIERS.map((tier) => (
            <div key={tier.level} className={`border rounded-lg p-4 ${tier.color}`}>
              <p className="font-semibold text-sm">{tier.level}</p>
              <p className="text-xs mt-1 opacity-80">{tier.range}</p>
              <p className="text-lg font-bold mt-2">{tier.reward}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Commission is calculated on the investment amount made by your referred users. Earnings are credited to your wallet.
        </p>
      </div>

      {/* Referral Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-dao-blue" />
          Referral Activity
        </h2>
        {activity.length === 0 ? (
          <EmptyState
            icon={<FiUsers />}
            heading="No Referrals Yet"
            message="Share your referral link and start earning commission when your friends invest."
          />
        ) : (
          <div className="overflow-hidden -mx-5 -mb-5">
            <DataTable
              columns={activityColumns}
              data={activity as unknown as Record<string, unknown>[]}
              keyField="id"
            />
          </div>
        )}
      </div>
    </div>
  );
}
