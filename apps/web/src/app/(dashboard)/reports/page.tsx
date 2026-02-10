'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiFileText,
  FiDownload,
  FiCalendar,
  FiFilter,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { Report } from '@/types';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const tabs = [
  { key: 'generate', label: 'Generate Report' },
  { key: 'history', label: 'Statement Logs' },
];

const REPORT_TYPES = [
  { value: 'investment_summary', label: 'Investment Summary' },
  { value: 'transaction_history', label: 'Transaction History' },
  { value: 'dividend_report', label: 'Dividend Report' },
  { value: 'portfolio_statement', label: 'Portfolio Statement' },
  { value: 'tax_report', label: 'Tax Report' },
];

const historyColumns: Column<Record<string, unknown>>[] = [
  {
    key: 'reportType',
    header: 'Report Type',
    render: (row) => {
      const r = row as unknown as Report;
      const label = REPORT_TYPES.find((t) => t.value === r.reportType)?.label ?? r.reportType;
      return <span className="font-medium text-gray-900">{label}</span>;
    },
  },
  {
    key: 'startDate',
    header: 'Period',
    render: (row) => {
      const r = row as unknown as Report;
      const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
      return (
        <span className="text-gray-600 text-sm">
          {fmt(r.startDate)} - {fmt(r.endDate)}
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    header: 'Generated',
    sortable: true,
    render: (row) => {
      const r = row as unknown as Report;
      return (
        <span className="text-gray-500 text-sm">
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
      const r = row as unknown as Report;
      return <StatusBadge status={r.status} />;
    },
  },
  {
    key: 'actions',
    header: '',
    render: (row) => {
      const r = row as unknown as Report;
      if (r.status !== 'completed' || !r.fileUrl) return null;
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadReport(r.id);
          }}
          className="text-dao-blue hover:text-dao-blue-dark text-sm flex items-center gap-1"
        >
          <FiDownload /> Download
        </button>
      );
    },
  },
];

async function downloadReport(id: number) {
  try {
    const blob = await api.downloadReport(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    // silently fail
  }
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('generate');
  const queryClient = useQueryClient();

  // Generate form state
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generated, setGenerated] = useState(false);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['report-history'],
    queryFn: () => api.getReportHistory(),
  });

  const generateMutation = useMutation({
    mutationFn: (data: { reportType: string; startDate: string; endDate: string }) =>
      api.generateReport(data),
    onSuccess: () => {
      setGenerated(true);
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType || !startDate || !endDate) return;
    setGenerated(false);
    generateMutation.mutate({ reportType, startDate, endDate });
  };

  const resetForm = () => {
    setReportType('');
    setStartDate('');
    setEndDate('');
    setGenerated(false);
    generateMutation.reset();
  };

  const reports = history ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">E-Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Generate and download your investment reports</p>
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Generate tab */}
      {activeTab === 'generate' && (
        <div className="card max-w-lg">
          {generated ? (
            <div className="text-center py-8">
              <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Generated</h3>
              <p className="text-gray-600 text-sm mb-6">
                Your report is being prepared. Check the Statement Logs tab to download it.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={resetForm} className="btn-secondary">
                  Generate Another
                </button>
                <button onClick={() => setActiveTab('history')} className="btn-blue">
                  View Logs
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiFileText className="text-dao-blue" />
                Generate Report
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                >
                  <option value="">Select report type</option>
                  {REPORT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiCalendar className="inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiCalendar className="inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                  />
                </div>
              </div>

              {generateMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                  <FiAlertCircle className="shrink-0" />
                  {(generateMutation.error as any)?.response?.data?.message || 'Failed to generate report.'}
                </div>
              )}

              <button
                type="submit"
                disabled={generateMutation.isPending || !reportType || !startDate || !endDate}
                className="btn-blue w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {generateMutation.isPending ? (
                  <>
                    <FiLoader className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FiFileText /> Generate Report
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div>
          {historyLoading ? (
            <div className="card animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<FiFileText />}
              heading="No Reports Yet"
              message="Generate your first report to see it here."
              actionLabel="Generate Report"
              onAction={() => setActiveTab('generate')}
            />
          ) : (
            <div className="card !p-0 overflow-hidden">
              <DataTable
                columns={historyColumns}
                data={reports as unknown as Record<string, unknown>[]}
                keyField="id"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
