import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  User,
  Property,
  PaginatedResponse,
  PortfolioSummary,
  Transaction,
  TransactionSummary,
  KycVerification,
  KycStatus,
  Notification,
  SystemSetting,
  Ticket,
  TicketReply,
  GovernanceProposal,
  GovernanceVote,
  DividendsSummary,
  UserAddress,
  BankAccount,
  MarketplaceListing,
  MarketplaceTrade,
  MarketplaceStats,
  ReferralSummary,
  Report,
  ContentItem,
  ContentCategory,
  ContentProgressSummary,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(this.addAuthToken);
    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (!path.startsWith('/login') && !path.startsWith('/register')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private addAuthToken(config: InternalAxiosRequestConfig) {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  }

  private unwrap<T>(response: { data: ApiResponse<T> }): T {
    return response.data.data;
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return this.unwrap(res);
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string;
  }) {
    const res = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    return this.unwrap(res);
  }

  async me() {
    const res = await this.client.get<ApiResponse<User>>('/auth/me');
    return this.unwrap(res);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await this.client.post<ApiResponse<{ message: string }>>('/auth/change-password', data);
    return this.unwrap(res);
  }

  // Users
  async getProfile() {
    const res = await this.client.get<ApiResponse<User>>('/users/profile');
    return this.unwrap(res);
  }

  async updateProfile(data: { firstName?: string; lastName?: string; phone?: string }) {
    const res = await this.client.put<ApiResponse<User>>('/users/profile', data);
    return this.unwrap(res);
  }

  async getWallet() {
    const res = await this.client.get<ApiResponse<{ balance: string; recentTransactions: Transaction[] }>>('/users/wallet');
    return this.unwrap(res);
  }

  // Properties
  async getProperties(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<PaginatedResponse<Property>>>('/properties', { params });
    return this.unwrap(res);
  }

  async getProperty(id: number) {
    const res = await this.client.get<ApiResponse<Property>>(`/properties/${id}`);
    return this.unwrap(res);
  }

  async createProperty(data: Partial<Property>) {
    const res = await this.client.post<ApiResponse<Property>>('/properties', data);
    return this.unwrap(res);
  }

  async getSellerProperties() {
    const res = await this.client.get<ApiResponse<Property[]>>('/properties/seller/my-properties');
    return this.unwrap(res);
  }

  async updateProperty(id: number, data: Partial<Property>) {
    const res = await this.client.put<ApiResponse<Property>>(`/properties/${id}`, data);
    return this.unwrap(res);
  }

  async deleteProperty(id: number) {
    const res = await this.client.delete<ApiResponse<{ message: string }>>(`/properties/${id}`);
    return this.unwrap(res);
  }

  // Investments
  async invest(data: { propertyId: number; amount: number }) {
    const res = await this.client.post<ApiResponse<any>>('/investments', data);
    return this.unwrap(res);
  }

  async getPortfolio() {
    const res = await this.client.get<ApiResponse<PortfolioSummary>>('/investments/portfolio');
    return this.unwrap(res);
  }

  // Transactions
  async deposit(data: { amount: number; paymentMethod?: string }) {
    const res = await this.client.post<ApiResponse<Transaction>>('/transactions/deposit', data);
    return this.unwrap(res);
  }

  async withdraw(data: { amount: number; paymentMethod?: string }) {
    const res = await this.client.post<ApiResponse<Transaction>>('/transactions/withdraw', data);
    return this.unwrap(res);
  }

  async getTransactions(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<{ data: Transaction[]; summary: TransactionSummary; pagination: any }>>('/transactions/history', { params });
    return this.unwrap(res);
  }

  // Admin
  async getUsers(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<PaginatedResponse<User>>>('/admin/users', { params });
    return this.unwrap(res);
  }

  async getUser(id: number) {
    const res = await this.client.get<ApiResponse<User>>(`/admin/users/${id}`);
    return this.unwrap(res);
  }

  async createStaff(data: { email: string; firstName: string; lastName: string; roleId: string }) {
    const res = await this.client.post<ApiResponse<User & { employeeId: string; temporaryPassword: string }>>('/admin/users/staff', data);
    return this.unwrap(res);
  }

  async updateUser(id: number, data: { firstName?: string; lastName?: string; phone?: string; roleId?: string }) {
    const res = await this.client.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    return this.unwrap(res);
  }

  async suspendUser(id: number, data?: { reason?: string }) {
    const res = await this.client.put<ApiResponse<User>>(`/admin/users/${id}/suspend`, data || {});
    return this.unwrap(res);
  }

  async unsuspendUser(id: number) {
    const res = await this.client.put<ApiResponse<User>>(`/admin/users/${id}/unsuspend`);
    return this.unwrap(res);
  }

  async deactivateUser(id: number) {
    const res = await this.client.delete<ApiResponse<User>>(`/admin/users/${id}`);
    return this.unwrap(res);
  }

  async getPendingProperties() {
    const res = await this.client.get<ApiResponse<Property[]>>('/admin/properties/pending');
    return this.unwrap(res);
  }

  async updatePropertyStatus(id: number, data: { status: string; reason?: string }) {
    const res = await this.client.put<ApiResponse<Property>>(`/admin/properties/${id}/status`, data);
    return this.unwrap(res);
  }

  // KYC
  async submitKyc(data: { kycLevel: number; documentType: string; documentData?: Record<string, any> }) {
    const res = await this.client.post<ApiResponse<KycVerification>>('/kyc/submit', data);
    return this.unwrap(res);
  }

  async getKycStatus() {
    const res = await this.client.get<ApiResponse<KycStatus>>('/kyc/status');
    return this.unwrap(res);
  }

  async getKycSubmissions(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<PaginatedResponse<KycVerification>>>('/admin/kyc', { params });
    return this.unwrap(res);
  }

  async getKycSubmission(id: number) {
    const res = await this.client.get<ApiResponse<KycVerification>>(`/admin/kyc/${id}`);
    return this.unwrap(res);
  }

  async reviewKyc(id: number, data: { status: string; rejectionReason?: string }) {
    const res = await this.client.put<ApiResponse<KycVerification>>(`/admin/kyc/${id}/review`, data);
    return this.unwrap(res);
  }

  // Notifications
  async getNotifications(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params });
    return this.unwrap(res);
  }

  async getUnreadNotificationCount() {
    const res = await this.client.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return this.unwrap(res);
  }

  async markNotificationRead(id: number) {
    const res = await this.client.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return this.unwrap(res);
  }

  async markAllNotificationsRead() {
    const res = await this.client.put<ApiResponse<{ updated: number }>>('/notifications/read-all');
    return this.unwrap(res);
  }

  // System Settings
  async getSettings(category?: string) {
    const params = category ? { category } : undefined;
    const res = await this.client.get<ApiResponse<SystemSetting[]>>('/admin/settings', { params });
    return this.unwrap(res);
  }

  async getSetting(key: string) {
    const res = await this.client.get<ApiResponse<SystemSetting>>(`/admin/settings/${key}`);
    return this.unwrap(res);
  }

  async updateSetting(key: string, data: { value: string; description?: string }) {
    const res = await this.client.put<ApiResponse<SystemSetting>>(`/admin/settings/${key}`, data);
    return this.unwrap(res);
  }

  async createSetting(data: { key: string; value: string; description?: string; category?: string }) {
    const res = await this.client.post<ApiResponse<SystemSetting>>('/admin/settings', data);
    return this.unwrap(res);
  }

  async deleteSetting(key: string) {
    const res = await this.client.delete<ApiResponse<SystemSetting>>(`/admin/settings/${key}`);
    return this.unwrap(res);
  }

  // Support Tickets
  async createTicket(data: { title: string; description?: string; priority?: string }) {
    const res = await this.client.post<ApiResponse<Ticket>>('/tickets', data);
    return this.unwrap(res);
  }

  async getTickets(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<PaginatedResponse<Ticket>>>('/tickets', { params });
    return this.unwrap(res);
  }

  async getTicket(id: number) {
    const res = await this.client.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return this.unwrap(res);
  }

  async replyToTicket(id: number, data: { message: string }) {
    const res = await this.client.post<ApiResponse<TicketReply>>(`/tickets/${id}/reply`, data);
    return this.unwrap(res);
  }

  // Admin Tickets
  async getAdminTickets(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<PaginatedResponse<Ticket>>>('/admin/tickets', { params });
    return this.unwrap(res);
  }

  async getAdminTicket(id: number) {
    const res = await this.client.get<ApiResponse<Ticket>>(`/admin/tickets/${id}`);
    return this.unwrap(res);
  }

  async updateTicket(id: number, data: { status?: string; priority?: string; assignedTo?: number }) {
    const res = await this.client.put<ApiResponse<Ticket>>(`/admin/tickets/${id}`, data);
    return this.unwrap(res);
  }

  async adminReplyToTicket(id: number, data: { message: string }) {
    const res = await this.client.post<ApiResponse<TicketReply>>(`/admin/tickets/${id}/reply`, data);
    return this.unwrap(res);
  }

  async closeTicket(id: number) {
    const res = await this.client.put<ApiResponse<Ticket>>(`/admin/tickets/${id}/close`);
    return this.unwrap(res);
  }

  // Governance
  async getGovernanceProposals(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<GovernanceProposal[]>>('/governance/proposals', { params });
    return this.unwrap(res);
  }

  async getGovernanceProposal(id: number) {
    const res = await this.client.get<ApiResponse<GovernanceProposal>>(`/governance/proposals/${id}`);
    return this.unwrap(res);
  }

  async getMyGovernanceVotes() {
    const res = await this.client.get<ApiResponse<GovernanceVote[]>>('/governance/votes/me');
    return this.unwrap(res);
  }

  async createGovernanceProposal(data: { propertyId: number; title: string; description: string }) {
    const res = await this.client.post<ApiResponse<GovernanceProposal>>('/governance/proposals', data);
    return this.unwrap(res);
  }

  async castGovernanceVote(proposalId: number, data: { vote: string }) {
    const res = await this.client.post<ApiResponse<any>>(`/governance/proposals/${proposalId}/vote`, data);
    return this.unwrap(res);
  }

  async executeProposal(proposalId: number) {
    const res = await this.client.post<ApiResponse<any>>(`/governance/proposals/${proposalId}/execute`);
    return this.unwrap(res);
  }

  async cancelProposal(proposalId: number) {
    const res = await this.client.post<ApiResponse<any>>(`/governance/proposals/${proposalId}/cancel`);
    return this.unwrap(res);
  }

  // IPFS
  async getIpfsDocuments(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<any[]>>('/ipfs/documents', { params });
    return this.unwrap(res);
  }

  // Compliance (Admin)
  async generateComplianceReport(data: { reportType: string; startDate: string; endDate: string; propertyId?: number; investorId?: number }) {
    const res = await this.client.post<ApiResponse<any>>('/compliance/reports/generate', data);
    return this.unwrap(res);
  }

  async getQuarterlyReport(params: { quarter: number; year: number }) {
    const res = await this.client.get<ApiResponse<any>>('/compliance/reports/quarterly', { params });
    return this.unwrap(res);
  }

  // AML (Admin)
  async getAmlAlerts(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<any[]>>('/aml/alerts', { params });
    return this.unwrap(res);
  }

  async getAmlDashboard() {
    const res = await this.client.get<ApiResponse<any>>('/aml/dashboard');
    return this.unwrap(res);
  }

  async reviewAmlAlert(id: number, data: { status: string; notes: string }) {
    const res = await this.client.put<ApiResponse<any>>(`/aml/alerts/${id}/review`, data);
    return this.unwrap(res);
  }

  // Audit Export (Admin)
  async exportAuditLogs(data: { format: string; startDate?: string; endDate?: string; userId?: number; action?: string; entityType?: string }) {
    const res = await this.client.post('/audit-export', data, { responseType: 'blob' });
    return res.data;
  }

  async getAuditExportSummary(params?: Record<string, string>) {
    const res = await this.client.get<ApiResponse<any>>('/audit-export/summary', { params });
    return this.unwrap(res);
  }

  // Dividends (Investor)
  async getMyDividends() {
    const res = await this.client.get<ApiResponse<DividendsSummary>>('/api/dividends/investor/me');
    return this.unwrap(res);
  }

  // User Addresses
  async getAddresses() {
    const res = await this.client.get<ApiResponse<UserAddress[]>>('/users/addresses');
    return this.unwrap(res);
  }

  async createAddress(data: { street: string; city: string; state?: string; postalCode?: string; country: string; isDefault?: boolean }) {
    const res = await this.client.post<ApiResponse<UserAddress>>('/users/addresses', data);
    return this.unwrap(res);
  }

  async updateAddress(id: number, data: Partial<{ street: string; city: string; state: string; postalCode: string; country: string; isDefault: boolean }>) {
    const res = await this.client.put<ApiResponse<UserAddress>>(`/users/addresses/${id}`, data);
    return this.unwrap(res);
  }

  async deleteAddress(id: number) {
    const res = await this.client.delete<ApiResponse<{ message: string }>>(`/users/addresses/${id}`);
    return this.unwrap(res);
  }

  // Bank Accounts
  async getBankAccounts() {
    const res = await this.client.get<ApiResponse<BankAccount[]>>('/users/bank-accounts');
    return this.unwrap(res);
  }

  async createBankAccount(data: { bankName: string; accountTitle: string; iban: string; branchCode?: string; isDefault?: boolean }) {
    const res = await this.client.post<ApiResponse<BankAccount>>('/users/bank-accounts', data);
    return this.unwrap(res);
  }

  async updateBankAccount(id: number, data: Partial<{ bankName: string; accountTitle: string; iban: string; branchCode: string; isDefault: boolean }>) {
    const res = await this.client.put<ApiResponse<BankAccount>>(`/users/bank-accounts/${id}`, data);
    return this.unwrap(res);
  }

  async deleteBankAccount(id: number) {
    const res = await this.client.delete<ApiResponse<{ message: string }>>(`/users/bank-accounts/${id}`);
    return this.unwrap(res);
  }

  // Legal Info
  async updateLegalInfo(data: { cnic?: string; isTaxFiler?: boolean; cnicFrontUrl?: string; cnicBackUrl?: string }) {
    const res = await this.client.put<ApiResponse<User>>('/users/legal-info', data);
    return this.unwrap(res);
  }

  // Notification Preferences
  async getNotificationPreferences() {
    const res = await this.client.get<ApiResponse<{ pushEnabled: boolean; smsEnabled: boolean; emailDigest: string }>>('/users/notification-preferences');
    return this.unwrap(res);
  }

  async updateNotificationPreferences(data: { pushEnabled?: boolean; smsEnabled?: boolean; emailDigest?: string }) {
    const res = await this.client.put<ApiResponse<{ pushEnabled: boolean; smsEnabled: boolean; emailDigest: string }>>('/users/notification-preferences', data);
    return this.unwrap(res);
  }

  // Wallet Info (for settings page)
  async getWalletInfo() {
    const res = await this.client.get<ApiResponse<{ walletAddress: string | null; balance: string }>>('/users/wallet-info');
    return this.unwrap(res);
  }

  // Transaction Export
  async exportTransactions(params: { format: string; type?: string; status?: string; startDate?: string; endDate?: string }) {
    const res = await this.client.get('/transactions/export', { params, responseType: 'blob' });
    return res.data;
  }

  // Marketplace
  async getMarketplaceListings(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<{ data: MarketplaceListing[]; pagination: any }>>('/marketplace/listings', { params });
    return this.unwrap(res);
  }

  async getMarketplaceListing(id: number) {
    const res = await this.client.get<ApiResponse<MarketplaceListing>>(`/marketplace/listings/${id}`);
    return this.unwrap(res);
  }

  async createMarketplaceListing(data: { propertyId: number; shares: number; pricePerShare: number; expiresAt?: string }) {
    const res = await this.client.post<ApiResponse<MarketplaceListing>>('/marketplace/listings', data);
    return this.unwrap(res);
  }

  async cancelMarketplaceListing(id: number) {
    const res = await this.client.delete<ApiResponse<{ message: string }>>(`/marketplace/listings/${id}`);
    return this.unwrap(res);
  }

  async buyMarketplaceShares(data: { listingId: number; shares: number }) {
    const res = await this.client.post<ApiResponse<MarketplaceTrade>>('/marketplace/buy', data);
    return this.unwrap(res);
  }

  async getMyMarketplaceListings() {
    const res = await this.client.get<ApiResponse<MarketplaceListing[]>>('/marketplace/my/listings');
    return this.unwrap(res);
  }

  async getMyMarketplaceTrades() {
    const res = await this.client.get<ApiResponse<MarketplaceTrade[]>>('/marketplace/my/trades');
    return this.unwrap(res);
  }

  async getMarketplaceStats(propertyId: number) {
    const res = await this.client.get<ApiResponse<MarketplaceStats>>(`/marketplace/stats/${propertyId}`);
    return this.unwrap(res);
  }

  // Reports
  async generateReport(data: { reportType: string; startDate: string; endDate: string; propertyId?: number }) {
    const res = await this.client.post<ApiResponse<Report>>('/compliance/reports/generate', data);
    return this.unwrap(res);
  }

  async getReportHistory(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<Report[]>>('/compliance/reports/history', { params });
    return this.unwrap(res);
  }

  async downloadReport(id: number) {
    const res = await this.client.get(`/compliance/reports/${id}/download`, { responseType: 'blob' });
    return res.data;
  }

  // Referrals
  async getReferralSummary() {
    const res = await this.client.get<ApiResponse<ReferralSummary>>('/referrals/summary');
    return this.unwrap(res);
  }

  async getReferralCode() {
    const res = await this.client.get<ApiResponse<{ code: string }>>('/referrals/code');
    return this.unwrap(res);
  }

  async getReferralActivity() {
    const res = await this.client.get<ApiResponse<any[]>>('/referrals/activity');
    return this.unwrap(res);
  }

  async getReferralEarnings() {
    const res = await this.client.get<ApiResponse<any[]>>('/referrals/earnings');
    return this.unwrap(res);
  }

  // Content / Learn
  async getContentItems(params?: Record<string, string | number>) {
    const res = await this.client.get<ApiResponse<{ data: ContentItem[]; pagination: any }>>('/content', { params });
    return this.unwrap(res);
  }

  async getContentItem(id: number) {
    const res = await this.client.get<ApiResponse<ContentItem>>(`/content/${id}`);
    return this.unwrap(res);
  }

  async getContentCategories() {
    const res = await this.client.get<ApiResponse<ContentCategory[]>>('/content/categories');
    return this.unwrap(res);
  }

  async getMyContentProgress() {
    const res = await this.client.get<ApiResponse<ContentProgressSummary>>('/content/me/progress');
    return this.unwrap(res);
  }

  async markContentComplete(id: number) {
    const res = await this.client.post<ApiResponse<any>>(`/content/${id}/complete`);
    return this.unwrap(res);
  }
}

export const api = new ApiClient();
