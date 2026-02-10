export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: string | null;
  kycStatus: string | null;
  kycLevel: number | null;
  walletBalance: string;
  phone: string | null;
  status: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    investments: number;
    transactions: number;
    properties: number;
  };
}

export interface Property {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  propertyType: string | null;
  areaSqft: string | null;
  totalValue: string | null;
  fundingTarget: string | null;
  fundingRaised: string | null;
  minInvestment: string | null;
  maxInvestment: string | null;
  expectedReturnsAnnual: string | null;
  rentalYield: string | null;
  status: string | null;
  sellerId: number | null;
  createdAt: string;
  images?: string[];
  completionPercentage?: number;
  seller?: { id: number; firstName: string; lastName: string; email: string };
  _count?: { investments: number };
  investorCount?: number;
}

export interface Investment {
  id: number;
  investorId: number | null;
  propertyId: number | null;
  amountInvested: string;
  sharesOwned: string | null;
  ownershipPercentage: string | null;
  investmentDate: string;
  property?: Property;
}

export interface Transaction {
  id: number;
  userId: number | null;
  type: string;
  amount: string;
  gateway: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  description: string | null;
  status: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface TransactionSummary {
  totalDeposits: string;
  totalWithdrawals: string;
  totalInvestments: string;
  totalDividends: string;
}

export interface PortfolioSummary {
  investments: (Investment & { property: Property })[];
  summary: {
    totalInvested: string;
    totalShares: string;
    propertyCount: number;
  };
}

export interface KycVerification {
  id: number;
  userId: number | null;
  kycLevel: number | null;
  documentType: string | null;
  documentData: Record<string, any> | null;
  status: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user?: { id: number; email: string; firstName: string | null; lastName: string | null; kycStatus: string | null; kycLevel: number | null };
  reviewer?: { id: number; firstName: string | null; lastName: string | null };
}

export interface KycStatus {
  kycStatus: string | null;
  kycLevel: number | null;
  submissions: KycVerification[];
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  category: string | null;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  assignedTo: number | null;
  assignedBy: number | null;
  priority: string | null;
  status: string | null;
  dueDate: string | null;
  completedAt: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  createdAt: string;
  updatedAt: string;
  assignedByUser?: { id: number; firstName: string | null; lastName: string | null; email: string };
  assignedToUser?: { id: number; firstName: string | null; lastName: string | null; email: string };
  replies?: TicketReply[];
  _count?: { replies: number };
}

export interface TicketReply {
  id: number;
  taskId: number;
  userId: number;
  message: string;
  createdAt: string;
  user?: { id: number; firstName: string | null; lastName: string | null; email: string };
}

export interface GovernanceProposal {
  id: number;
  propertyId: number;
  title: string;
  description: string;
  proposer: { id: number; firstName: string | null; lastName: string | null; email: string };
  property: { id: number; title: string };
  forVotes: number;
  againstVotes: number;
  quorum: number;
  status: string; // 'active', 'passed', 'failed', 'executed', 'cancelled'
  votingEndsAt: string;
  createdAt: string;
  hasVoted?: boolean;
  userVote?: string;
  userVoteWeight?: number;
}

export interface GovernanceVote {
  proposalId: number;
  proposal: GovernanceProposal;
  vote: string; // 'for' | 'against'
  weight: number;
  votedAt: string;
}

export interface DividendPayment {
  id: number;
  dividendId: number;
  investorId: number;
  propertyId: number;
  sharesOwned: string;
  amountPaid: string;
  status: string;
  paidAt: string;
  dividend: {
    id: number;
    propertyId: number | null;
    quarter: number | null;
    year: number | null;
    totalRentalIncome: string | null;
    totalExpenses: string | null;
    netIncome: string | null;
    distributionPerShare: string | null;
    distributionDate: string | null;
  };
  property: {
    id: number;
    title: string;
    city: string | null;
    propertyType: string | null;
  };
}

export interface DividendsSummary {
  payments: DividendPayment[];
  summary: {
    totalEarned: string;
    paymentCount: number;
  };
}

export interface UserAddress {
  id: number;
  userId: number;
  street: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: number;
  userId: number;
  bankName: string;
  accountTitle: string;
  iban: string;
  branchCode: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface MarketplaceListing {
  id: number;
  propertyId: number;
  sellerId: number;
  sharesListed: string;
  sharesRemaining: string;
  pricePerShare: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  property: {
    id: number;
    title: string;
    city: string | null;
    propertyType: string | null;
    areaSqft: string | null;
    status: string | null;
    expectedReturnsAnnual: string | null;
  };
  seller: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
  trades?: MarketplaceTrade[];
}

export interface MarketplaceTrade {
  id: number;
  listingId: number;
  propertyId: number;
  buyerId: number;
  sellerId: number;
  sharesBought: string;
  pricePerShare: string;
  totalPrice: string;
  platformFee: string;
  status: string;
  executedAt: string;
  property?: { id: number; title: string };
  buyer?: { id: number; firstName: string | null; lastName: string | null };
  seller?: { id: number; firstName: string | null; lastName: string | null };
}

export interface MarketplaceStats {
  activeListings: number;
  totalVolume: string;
  avgPrice: string;
  lowestAsk: string | null;
  totalTrades: number;
}

export interface ReferralCode {
  code: string;
  createdAt: string;
}

export interface Referral {
  id: number;
  referrerId: number;
  referredId: number;
  status: string;
  investmentAmount: string | null;
  commission: string | null;
  createdAt: string;
  referred?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface ReferralSummary {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: string;
  pendingRewards: string;
  referralCode: string;
  activity: Referral[];
}

export interface Report {
  id: number;
  userId: number;
  reportType: string;
  startDate: string;
  endDate: string;
  status: string;
  fileUrl: string | null;
  createdAt: string;
}

export interface ContentItem {
  id: number;
  title: string;
  body: string;
  excerpt: string | null;
  type: string;
  category: string;
  difficulty: string;
  readTime: number | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface ContentProgress {
  id: number;
  userId: number;
  contentItemId: number;
  completed: boolean;
  completedAt: string | null;
  lastAccessedAt: string | null;
  contentItem?: {
    id: number;
    title: string;
    category: string;
    type: string;
  };
}

export interface ContentProgressSummary {
  totalItems: number;
  completedCount: number;
  progressPercentage: number;
  items: ContentProgress[];
}

export interface ContentCategory {
  category: string;
  count: number;
}
