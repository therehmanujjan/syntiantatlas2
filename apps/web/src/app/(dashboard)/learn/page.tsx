'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FiSearch,
  FiBook,
  FiVideo,
  FiImage,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiShield,
  FiBarChart2,
  FiTarget,
  FiGrid,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { ContentItem } from '@/types';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';

const CATEGORIES = [
  { key: 'getting_started', label: 'Getting Started', icon: <FiStar />, color: 'bg-blue-50 text-blue-600' },
  { key: 'investment_basics', label: 'Investment Basics', icon: <FiTrendingUp />, color: 'bg-green-50 text-green-600' },
  { key: 'real_estate_101', label: 'Real Estate 101', icon: <FiGrid />, color: 'bg-purple-50 text-purple-600' },
  { key: 'dao_blockchain', label: 'DAO & Blockchain', icon: <FiShield />, color: 'bg-orange-50 text-orange-600' },
  { key: 'market_insights', label: 'Market Insights', icon: <FiBarChart2 />, color: 'bg-cyan-50 text-cyan-600' },
  { key: 'advanced_strategies', label: 'Advanced Strategies', icon: <FiTarget />, color: 'bg-red-50 text-red-600' },
];

const TYPE_FILTERS = [
  { key: '', label: 'All', icon: <FiGrid /> },
  { key: 'article', label: 'Articles', icon: <FiBook /> },
  { key: 'video', label: 'Videos', icon: <FiVideo /> },
  { key: 'infographic', label: 'Infographics', icon: <FiImage /> },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

function typeIcon(type: string) {
  if (type === 'video') return <FiVideo className="text-sm" />;
  if (type === 'infographic') return <FiImage className="text-sm" />;
  return <FiBook className="text-sm" />;
}

function ContentCardSkeleton() {
  return (
    <div className="card !p-0 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function LearnPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const queryParams: Record<string, string | number> = { page, limit };
  if (search.trim()) queryParams.search = search.trim();
  if (category) queryParams.category = category;
  if (typeFilter) queryParams.type = typeFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['content', queryParams],
    queryFn: () => api.getContentItems(queryParams),
  });

  const { data: categories } = useQuery({
    queryKey: ['content-categories'],
    queryFn: () => api.getContentCategories(),
  });

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  const categoryCountMap: Record<string, number> = {};
  (categories ?? []).forEach((c: { category: string; count: number }) => {
    categoryCountMap[c.category] = c.count;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-dao-blue via-dao-blue-dark to-dao-dark rounded-2xl p-8 sm:p-12 mb-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-40 h-40 rounded-full border-2 border-white" />
          <div className="absolute bottom-4 left-12 w-24 h-24 rounded-full border-2 border-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Explore & Learn
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mb-6">
            Master real estate investing, blockchain technology, and DAO governance
            with our curated educational resources.
          </p>
          <div className="relative max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles, videos, guides..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-0 text-sm bg-white shadow-lg
                         focus:outline-none focus:ring-2 focus:ring-dao-lime/50"
            />
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setCategory(isActive ? '' : cat.key);
                  setPage(1);
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl text-center transition border ${
                  isActive
                    ? 'border-dao-blue bg-dao-blue/5 ring-1 ring-dao-blue'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${cat.color}`}>
                  {cat.icon}
                </span>
                <span className="text-xs font-medium text-gray-700 leading-tight">{cat.label}</span>
                {categoryCountMap[cat.key] !== undefined && (
                  <span className="text-[10px] text-gray-400">
                    {categoryCountMap[cat.key]} items
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Type Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {TYPE_FILTERS.map((tf) => (
          <button
            key={tf.key}
            onClick={() => {
              setTypeFilter(tf.key);
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              typeFilter === tf.key
                ? 'bg-dao-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tf.icon}
            {tf.label}
          </button>
        ))}

        {(category || search) && (
          <button
            onClick={() => {
              setCategory('');
              setSearch('');
              setTypeFilter('');
              setPage(1);
            }}
            className="ml-auto text-xs text-gray-500 hover:text-dao-blue transition"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-red-500 text-lg font-medium">Failed to load content.</p>
          <p className="text-gray-500 mt-1 text-sm">Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon={<FiBook />}
          heading="No content found"
          message={
            search || category || typeFilter
              ? 'Try adjusting your search or filters.'
              : 'Educational content will appear here once published.'
          }
          actionLabel={search || category || typeFilter ? 'Clear Filters' : undefined}
          onAction={
            search || category || typeFilter
              ? () => {
                  setSearch('');
                  setCategory('');
                  setTypeFilter('');
                }
              : undefined
          }
        />
      )}

      {/* Content Grid */}
      {!isLoading && !isError && items.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item: ContentItem) => {
              const catInfo = CATEGORIES.find((c) => c.key === item.category);
              return (
                <Link
                  key={item.id}
                  href={`/learn/${item.id}`}
                  className="card !p-0 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${catInfo?.color ?? 'bg-gray-100 text-gray-400'}`}>
                        {catInfo?.icon ?? <FiBook />}
                      </span>
                    )}

                    {/* Type badge */}
                    <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1">
                      {typeIcon(item.type)}
                      {item.type}
                    </span>

                    {/* Difficulty badge */}
                    <span className={`absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${DIFFICULTY_COLORS[item.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                      {item.difficulty}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-dao-blue">
                      {catInfo?.label ?? item.category}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-dao-blue transition-colors">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-xs text-gray-500 line-clamp-2">{item.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      {item.readTime && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <FiClock /> {item.readTime} min read
                        </span>
                      )}
                      {item.tags && (item.tags as string[]).length > 0 && (
                        <span className="text-[10px] text-gray-400 truncate">
                          {(item.tags as string[]).slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
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
