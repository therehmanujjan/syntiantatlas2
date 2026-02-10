'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import clsx from 'clsx';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange?: (key: string) => void;
  paramName?: string;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  paramName = 'tab',
  className,
}: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (key: string) => {
      if (onChange) {
        onChange(key);
      } else {
        // Sync to URL query params
        const params = new URLSearchParams(searchParams.toString());
        params.set(paramName, key);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [onChange, router, pathname, searchParams, paramName],
  );

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (nextIndex !== index) {
      e.preventDefault();
      handleChange(tabs[nextIndex].key);
      // Focus the new tab
      const el = document.getElementById(`tab-${tabs[nextIndex].key}`);
      el?.focus();
    }
  };

  return (
    <div className={clsx('border-b border-gray-200', className)} role="tablist">
      <nav className="flex gap-0 -mb-px overflow-x-auto">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleChange(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150',
                isActive
                  ? 'border-dao-blue text-dao-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
                    isActive ? 'bg-dao-blue/10 text-dao-blue' : 'bg-gray-100 text-gray-500',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
