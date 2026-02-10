'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiUser,
  FiShoppingBag,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { MarketplaceListing } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';

function formatPKR(value: string | null): string {
  if (!value) return 'PKR 0';
  const num = parseFloat(value);
  if (num >= 10_000_000) return `PKR ${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `PKR ${(num / 100_000).toFixed(2)} Lac`;
  return `PKR ${num.toLocaleString()}`;
}

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-6" />
      <div className="h-40 bg-gray-200 rounded-xl mb-6" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listingId = parseInt(id, 10);

  const [shares, setShares] = useState('');
  const [buySuccess, setBuySuccess] = useState(false);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [error, setError] = useState('');

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['marketplace-listing', listingId],
    queryFn: () => api.getMarketplaceListing(listingId),
    enabled: !isNaN(listingId),
  });

  const buyMutation = useMutation({
    mutationFn: (data: { listingId: number; shares: number }) => api.buyMarketplaceShares(data),
    onSuccess: () => {
      setBuySuccess(true);
      queryClient.invalidateQueries({ queryKey: ['marketplace-listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Purchase failed.');
    },
  });

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shares) return;
    setError('');
    buyMutation.mutate({ listingId, shares: parseFloat(shares) });
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-red-500 text-lg font-medium">Listing not found.</p>
        <button onClick={() => router.push('/marketplace')} className="text-dao-blue hover:underline text-sm mt-2">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const maxShares = parseFloat(listing.sharesRemaining);
  const totalValue = maxShares * parseFloat(listing.pricePerShare);
  const shareCost = shares ? parseFloat(shares) * parseFloat(listing.pricePerShare) : 0;
  const sharesProgress =
    ((parseFloat(listing.sharesListed) - parseFloat(listing.sharesRemaining)) /
      parseFloat(listing.sharesListed)) *
    100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/marketplace')}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-dao-blue transition"
      >
        <FiArrowLeft />
        Back to Marketplace
      </button>

      {/* Header */}
      <div className="relative h-48 bg-gradient-to-r from-dao-blue to-dao-blue-dark rounded-xl flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 p-6 sm:p-8 w-full">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2">
                <StatusBadge status={listing.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{listing.property.title}</h1>
              {listing.property.city && (
                <p className="text-blue-100 text-sm flex items-center gap-1 mt-1">
                  <FiMapPin /> {listing.property.city}
                </p>
              )}
            </div>
            <div className="text-right text-white">
              <p className="text-sm text-blue-100">Listing #{listing.id}</p>
              {listing.property.propertyType && (
                <span className="inline-block bg-white/20 text-white text-xs px-2 py-0.5 rounded mt-1">
                  {listing.property.propertyType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Listing Details */}
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Listing Details</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Seller</span>
              <span className="font-medium flex items-center gap-1">
                <FiUser className="text-dao-blue" />
                {listing.seller.firstName} {listing.seller.lastName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Listed</span>
              <span className="font-medium flex items-center gap-1">
                <FiClock className="text-gray-400" />
                {new Date(listing.createdAt).toLocaleDateString('en-PK', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            {listing.expiresAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expires</span>
                <span className="font-medium text-orange-600">
                  {new Date(listing.expiresAt).toLocaleDateString('en-PK')}
                </span>
              </div>
            )}
            <hr className="border-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Shares Listed</span>
              <span className="font-medium">{parseFloat(listing.sharesListed).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shares Remaining</span>
              <span className="font-semibold text-dao-blue">{maxShares.toLocaleString()}</span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Sold progress</span>
                <span>{sharesProgress.toFixed(1)}%</span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-dao-lime h-2 rounded-full transition-all"
                  style={{ width: `${sharesProgress}%` }}
                />
              </div>
            </div>
            <hr className="border-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price per Share</span>
              <span className="font-semibold text-gray-900">{formatPKR(listing.pricePerShare)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Listing Value</span>
              <span className="font-semibold text-dao-blue">{formatPKR(totalValue.toString())}</span>
            </div>
            {listing.property.expectedReturnsAnnual && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expected ROI</span>
                <span className="font-semibold text-green-600 flex items-center gap-1">
                  <FiTrendingUp />
                  {parseFloat(listing.property.expectedReturnsAnnual).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buy Section */}
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Purchase Shares</h2>

          {listing.status !== 'active' ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">This listing is no longer active.</p>
            </div>
          ) : buySuccess ? (
            <div className="text-center py-6">
              <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
              <p className="text-gray-600 text-sm mb-4">
                You&apos;ve acquired {shares} shares of <strong>{listing.property.title}</strong>.
              </p>
              <button onClick={() => router.push('/marketplace')} className="btn-blue w-full">
                Back to Marketplace
              </button>
            </div>
          ) : !showBuyForm ? (
            <div className="space-y-4">
              <div className="bg-dao-blue/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available shares</span>
                  <span className="font-bold">{maxShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per share</span>
                  <span className="font-bold">{formatPKR(listing.pricePerShare)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowBuyForm(true)}
                className="btn-blue w-full flex items-center justify-center gap-2"
              >
                <FiShoppingBag />
                Buy Shares
              </button>
            </div>
          ) : (
            <form onSubmit={handleBuy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shares to Buy</label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  max={maxShares}
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder={`Max: ${maxShares.toLocaleString()}`}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                />
              </div>

              {shareCost > 0 && (
                <div className="bg-dao-blue/5 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatPKR(shareCost.toString())}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Platform fee (2.5%)</span>
                    <span>{formatPKR((shareCost * 0.025).toString())}</span>
                  </div>
                  <hr className="border-gray-200 !my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Total</span>
                    <span className="font-bold text-dao-blue">{formatPKR((shareCost * 1.025).toString())}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                  <FiAlertCircle className="shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBuyForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={buyMutation.isPending || !shares}
                  className="btn-blue flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {buyMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Trade History */}
      {listing.trades && listing.trades.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trade History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Shares</th>
                  <th className="pb-3 pr-4">Price/Share</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listing.trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="py-3 pr-4 text-gray-600">
                      {new Date(trade.executedAt).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 pr-4 font-medium">{parseFloat(trade.sharesBought).toLocaleString()}</td>
                    <td className="py-3 pr-4">{formatPKR(trade.pricePerShare)}</td>
                    <td className="py-3 pr-4 font-semibold text-dao-blue">{formatPKR(trade.totalPrice)}</td>
                    <td className="py-3">
                      <StatusBadge status={trade.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
