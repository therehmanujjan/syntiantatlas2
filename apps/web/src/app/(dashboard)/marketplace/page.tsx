'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiShoppingBag,
  FiPlus,
  FiMapPin,
  FiTrendingUp,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { MarketplaceListing, Investment } from '@/types';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmModal } from '@/components/ui/confirm-modal';

function formatPKR(value: string | null): string {
  if (!value) return 'PKR 0';
  const num = parseFloat(value);
  if (num >= 10_000_000) return `PKR ${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `PKR ${(num / 100_000).toFixed(2)} Lac`;
  return `PKR ${num.toLocaleString()}`;
}

const PROPERTY_TYPES = ['All', 'Residential', 'Commercial', 'Agricultural', 'Mixed-Use'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function ListingCard({
  listing,
  onBuy,
}: {
  listing: MarketplaceListing;
  onBuy: (listing: MarketplaceListing) => void;
}) {
  const totalValue = parseFloat(listing.sharesRemaining) * parseFloat(listing.pricePerShare);
  const expectedReturn = listing.property.expectedReturnsAnnual
    ? parseFloat(listing.property.expectedReturnsAnnual).toFixed(1)
    : null;

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Header gradient */}
      <div className="h-32 -mx-5 -mt-5 mb-4 bg-gradient-to-br from-dao-blue to-dao-blue-dark rounded-t-xl flex items-end p-4">
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight truncate">
            {listing.property.title}
          </h3>
          {listing.property.city && (
            <p className="text-blue-100 text-xs flex items-center gap-1 mt-1">
              <FiMapPin className="shrink-0" /> {listing.property.city}
            </p>
          )}
        </div>
      </div>

      {/* Status and type */}
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={listing.status} />
        {listing.property.propertyType && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {listing.property.propertyType}
          </span>
        )}
      </div>

      {/* Seller info */}
      <p className="text-xs text-gray-400 mb-3">
        Listed by{' '}
        <span className="font-medium text-gray-600">
          {listing.seller.firstName} {listing.seller.lastName}
        </span>
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Shares Available</p>
          <p className="text-sm font-semibold text-gray-900">
            {parseFloat(listing.sharesRemaining).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Price/Share</p>
          <p className="text-sm font-semibold text-gray-900">{formatPKR(listing.pricePerShare)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Value</p>
          <p className="text-sm font-semibold text-dao-blue">{formatPKR(totalValue.toString())}</p>
        </div>
        {expectedReturn && (
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Expected ROI</p>
            <p className="text-sm font-semibold text-green-600">{expectedReturn}%</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onBuy(listing)}
          disabled={listing.status !== 'active'}
          className="btn-blue flex-1 text-sm py-2 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiShoppingBag className="text-xs" />
          Buy Area
        </button>
        <Link
          href={`/marketplace/${listing.id}`}
          className="btn-secondary text-sm py-2 px-3"
        >
          Details
        </Link>
      </div>
    </div>
  );
}

function CreateListingModal({
  open,
  onClose,
  investments,
}: {
  open: boolean;
  onClose: () => void;
  investments: (Investment & { property: { id: number; title: string } })[];
}) {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState<number | ''>('');
  const [shares, setShares] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { propertyId: number; shares: number; pricePerShare: number }) =>
      api.createMarketplaceListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] });
      onClose();
      setPropertyId('');
      setShares('');
      setPricePerShare('');
      setError('');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create listing');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !shares || !pricePerShare) {
      setError('All fields are required');
      return;
    }
    mutation.mutate({
      propertyId: Number(propertyId),
      shares: parseFloat(shares),
      pricePerShare: parseFloat(pricePerShare),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <FiX className="text-xl" />
        </button>

        <h3 className="text-xl font-semibold text-gray-900 mb-1">List Your Area</h3>
        <p className="text-gray-500 text-sm mb-5">Sell your shares on the secondary marketplace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
            >
              <option value="">Select a property</option>
              {investments.map((inv) => (
                <option key={inv.property?.id ?? inv.propertyId} value={inv.property?.id ?? inv.propertyId ?? ''}>
                  {inv.property?.title ?? `Property #${inv.propertyId}`} ({parseFloat(inv.sharesOwned || '0').toLocaleString()} shares owned)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shares to List</label>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="Number of shares"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per Share (PKR)</label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={pricePerShare}
              onChange={(e) => setPricePerShare(e.target.value)}
              placeholder="Set your asking price"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
            />
          </div>

          {shares && pricePerShare && (
            <div className="bg-dao-blue/5 rounded-lg p-3 text-sm">
              <span className="text-gray-600">Total listing value: </span>
              <span className="font-semibold text-dao-blue">
                {formatPKR((parseFloat(shares) * parseFloat(pricePerShare)).toString())}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <FiAlertCircle className="shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-blue w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mutation.isPending ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}

function BuyModal({
  listing,
  onClose,
}: {
  listing: MarketplaceListing | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [shares, setShares] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { listingId: number; shares: number }) => api.buyMarketplaceShares(data),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Purchase failed. Please try again.');
    },
  });

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !shares) return;
    setError('');
    mutation.mutate({ listingId: listing.id, shares: parseFloat(shares) });
  };

  const handleClose = () => {
    setShares('');
    setSuccess(false);
    setError('');
    mutation.reset();
    onClose();
  };

  if (!listing) return null;

  const maxShares = parseFloat(listing.sharesRemaining);
  const totalCost = shares ? parseFloat(shares) * parseFloat(listing.pricePerShare) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <FiX className="text-xl" />
        </button>

        {success ? (
          <div className="text-center py-4">
            <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
            <p className="text-gray-600 text-sm mb-6">
              You&apos;ve acquired {shares} shares of <strong>{listing.property.title}</strong>.
            </p>
            <button onClick={handleClose} className="btn-blue w-full">Done</button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Buy Shares</h3>
            <p className="text-gray-500 text-sm mb-5">{listing.property.title}</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Price per share</span>
                <span className="font-medium">{formatPKR(listing.pricePerShare)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Available</span>
                <span className="font-medium">{maxShares.toLocaleString()} shares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Seller</span>
                <span className="font-medium">{listing.seller.firstName} {listing.seller.lastName}</span>
              </div>
            </div>

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

              {totalCost > 0 && (
                <div className="bg-dao-blue/5 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total cost</span>
                    <span className="font-semibold text-dao-blue">{formatPKR(totalCost.toString())}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Platform fee (2.5%) will apply</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                  <FiAlertCircle className="shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || !shares}
                className="btn-blue w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {mutation.isPending ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [buyListing, setBuyListing] = useState<MarketplaceListing | null>(null);
  const limit = 12;

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['marketplace-listings', page, sortBy],
    queryFn: () => api.getMarketplaceListings({ page, limit, sortBy, status: 'active' }),
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const listings = listingsData?.data ?? [];
  const pagination = listingsData?.pagination;
  const investments = portfolio?.investments ?? [];

  const filtered = useMemo(() => {
    let result = listings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l: MarketplaceListing) =>
          l.property.title.toLowerCase().includes(q) ||
          (l.property.city || '').toLowerCase().includes(q),
      );
    }
    if (propertyType !== 'All') {
      result = result.filter(
        (l: MarketplaceListing) =>
          (l.property.propertyType || '').toLowerCase() === propertyType.toLowerCase(),
      );
    }
    return result;
  }, [listings, search, propertyType]);

  const totalActiveListings = pagination?.total ?? filtered.length;

  const debounceSearch = useCallback(
    (() => {
      let timer: NodeJS.Timeout;
      return (val: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => setSearch(val), 300);
      };
    })(),
    [],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
            <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Buy and sell property shares on the secondary market</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-blue flex items-center gap-2 shrink-0"
        >
          <FiPlus />
          List Your Area
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<FiShoppingBag />}
          label="Active Listings"
          value={totalActiveListings.toString()}
        />
        <MetricCard
          icon={<FiTrendingUp />}
          label="Your Listings"
          value={investments.length > 0 ? 'View My Trades' : '0'}
          subText="Secondary market activity"
        />
        <MetricCard
          icon={<FiShoppingBag />}
          label="Your Investments"
          value={investments.length.toString()}
          subText="Available properties to list"
        />
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property name or city..."
              onChange={(e) => debounceSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 -mx-5 -mt-5 mb-4 bg-gray-200 rounded-t-xl" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-14 bg-gray-100 rounded-lg" />
                ))}
              </div>
              <div className="h-9 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        search || propertyType !== 'All' ? (
          <EmptyState
            icon={<FiSearch />}
            heading="No Results Found"
            message="Try adjusting your search or filter criteria."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch('');
              setPropertyType('All');
            }}
          />
        ) : (
          <EmptyState
            icon={<FiShoppingBag />}
            heading="No Active Listings"
            message="Be the first to list your property shares on the marketplace."
            actionLabel="List Your Area"
            onAction={() => setShowCreateModal(true)}
          />
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((listing: MarketplaceListing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onBuy={() => setBuyListing(listing)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          onPageChange={setPage}
        />
      )}

      {/* Create Listing Modal */}
      <CreateListingModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        investments={investments as any}
      />

      {/* Buy Modal */}
      <BuyModal listing={buyListing} onClose={() => setBuyListing(null)} />
    </div>
  );
}
