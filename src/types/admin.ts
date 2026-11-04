import { License, Customer, WhiteLabelSettings } from './index';

export type RBACRole = 
  | 'master_owner' 
  | 'super_admin' 
  | 'administrator' 
  | 'manager' 
  | 'employee' 
  | 'customer';

export type PermissionAction = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'export' 
  | 'approve' 
  | 'suspend' 
  | 'restore';

export type ResourceCategory = 
  | 'dashboard' 
  | 'super_admins' 
  | 'rbac' 
  | 'customers' 
  | 'licenses' 
  | 'products' 
  | 'finance' 
  | 'settings' 
  | 'security' 
  | 'backups' 
  | 'updates' 
  | 'reports' 
  | 'support' 
  | 'diagnostics' 
  | 'audit_logs';

export type RolePermissionsMatrix = Record<RBACRole, Record<ResourceCategory, PermissionAction[]>>;

export interface MasterOwnerProfile {
  id: string;
  email: string;
  name: string;
  title: string;
  phone: string;
  emergencyEmail: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  recoveryCodes: string[];
  trustedDevices: {
    deviceId: string;
    deviceName: string;
    location: string;
    ipAddress: string;
    lastActive: string;
    current: boolean;
  }[];
  lastLogin: string;
  isOwner: true;
}

export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'active' | 'suspended' | 'pending_verification';
  role: 'super_admin' | 'administrator' | 'manager';
  permissions: ResourceCategory[];
  assignedBy: string;
  createdAt: string;
  expiresAt: string;
  lastLogin: string;
  requirePasswordReset: boolean;
  notes: string;
  avatarUrl?: string;
}

export interface ProductEdition {
  id: string;
  name: string;
  tier: 'basic' | 'standard' | 'pro' | 'enterprise';
  priceMonthly: number;
  priceYearly: number;
  priceLifetime: number;
  maxDevices: number;
  features: {
    canvaEditor: boolean;
    capcutEditor: boolean;
    bulkAutomation: boolean;
    aiImageGeneration: boolean;
    aiVideoGeneration: boolean;
    aiFreshnessVault: boolean;
    export4K: boolean;
    whiteLabel: boolean;
    unlimitedTemplates: boolean;
    cloudSync: boolean;
    prioritySupport: boolean;
  };
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  version: string;
  status: 'active' | 'archived';
  editions: ProductEdition[];
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  editionName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'crypto' | 'wire' | 'manual';
  invoiceId: string;
  licenseKeyGenerated?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerAddress: string;
  items: { description: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'refunded';
  issuedDate: string;
  dueDate: string;
  paymentMethod: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface SupportTicketMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  isAdminReply: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: 'licensing' | 'technical' | 'billing' | 'feature_request' | 'desktop_exe';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessage[];
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: RBACRole;
  action: string;
  resource: ResourceCategory;
  targetId?: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  details: string;
}

export interface BackupRecord {
  id: string;
  fileName: string;
  type: 'full' | 'customers' | 'licenses' | 'finance' | 'settings';
  sizeKb: number;
  checksumSha256: string;
  createdAt: string;
  createdBy: string;
  status: 'ready' | 'restoring' | 'restored' | 'failed';
  encrypted: boolean;
  itemCounts: {
    customers: number;
    licenses: number;
    orders: number;
    superAdmins: number;
  };
}

export interface SoftwareUpdatePackage {
  id: string;
  version: string;
  releaseChannel: 'stable' | 'beta';
  releaseDate: string;
  mandatory: boolean;
  minSupportedVersion: string;
  downloadUrl: string;
  checksumSha256: string;
  fileSizeMb: number;
  changelog: string[];
  status: 'published' | 'draft' | 'rolled_back';
}

export interface SystemHealthStatus {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  memoryTotalMb: number;
  uptimeSeconds: number;
  storageUsedMb: number;
  storageTotalMb: number;
  activeConnections: number;
  databaseIntegrity: 'healthy' | 'degraded';
  apiLatencyMs: number;
  errorLogsCount: number;
  lastChecked: string;
}

export interface SecurityPolicy {
  twoFactorRequiredForAdmins: boolean;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  activeLockouts: {
    ip: string;
    email?: string;
    failedAttempts: number;
    lockedUntil: string;
  }[];
}

export type MetricsDateRange = 'today' | '7d' | '30d' | '90d' | 'this_year' | 'all';

export interface SubscriptionPlan {
  id: string;
  name: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  currentPrice: number;
  previousPrice?: number;
  currency: string;
  effectiveDate: string;
  version: number;
  status: 'active' | 'archived';
  description: string;
  gracePeriodDays: number;
  tier: 'starter' | 'pro' | 'enterprise';
}

export interface CustomerSubscription {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  agreedPrice: number; // Protected agreed price (Grandfathered / Price Locked)
  currentStandardPrice: number; // Latest standard public price
  isPriceLocked: boolean; // True if price lock active
  priceLockType: 'lifetime' | '1_year' | 'grandfathered' | 'none';
  priceLockExpiresAt?: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  status: 'active' | 'renewing' | 'cancelled' | 'expired';
  autoRenew: boolean;
  startDate: string;
  renewalDate: string;
  currency: string;
}

export interface PricingHistoryRecord {
  id: string;
  planId: string;
  planName: string;
  previousPrice: number;
  newPrice: number;
  currency: string;
  effectiveDate: string;
  changedBy: string;
  reason: string;
  approvedByOwner: boolean;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'rejected' | 'refunded';
  gateway: 'stripe' | 'paypal' | 'wire' | 'jazzcash' | 'easypaisa' | 'manual';
  transactionRef: string;
  proofUrl?: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  code: string;
  discountPercent: number;
  targetGroup: string;
  clicks: number;
  conversions: number;
  revenueGenerated: number;
  status: 'active' | 'ended';
  validUntil: string;
}

export interface NotificationBroadcast {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all_customers' | 'active_subscribers' | 'trial_users' | 'super_admins';
  priority: 'normal' | 'high' | 'urgent';
  sentAt: string;
  readCount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'manager' | 'employee';
  permissions: ResourceCategory[];
  assignedBy: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin: string;
  notes?: string;
}

