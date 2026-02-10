'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FiArrowLeft,
  FiMapPin,
  FiMaximize,
  FiUser,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiHome,
  FiX,
  FiCheckCircle,
  FiCalendar,
  FiTarget,
  FiBarChart2,
  FiClock,
  FiPercent,
  FiShield,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { ImageCarousel } from '@/components/ui/image-carousel';
import type { Property } from '@/types';

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPropertyImages(property: Property): { src: string; alt?: string }[] {
  if (property.images && property.images.length > 0) {
    return property.images.map((src, i) => ({ src, alt: `${property.title} - Image ${i + 1}` }));
  }
  return [];
}

function InvestmentBreakdownChart({ raised, target }: { raised: string | null; target: string | null }) {
  const raisedNum = parseFloat(raised || '0');
  const targetNum = parseFloat(target || '1');
  const pct = targetNum > 0 ? Math.min((raisedNum / targetNum) * 100, 100) : 0;
  const remaining = Math.max(targetNum - raisedNum, 0);

  const segments = [
    { label: 'Funded', value: raisedNum, pct: pct, color: 'bg-dao-blue' },
    { label: 'Remaining', value: remaining, pct: 100 - pct, color: 'bg-gray-200' },
  ];

  return (
    <div className="space-y-4">
      {/* Visual bar */}
      <div className="h-4 rounded-full overflow-hidden flex">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-700`}
            style={{ width: `${Math.max(seg.pct, seg.pct > 0 ? 2 : 0)}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${seg.color} shrink-0`} />
            <div>
              <p className="text-xs text-gray-500">{seg.label}</p>
              <p className="text-sm font-semibold text-gray-800">{formatPKR(seg.value.toString())}</p>
              <p className="text-xs text-gray-400">{seg.pct.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FundingTimeline({ property }: { property: Property }) {
  const pct = fundingPercent(property.fundingRaised, property.fundingTarget);
  const status = (property.status || '').toLowerCase();

  const milestones = [
    {
      label: 'Listed',
      date: formatDate(property.createdAt),
      completed: true,
      icon: <FiCalendar />,
    },
    {
      label: '25% Funded',
      date: pct >= 25 ? 'Reached' : `${25 - pct}% to go`,
      completed: pct >= 25,
      icon: <FiBarChart2 />,
    },
    {
      label: '50% Funded',
      date: pct >= 50 ? 'Reached' : `${50 - pct}% to go`,
      completed: pct >= 50,
      icon: <FiBarChart2 />,
    },
    {
      label: '75% Funded',
      date: pct >= 75 ? 'Reached' : `${75 - pct}% to go`,
      completed: pct >= 75,
      icon: <FiBarChart2 />,
    },
    {
      label: 'Fully Funded',
      date: status === 'funded' || pct >= 100 ? 'Completed' : `${100 - pct}% to go`,
      completed: status === 'funded' || pct >= 100,
      icon: <FiCheckCircle />,
    },
  ];

  return (
    <div className="space-y-0">
      {milestones.map((milestone, i) => (
        <div key={milestone.label} className="flex gap-4">
          {/* Timeline track */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0
                ${milestone.completed
                  ? 'bg-dao-blue text-white'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}
            >
              {milestone.icon}
            </div>
            {i < milestones.length - 1 && (
              <div className={`w-0.5 h-8 ${milestone.completed ? 'bg-dao-blue' : 'bg-gray-200'}`} />
            )}
          </div>

          {/* Content */}
          <div className="pt-1 pb-4">
            <p className={`text-sm font-medium ${milestone.completed ? 'text-gray-900' : 'text-gray-400'}`}>
              {milestone.label}
            </p>
            <p className="text-xs text-gray-500">{milestone.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-24 mb-6" />
      <div className="h-80 bg-gray-200 rounded-xl mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-80 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [investSuccess, setInvestSuccess] = useState(false);

  const propertyId = parseInt(id, 10);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => api.getProperty(propertyId),
    enabled: !isNaN(propertyId),
  });

  const minInvest = parseFloat(property?.minInvestment || '0');
  const maxInvest = parseFloat(property?.maxInvestment || '100000000');

  const investSchema = z.object({
    amount: z
      .number({ invalid_type_error: 'Please enter a valid amount' })
      .min(minInvest || 1, `Minimum investment is ${formatPKR(property?.minInvestment || '0')}`)
      .max(maxInvest, `Maximum investment is ${formatPKR(property?.maxInvestment || '0')}`),
  });

  type InvestForm = z.infer<typeof investSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvestForm>({
    resolver: zodResolver(investSchema),
  });

  const investMutation = useMutation({
    mutationFn: (data: { propertyId: number; amount: number }) => api.invest(data),
    onSuccess: () => {
      setInvestSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  const onInvest = (data: InvestForm) => {
    investMutation.mutate({ propertyId, amount: data.amount });
  };

  const closeModal = () => {
    setShowModal(false);
    setInvestSuccess(false);
    investMutation.reset();
    reset();
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-red-500 text-lg font-medium">Property not found.</p>
        <Link href="/properties" className="text-dao-blue hover:underline text-sm mt-2 inline-block">
          Back to Properties
        </Link>
      </div>
    );
  }

  const pct = fundingPercent(property.fundingRaised, property.fundingTarget);
  const investorCount = property.investorCount ?? property._count?.investments ?? 0;
  const images = getPropertyImages(property);
  const hasImages = images.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/properties')}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-dao-blue transition mb-6"
      >
        <FiArrowLeft />
        Back to Properties
      </button>

      {/* Image Gallery / Hero */}
      <div className="mb-8 rounded-xl overflow-hidden">
        {hasImages ? (
          <ImageCarousel
            images={images}
            aspectRatio="21/9"
            className="w-full"
          />
        ) : (
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-dao-blue via-dao-blue-dark to-dao-dark flex items-center justify-center">
            <FiHome className="text-white/10 text-[120px]" />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={property.status || 'active'} size="md" />
                {property.propertyType && (
                  <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {property.propertyType}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                {property.title}
              </h1>
              {property.city && (
                <p className="text-blue-100 mt-1 flex items-center gap-1 text-sm">
                  <FiMapPin /> {property.city}
                  {property.location && ` - ${property.location}`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Title bar (when images present, title is not overlaid) */}
      {hasImages && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <StatusBadge status={property.status || 'active'} size="md" />
            {property.propertyType && (
              <span className="bg-dao-blue/10 text-dao-blue text-xs font-semibold px-2.5 py-1 rounded-full">
                {property.propertyType}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
            {property.title}
          </h1>
          {property.city && (
            <p className="text-gray-500 mt-1 flex items-center gap-1 text-sm">
              <FiMapPin className="text-dao-blue" /> {property.city}
              {property.location && ` - ${property.location}`}
            </p>
          )}
        </div>
      )}

      {/* Key Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card flex items-center gap-3 !py-4">
          <div className="w-10 h-10 rounded-lg bg-dao-blue/10 flex items-center justify-center text-dao-blue">
            <FiDollarSign className="text-lg" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-sm font-bold text-gray-900">{formatPKR(property.totalValue)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 !py-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <FiTrendingUp className="text-lg" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Expected ROI</p>
            <p className="text-sm font-bold text-green-600">
              {property.expectedReturnsAnnual
                ? `${parseFloat(property.expectedReturnsAnnual).toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-3 !py-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <FiUsers className="text-lg" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Investors</p>
            <p className="text-sm font-bold text-gray-900">{investorCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 !py-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <FiPercent className="text-lg" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Funded</p>
            <p className="text-sm font-bold text-dao-blue">{pct}%</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {property.description && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About This Property</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Property Details Grid */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMapPin className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm font-medium text-gray-800">{property.location || property.address || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiHome className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">City</p>
                  <p className="text-sm font-medium text-gray-800">{property.city || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiHome className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Property Type</p>
                  <p className="text-sm font-medium text-gray-800">{property.propertyType || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMaximize className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Total Area</p>
                  <p className="text-sm font-medium text-gray-800">
                    {property.areaSqft ? `${parseFloat(property.areaSqft).toLocaleString()} sqft` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiCalendar className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Listed On</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(property.createdAt)}</p>
                </div>
              </div>
              {property.seller && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiUser className="text-dao-blue mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Seller</p>
                    <p className="text-sm font-medium text-gray-800">
                      {property.seller.firstName} {property.seller.lastName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Investment Breakdown Chart */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FiBarChart2 className="text-dao-blue" />
              <h2 className="text-lg font-semibold text-gray-900">Investment Breakdown</h2>
            </div>

            <InvestmentBreakdownChart
              raised={property.fundingRaised}
              target={property.fundingTarget}
            />

            {/* Detailed financials */}
            <hr className="my-5 border-gray-100" />
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Funding Target</p>
                <p className="text-lg font-bold text-gray-900">{formatPKR(property.fundingTarget)}</p>
              </div>
              <div className="text-center p-3 bg-dao-blue/5 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Total Raised</p>
                <p className="text-lg font-bold text-dao-blue">{formatPKR(property.fundingRaised)}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Remaining</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatPKR(
                    Math.max(
                      parseFloat(property.fundingTarget || '0') - parseFloat(property.fundingRaised || '0'),
                      0
                    ).toString()
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Funding Timeline */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FiClock className="text-dao-blue" />
              <h2 className="text-lg font-semibold text-gray-900">Funding Timeline</h2>
            </div>
            <FundingTimeline property={property} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:sticky lg:top-6 self-start space-y-6">
          {/* Investment Overview Card */}
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Investment Overview</h2>

            {/* Key figures */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Value</span>
                <span className="font-semibold text-gray-800">{formatPKR(property.totalValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Funding Target</span>
                <span className="font-semibold text-gray-800">{formatPKR(property.fundingTarget)}</span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Funding Raised</span>
                  <span className="font-semibold text-dao-blue">{pct}%</span>
                </div>
                <div className="bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-dao-blue h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPKR(property.fundingRaised)} raised
                </p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Investment details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Min Investment</span>
                <span className="font-medium text-gray-800">{formatPKR(property.minInvestment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Max Investment</span>
                <span className="font-medium text-gray-800">{formatPKR(property.maxInvestment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expected Annual Returns</span>
                <span className="font-semibold text-green-600">
                  {property.expectedReturnsAnnual
                    ? `${parseFloat(property.expectedReturnsAnnual).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rental Yield</span>
                <span className="font-semibold text-green-600">
                  {property.rentalYield
                    ? `${parseFloat(property.rentalYield).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Investors</span>
                <span className="font-medium text-gray-800 flex items-center gap-1">
                  <FiUsers className="text-dao-blue" />
                  {investorCount}
                </span>
              </div>
            </div>

            {/* Invest Button */}
            <button
              onClick={() => setShowModal(true)}
              className="btn-blue w-full flex items-center justify-center gap-2"
            >
              <FiDollarSign />
              Invest Now
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FiShield className="text-dao-blue" />
              Investor Protection
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <FiCheckCircle className="text-green-500 mt-0.5 shrink-0 text-sm" />
                <p className="text-xs text-gray-600">Property verified by Syntiant Atlas team</p>
              </div>
              <div className="flex items-start gap-2">
                <FiCheckCircle className="text-green-500 mt-0.5 shrink-0 text-sm" />
                <p className="text-xs text-gray-600">Legal documentation validated</p>
              </div>
              <div className="flex items-start gap-2">
                <FiCheckCircle className="text-green-500 mt-0.5 shrink-0 text-sm" />
                <p className="text-xs text-gray-600">Smart contract secured ownership</p>
              </div>
              <div className="flex items-start gap-2">
                <FiCheckCircle className="text-green-500 mt-0.5 shrink-0 text-sm" />
                <p className="text-xs text-gray-600">DAO governance enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="text-xl" />
            </button>

            {investSuccess ? (
              <div className="text-center py-4">
                <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Investment Successful!</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Your investment in <strong>{property.title}</strong> has been processed successfully.
                </p>
                <button onClick={closeModal} className="btn-blue w-full">
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Invest in Property</h3>
                <p className="text-gray-500 text-sm mb-6">{property.title}</p>

                <form onSubmit={handleSubmit(onInvest)} className="space-y-5">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Amount (PKR)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder={`Min: ${formatPKR(property.minInvestment)}`}
                      {...register('amount', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                    )}
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Min: {formatPKR(property.minInvestment)}</span>
                      <span>Max: {formatPKR(property.maxInvestment)}</span>
                    </div>
                  </div>

                  {investMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                      {(investMutation.error as any)?.response?.data?.message ||
                        'Investment failed. Please try again.'}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={investMutation.isPending}
                    className="btn-blue w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {investMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Investment'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
