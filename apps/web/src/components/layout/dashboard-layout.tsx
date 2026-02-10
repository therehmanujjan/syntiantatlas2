'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiSettings,
  FiArrowLeft,
  FiHome,
  FiExternalLink,
  FiMenu,
  FiX,
  FiCalendar,
  FiShoppingCart,
} from 'react-icons/fi';
import { useAuth } from '@/hooks/use-auth';
import { NotificationBell } from '@/components/features/notifications/notification-bell';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
  badge?: string;
  group?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

const APP_VERSION = '2.0.0';

// ── Breadcrumb helpers ──
const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  portfolio: 'Portfolio',
  'active-investments': 'Active Investments',
  income: 'Income Streams',
  marketplace: 'Marketplace',
  wallet: 'Wallet',
  transactions: 'Transactions',
  referrals: 'Referrals',
  reports: 'E-Reports',
  learn: 'Learn',
  'rewards-shop': 'Rewards Shop',
  kyc: 'KYC',
  tickets: 'Support',
  governance: 'Governance',
  settings: 'Settings',
  admin: 'Admin',
  seller: 'Seller',
  staff: 'Staff',
  users: 'Users',
  edit: 'Edit',
  new: 'New',
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = '';
  for (const seg of segments) {
    path += '/' + seg;
    // Skip numeric IDs — show as "Detail" or skip
    if (/^\d+$/.test(seg)) {
      crumbs.push({ label: '#' + seg, href: path });
    } else {
      const label =
        BREADCRUMB_LABELS[seg] ??
        seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      crumbs.push({ label, href: path });
    }
  }
  return crumbs;
}

// ── Sidebar Nav Item Renderer ──
function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    !item.external && (pathname === item.href || pathname.startsWith(item.href + '/'));

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-150"
        title={collapsed ? item.label : undefined}
      >
        <span className="text-lg shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            <FiExternalLink className="ml-auto text-xs text-gray-400 shrink-0" />
          </>
        )}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
        isActive
          ? 'bg-dao-blue/10 text-dao-blue font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      title={collapsed ? item.label : undefined}
    >
      <span className="text-lg shrink-0">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-dao-lime text-dao-dark px-1.5 py-0.5 rounded-full shrink-0">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

