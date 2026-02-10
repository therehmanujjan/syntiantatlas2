'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FiSearch,
  FiMapPin,
  FiMaximize,
  FiUsers,
  FiTrendingUp,
  FiStar,
  FiHome,
  FiPercent,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { Property } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ImageCarousel } from '@/components/ui/image-carousel';

const STATUS_TABS = ['All', 'Developmental', 'Mature', 'Upcoming'] as const;
const PROPERTY_TYPES = ['All', 'Residential', 'Commercial', 'Land', 'Mixed'] as const;

const PLACEHOLDER_IMAGES = [
  '/images/property-placeholder-1.jpg',
  '/images/property-placeholder-2.jpg',
  '/images/property-placeholder-3.jpg',
];

function formatPKR(value: string | null): string {
  if (!value) return 'PKR 0';
  const num = parseFloat(value);
  if (num >= 10_000_000) return `PKR ${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `PKR ${(num / 100_000).toFixed(2)} Lac`;
  return `PKR ${num.toLocaleString()}`;
}

function fundingPercent(raised: string | null, target: string | null): number {
  const r = parseFloat(raised || '0');
  const t = parseFloat(target || '1');
  if (t === 0) return 0;
  return Math.min(Math.round((r / t) * 100), 100);
}

function isNewListing(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return diffMs < 7 * 24 * 60 * 60 * 1000;
}

function statusToTab(status: string | null): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'developmental') return 'Developmental';
  if (s === 'funded' || s === 'mature') return 'Mature';
  if (s === 'upcoming' || s === 'pending' || s === 'draft') return 'Upcoming';
  return 'Developmental';
}

function getPropertyImages(property: Property): { src: string; alt?: string }[] {
  if (property.images && property.images.length > 0) {
    return property.images.map((src, i) => ({ src, alt: `${property.title} - Image ${i + 1}` }));
  }
  return [];
}

function PropertyCardSkeleton() {
  return (
    <div className="card !p-0 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 9;

  const queryParams: Record<string, string | number> = { page, limit };
  if (search.trim()) queryParams.search = search.trim();
  if (typeFilter !== 'All') queryParams.propertyType = typeFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['properties', queryParams],
    queryFn: () => api.getProperties(queryParams),
  });

  const allProperties = data?.data ?? [];
  const pagination = data?.pagination;

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allProperties.length, Developmental: 0, Mature: 0, Upcoming: 0 };
    allProperties.forEach((p: Property) => {
      const tab = statusToTab(p.status);
      counts[tab] = (counts[tab] || 0) + 1;
    });
    return counts;
  }, [allProperties]);

  const properties = useMemo(() => {
    if (activeTab === 'All') return allProperties;
    return allProperties.filter((p: Property) => statusToTab(p.status) === activeTab);
  }, [allProperties, activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Investment Properties</h1>
        <p className="mt-2 text-gray-600">
          Browse and invest in verified real estate opportunities across Pakistan.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab
                ? 'bg-dao-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {tabCounts[tab] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Type Filter */}
      <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties by name, location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44 px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                     bg-white focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Types' : t}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-red-500 text-lg font-medium">Failed to load properties.</p>
          <p className="text-gray-500 mt-1 text-sm">Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && properties.length === 0 && (
        <EmptyState
          icon={<FiSearch />}
          heading="No properties found"
          message="Try adjusting your search or filters to find what you're looking for."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setTypeFilter('All');
            setActiveTab('All');
          }}
        />
      )}

      {/* Properties Grid */}
      {!isLoading && !isError && properties.length > 0 && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: Property) => {
              const pct = fundingPercent(property.fundingRaised, property.fundingTarget);
              const investorCount = property.investorCount ?? property._count?.investments ?? 0;
              const isNew = isNewListing(property.createdAt);
              const images = getPropertyImages(property);
              const hasImages = images.length > 0;

              return (
                <div key={property.id} className="card !p-0 overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Card Header — Image Carousel or Gradient Fallback */}
                  <div className="relative h-48">
                    {hasImages ? (
                      <ImageCarousel
                        images={images}
                        aspectRatio="auto"
                        className="h-full w-full !rounded-none"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-dao-blue to-dao-blue-dark flex items-center justify-center">
                        <FiHome className="text-white/20 text-6xl" />
                      </div>
                    )}

                    {/* Overlay badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10 pointer-events-none">
                      {isNew && (
                        <span className="bg-dao-lime text-dao-dark text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FiStar className="text-[8px]" /> New
                        </span>
                      )}
                      {property.propertyType && (
                        <span className="bg-white/90 text-dao-blue text-xs font-semibold px-2.5 py-1 rounded-full">
                          {property.propertyType}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <StatusBadge status={property.status || 'active'} />
                    </div>

                    {/* Title overlay at bottom of image */}
                    {!hasImages && (
                      <h3 className="absolute bottom-0 left-0 right-0 z-10 text-white font-semibold text-lg px-5 pb-4 leading-snug bg-gradient-to-t from-black/60 to-transparent pt-8">
                        {property.title}
                      </h3>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Title (shown below image when carousel is present) */}
                    {hasImages && (
                      <h3 className="font-semibold text-lg text-gray-900 leading-snug line-clamp-1">
                        {property.title}
                      </h3>
                    )}

                    {/* Location & Area */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiMapPin className="text-dao-blue" />
                        {property.city || 'N/A'}
                      </span>
                      {property.areaSqft && (
                        <span className="flex items-center gap-1">
                          <FiMaximize className="text-dao-blue" />
                          {parseFloat(property.areaSqft).toLocaleString()} sqft
                        </span>
                      )}
                    </div>

                    {/* Funding Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Funding Progress</span>
                        <span className="font-medium text-dao-blue">{pct}%</span>
                      </div>
                      <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-dao-blue h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPKR(property.fundingRaised)} / {formatPKR(property.fundingTarget)}
                      </p>
                    </div>

                    {/* Enhanced Stats — 3 columns */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                          <FiPercent className="text-[8px]" /> Complete
                        </p>
                        <p className="text-xs font-semibold text-dao-blue mt-0.5">{pct}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                          <FiTrendingUp className="text-[8px]" /> ROI
                        </p>
                        <p className="text-xs font-semibold text-green-600 mt-0.5">
                          {property.expectedReturnsAnnual
                            ? `${parseFloat(property.expectedReturnsAnnual).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                          <FiUsers className="text-[8px]" /> Investors
                        </p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5">{investorCount}</p>
                      </div>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={`/properties/${property.id}`}
                      className="btn-blue block text-center w-full !py-2.5 text-sm group-hover:bg-dao-blue-dark transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
