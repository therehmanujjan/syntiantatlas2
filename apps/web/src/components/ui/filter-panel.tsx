'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// ── Types ──

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date-range' | 'checkbox-group';
  options?: FilterOption[];
}

interface FilterValues {
  [key: string]: string | string[] | { from: string; to: string };
}

interface FilterPanelProps {
  filters: FilterField[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  className?: string;
}

// ── Component ──

export function FilterPanel({ filters, values, onChange, className }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  // Count active filters
  const activeCount = Object.entries(values).filter(([, v]) => {
    if (typeof v === 'string') return v !== '';
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return v.from !== '' || v.to !== '';
    return false;
  }).length;

  const updateField = (key: string, val: FilterValues[string]) => {
    onChange({ ...values, [key]: val });
  };

  const clearAll = () => {
    const cleared: FilterValues = {};
    filters.forEach((f) => {
      if (f.type === 'select') cleared[f.key] = '';
      else if (f.type === 'checkbox-group') cleared[f.key] = [];
      else if (f.type === 'date-range') cleared[f.key] = { from: '', to: '' };
    });
    onChange(cleared);
  };

  const removeChip = (key: string, chipValue?: string) => {
    const current = values[key];
    if (Array.isArray(current) && chipValue) {
      updateField(key, current.filter((v) => v !== chipValue));
    } else if (typeof current === 'string') {
      updateField(key, '');
    } else if (current && typeof current === 'object' && !Array.isArray(current)) {
      updateField(key, { from: '', to: '' });
    }
  };

  // Build active filter chips
  const chips: { key: string; label: string; chipValue?: string }[] = [];
  Object.entries(values).forEach(([key, val]) => {
    const filterDef = filters.find((f) => f.key === key);
    if (!filterDef) return;
    if (typeof val === 'string' && val) {
      const optLabel = filterDef.options?.find((o) => o.value === val)?.label ?? val;
      chips.push({ key, label: `${filterDef.label}: ${optLabel}` });
    } else if (Array.isArray(val)) {
      val.forEach((v) => {
        const optLabel = filterDef.options?.find((o) => o.value === v)?.label ?? v;
        chips.push({ key, label: `${filterDef.label}: ${optLabel}`, chipValue: v });
      });
    } else if (val && typeof val === 'object' && (val.from || val.to)) {
      const parts = [];
      if (val.from) parts.push(`from ${val.from}`);
      if (val.to) parts.push(`to ${val.to}`);
      chips.push({ key, label: `${filterDef.label}: ${parts.join(' ')}` });
    }
  });

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-100', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700"
      >
        <span className="inline-flex items-center gap-2">
          <FiFilter className="text-base" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-dao-blue text-white text-xs">
              {activeCount}
            </span>
          )}
        </span>
        {expanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {chips.map((chip, i) => (
            <span
              key={`${chip.key}-${i}`}
              className="inline-flex items-center gap-1 bg-dao-blue/10 text-dao-blue text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {chip.label}
              <button
                onClick={() => removeChip(chip.key, chip.chipValue)}
                className="hover:text-dao-blue-dark"
              >
                <FiX className="text-xs" />
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Clear All
          </button>
        </div>
      )}

      {/* Filter fields */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-4">
          {filters.map((field) => {
            if (field.type === 'select') {
              return (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                  <select
                    value={(values[field.key] as string) ?? ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                  >
                    <option value="">All</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === 'date-range') {
              const range = (values[field.key] as { from: string; to: string }) ?? {
                from: '',
                to: '',
              };
              return (
                <div key={field.key} className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={range.from}
                      onChange={(e) => updateField(field.key, { ...range, from: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="date"
                      value={range.to}
                      onChange={(e) => updateField(field.key, { ...range, to: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                    />
                  </div>
                </div>
              );
            }

            if (field.type === 'checkbox-group') {
              const selected = (values[field.key] as string[]) ?? [];
              return (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                  <div className="space-y-1.5">
                    {field.options?.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selected.includes(opt.value)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selected, opt.value]
                              : selected.filter((v) => v !== opt.value);
                            updateField(field.key, next);
                          }}
                          className="rounded border-gray-300"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