// ── Expandable Section Group ──
function SidebarGroup({
  label,
  items,
  pathname,
  collapsed,
  isOpen,
  onToggle,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasActiveChild = items.some(
    (item) =>
      !item.external && (pathname === item.href || pathname.startsWith(item.href + '/'))
  );

  if (collapsed) {
    // When collapsed, show items directly (no group header)
    return (
      <>
        {items.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} collapsed />
        ))}
      </>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 ${
          hasActiveChild ? 'text-dao-blue' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <span className="truncate">{label}</span>
        <FiChevronDown
          className={`ml-auto text-sm shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>
      {isOpen && (
        <div className="mt-0.5 space-y-0.5 pl-1">
          {items.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, getDashboardPath } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group expand/collapse state — persisted in localStorage
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidebar-groups');
      if (stored) setExpandedGroups(JSON.parse(stored));
      else setExpandedGroups({ 'My DAO': true, Tools: true });
    } catch {
      setExpandedGroups({ 'My DAO': true, Tools: true });
    }
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      try {
        localStorage.setItem('sidebar-groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Organize nav items into groups and standalone items
  const navStructure: { type: 'item' | 'group'; label?: string; item?: NavItem; items?: NavItem[] }[] = [];
  const seen = new Set<string>();

  // First pass: identify groups
  const groups = new Map<string, NavItem[]>();
  for (const item of navItems) {
    if (item.group) {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)!.push(item);
    }
  }

  // Build ordered structure
  for (const item of navItems) {
    if (item.group) {
      if (!seen.has(item.group)) {
        seen.add(item.group);
        navStructure.push({ type: 'group', label: item.group, items: groups.get(item.group) });
      }
    } else {
      navStructure.push({ type: 'item', item });
    }
  }

  // Derive page title
  const flatItems = navItems.filter((i) => !i.external);
  const currentNav = flatItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );
  const pageTitle =
    currentNav?.label ??
    pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) ??
    'Dashboard';

  const breadcrumbs = getBreadcrumbs(pathname);

  const initials =
    `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U';

  const walletBalance = user?.walletBalance ?? 0;

  const dashboardRoot = getDashboardPath(user?.roleId);
  const isSubPage = pathname !== dashboardRoot && !navItems.some((item) => !item.external && item.href === pathname);

  const settingsPath = (() => {
    const roleId = user?.roleId;
    if (roleId === 'seller') return '/seller/settings';
    if (roleId === 'admin' || roleId === 'operations_manager') return '/admin/account';
    if (roleId === 'staff') return '/staff/settings';
    return '/settings';
  })();

  // Sidebar content (shared between desktop & mobile)
  const sidebarContent = (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center px-4 h-16 border-b border-gray-100 shrink-0">
        <Image
          src="/assets/syntiant-atlas-logo.png"
          alt="Syntiant Atlas"
          width={collapsed && !mobileOpen ? 40 : 150}
          height={40}
          className="shrink-0 object-contain"
        />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navStructure.map((entry, i) => {
          if (entry.type === 'group' && entry.label && entry.items) {
            return (
              <SidebarGroup
                key={entry.label}
                label={entry.label}
                items={entry.items}
                pathname={pathname}
                collapsed={collapsed && !mobileOpen}
                isOpen={expandedGroups[entry.label] ?? true}
                onToggle={() => toggleGroup(entry.label!)}
              />
            );
          }
          if (entry.item) {
            return (
              <SidebarLink
                key={entry.item.href}
                item={entry.item}
                pathname={pathname}
                collapsed={collapsed && !mobileOpen}
              />
            );
          }
          return null;
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100">
        {/* Collapse Toggle (desktop only) */}
        <div className="hidden lg:block px-3 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors duration-150"
          >
            {collapsed ? (
              <FiChevronRight className="text-lg" />
            ) : (
              <>
                <FiChevronLeft className="text-lg" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Copyright */}
        {!(collapsed && !mobileOpen) && (
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-gray-300 leading-relaxed">
              Powered by Syntiant Atlas
            </p>
            <p className="text-[9px] text-gray-300">
              v{APP_VERSION}
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop) ── */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-30 hidden lg:flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Sidebar (Mobile) ── */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-50 flex lg:hidden flex-col w-[280px] transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 z-10"
        >
          <FiX className="text-lg" />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main Area ── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            >
              <FiMenu className="text-xl" />
            </button>

            {/* Back Button */}
            {isSubPage && (
              <button
                onClick={() => router.back()}
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                title="Go back"
              >
                <FiArrowLeft className="text-lg" />
              </button>
            )}

            {/* Breadcrumbs (desktop) / Title (mobile) */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
              <Link
                href={dashboardRoot}
                className="text-gray-400 hover:text-dao-blue transition-colors shrink-0"
              >
                <FiHome className="text-base" />
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                  <span className="text-gray-300">/</span>
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-dao-dark truncate">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-dao-blue transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </div>
            <h1 className="sm:hidden text-base font-semibold text-dao-dark truncate">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Book a Meeting */}
            <a
              href="https://calendly.com/syntiantatlas"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-dao-blue px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiCalendar className="text-sm" />
              Book a Meeting
            </a>

            {/* Wallet Balance Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-dao-blue/10 text-dao-blue text-sm font-medium px-3 py-1.5 rounded-full">
              <span>PKR</span>
              <span>{Number(walletBalance).toLocaleString()}</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="w-9 h-9 rounded-full bg-dao-blue flex items-center justify-center text-white text-sm font-medium hover:bg-dao-blue-dark transition-colors"
              >
                {initials}
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-dao-dark truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      ID: {user?.id ?? '—'}
                    </p>
                  </div>

                  <Link
                    href="/active-investments"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiShoppingCart className="text-base text-gray-400" />
                    Active Purchases
                  </Link>
                  <Link
                    href={settingsPath}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiUser className="text-base text-gray-400" />
                    Account Settings
                  </Link>
                  <Link
                    href={settingsPath}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiSettings className="text-base text-gray-400" />
                    Settings
                  </Link>

                  <div className="border-t border-gray-100 mt-1" />

                  <button
                    onClick={() => {
                      setAvatarOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut className="text-base" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
