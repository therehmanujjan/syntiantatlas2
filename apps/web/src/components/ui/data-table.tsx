'use client';

import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { FiChevronUp, FiChevronDown, FiMoreVertical } from 'react-icons/fi';

// ── Types ──

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  destructive?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  actions?: RowAction<T>[];
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

type SortDir = 'asc' | 'desc';

// ── Component ──

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  actions,
  selectable = false,
  onSelectionChange,
  onRowClick,
  mobileCard,
  emptyMessage = 'No data found.',
  className,
}: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [openAction, setOpenAction] = useState<string | null>(null);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  const toggleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  // Selection
  const allSelected = data.length > 0 && selectedKeys.size === data.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(data.map((r) => String(r[keyField])));
      setSelectedKeys(all);
      onSelectionChange?.(data);
    }
  };

  const toggleRow = (row: T) => {
    const key = String(row[keyField]);
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
    onSelectionChange?.(data.filter((r) => next.has(String(r[keyField]))));
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={clsx('w-full', className)}>
      {/* ── Desktop Table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {selectable && (
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                    col.className,
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortCol === col.key && (
                      sortDir === 'asc' ? <FiChevronUp className="text-xs" /> : <FiChevronDown className="text-xs" />
                    )}
                  </span>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="w-10 px-3 py-3" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((row) => {
              const rowKey = String(row[keyField]);
              return (
                <tr
                  key={rowKey}
                  className={clsx(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50',
                    selectedKeys.has(rowKey) && 'bg-dao-blue/5',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(rowKey)}
                        onChange={() => toggleRow(row)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-3 py-3 text-gray-700', col.className)}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setOpenAction(openAction === rowKey ? null : rowKey)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <FiMoreVertical />
                        </button>
                        {openAction === rowKey && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                            {actions.map((action) => (
                              <button
                                key={action.label}
                                onClick={() => {
                                  setOpenAction(null);
                                  action.onClick(row);
                                }}
                                className={clsx(
                                  'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors',
                                  action.destructive
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-gray-700 hover:bg-gray-50',
                                )}
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-3">
        {sortedData.map((row) => {
          const rowKey = String(row[keyField]);

          if (mobileCard) {
            return <div key={rowKey}>{mobileCard(row)}</div>;
          }

          return (
            <div
              key={rowKey}
              className={clsx(
                'card text-sm',
                onRowClick && 'cursor-pointer hover:shadow-md transition-shadow',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between py-1.5">
                  <span className="text-gray-500 text-xs">{col.header}</span>
                  <span className="text-gray-700 font-medium">
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
