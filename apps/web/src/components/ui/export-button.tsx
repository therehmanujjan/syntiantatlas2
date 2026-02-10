'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { FiDownload, FiFileText, FiFile } from 'react-icons/fi';

type ExportFormat = 'pdf' | 'csv' | 'excel';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  formats?: ExportFormat[];
  label?: string;
  loading?: boolean;
  className?: string;
}

const formatConfig: Record<ExportFormat, { label: string; icon: React.ReactNode }> = {
  pdf: { label: 'PDF', icon: <FiFileText /> },
  csv: { label: 'CSV', icon: <FiFile /> },
  excel: { label: 'Excel', icon: <FiFile /> },
};

export function ExportButton({
  onExport,
  formats = ['pdf', 'csv', 'excel'],
  label = 'Export',
  loading = false,
  className,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = async (format: ExportFormat) => {
    setOpen(false);
    await onExport(format);
  };

  return (
    <div className={clsx('relative inline-block', className)} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="inline-flex items-center gap-2 btn-secondary text-sm px-4 py-2 disabled:opacity-50"
      >
        <FiDownload className="text-base" />
        {loading ? 'Exporting...' : label}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
          {formats.map((format) => (
            <button
              key={format}
              onClick={() => handleSelect(format)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {formatConfig[format].icon}
              {formatConfig[format].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
