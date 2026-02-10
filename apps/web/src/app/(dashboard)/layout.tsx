'use client';

import { FiHome, FiGrid, FiPieChart, FiCreditCard, FiList, FiShield, FiMessageSquare, FiUsers, FiSettings, FiTrendingUp, FiDollarSign, FiShoppingBag, FiFileText, FiShare2, FiBook, FiGift, FiCpu, FiSliders } from 'react-icons/fi';
import { AuthGuard } from '@/components/features/auth/auth-guard';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { NavItem } from '@/components/layout/dashboard-layout';

const investorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <FiHome /> },
  { label: 'Properties', href: '/properties', icon: <FiGrid /> },
  // My DAO group
  { label: 'Portfolio', href: '/portfolio', icon: <FiPieChart />, group: 'My DAO' },
  { label: 'Active Investments', href: '/active-investments', icon: <FiTrendingUp />, group: 'My DAO' },
  { label: 'Income Streams', href: '/income', icon: <FiDollarSign />, group: 'My DAO' },
  // Standalone items
  { label: 'Marketplace', href: '/marketplace', icon: <FiShoppingBag />, badge: 'Beta' },
  { label: 'Wallet', href: '/wallet', icon: <FiCreditCard /> },
  { label: 'Transactions', href: '/transactions', icon: <FiList /> },
  { label: 'Referrals', href: '/referrals', icon: <FiShare2 /> },
  { label: 'E-Reports', href: '/reports', icon: <FiFileText /> },
  { label: 'Learn', href: '/learn', icon: <FiBook /> },
  { label: 'Rewards Shop', href: '/rewards-shop', icon: <FiGift /> },
  { label: 'KYC', href: '/kyc', icon: <FiShield /> },
  { label: 'Support', href: '/tickets', icon: <FiMessageSquare /> },
  { label: 'Governance', href: '/governance', icon: <FiUsers /> },
  // Tools group
  { label: 'DAO Bot', href: 'https://dao-bot.syntiantatlas.com', icon: <FiCpu />, external: true, group: 'Tools' },
  { label: 'Calculators', href: 'https://calculators.syntiantatlas.com', icon: <FiSliders />, external: true, group: 'Tools' },
  // Settings at bottom
  { label: 'Settings', href: '/settings', icon: <FiSettings /> },
];

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout navItems={investorNavItems}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
