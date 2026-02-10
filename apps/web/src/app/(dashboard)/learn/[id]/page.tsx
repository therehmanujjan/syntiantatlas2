'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiArrowLeft,
  FiBook,
  FiVideo,
  FiImage,
  FiClock,
  FiCheckCircle,
  FiCalendar,
  FiTag,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting Started',
  investment_basics: 'Investment Basics',
  real_estate_101: 'Real Estate 101',
  dao_blockchain: 'DAO & Blockchain',
  market_insights: 'Market Insights',
  advanced_strategies: 'Advanced Strategies',
};

function typeIcon(type: string) {
  if (type === 'video') return <FiVideo />;
  if (type === 'infographic') return <FiImage />;
  return <FiBook />;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-24 mb-6" />
      <div className="h-64 bg-gray-200 rounded-xl mb-6" />
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function LearnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentId = parseInt(id, 10);

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['content', contentId],
    queryFn: () => api.getContentItem(contentId),
    enabled: !isNaN(contentId),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.markContentComplete(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content-progress'] });
    },
  });

  if (isLoading) return <DetailSkeleton />;

  if (isError || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-red-500 text-lg font-medium">Content not found.</p>
        <Link href="/learn" className="text-dao-blue hover:underline text-sm mt-2 inline-block">
          Back to Learn
        </Link>
      </div>
    );
  }

  const tags = (item.tags ?? []) as string[];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/learn')}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-dao-blue transition mb-6"
      >
        <FiArrowLeft />
        Back to Learn
      </button>

      {/* Hero Image / Video */}
      {item.type === 'video' && item.videoUrl ? (
        <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-black">
          <iframe
            src={item.videoUrl}
            title={item.title}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : item.thumbnailUrl ? (
        <div className="mb-6 rounded-xl overflow-hidden">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-auto max-h-80 object-cover"
          />
        </div>
      ) : null}

      {/* Meta Row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-dao-blue bg-dao-blue/10 px-2.5 py-1 rounded-full">
          {typeIcon(item.type)}
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </span>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_COLORS[item.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
          {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>

      {/* Info Row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
        {item.readTime && (
          <span className="flex items-center gap-1.5">
            <FiClock className="text-dao-blue" />
            {item.readTime} min read
          </span>
        )}
        {item.publishedAt && (
          <span className="flex items-center gap-1.5">
            <FiCalendar className="text-dao-blue" />
            {formatDate(item.publishedAt)}
          </span>
        )}
      </div>

      {/* Article Body */}
      <article className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line mb-8">
        {item.body}
      </article>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8 pt-6 border-t border-gray-100">
          <FiTag className="text-gray-400" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Mark Complete Button */}
      <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
        <button
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="btn-blue flex items-center gap-2 disabled:opacity-60"
        >
          <FiCheckCircle />
          {completeMutation.isSuccess ? 'Marked as Complete' : 'Mark as Complete'}
        </button>
        <Link
          href="/learn"
          className="text-sm text-gray-500 hover:text-dao-blue transition"
        >
          Browse more content
        </Link>
      </div>
    </div>
  );
}
