import { 
  RBACRole, 
  ResourceCategory, 
  PermissionAction, 
  RolePermissionsMatrix, 
  MasterOwnerProfile, 
  SuperAdmin,
  Order,
  MetricsDateRange
} from '../types';

export const MASTER_OWNER_EMAIL = 'josnking01@gmail.com';
export const MASTER_OWNER_ID = 'owner_josnking01';

export const INITIAL_MASTER_OWNER: MasterOwnerProfile = {
  id: MASTER_OWNER_ID,
  email: MASTER_OWNER_EMAIL,
  name: 'Master Owner & Principal Architect',
  title: 'Chief Technology Officer & Ultimate Authority',
  phone: '+1 (800) 555-0199',
  emergencyEmail: 'owner-emergency@omnicut-vault.io',
  twoFactorEnabled: true,
  twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Base32 TOTP standard secret
  recoveryCodes: [
    'A9F2-48D1-C7B3',
    '8B14-9E32-0F67',
    '3D71-2B88-4A91',
    'E5C2-91A4-7D39',
    '22F8-B01C-6E43',
    '99D1-33A7-1F82',
    '77C4-55E9-8B01',
    '44A2-66D0-2C99',
  ],
  trustedDevices: [
    {
      deviceId: 'dev_owner_primary',
      deviceName: 'Master Owner Workstation (Win11 Pro x64)',
      location: 'Corporate HQ - SecOps Private Net',
      ipAddress: '192.168.1.100',
      lastActive: new Date().toISOString(),
      current: true,
    },
    {
      deviceId: 'dev_owner_secure_laptop',
      deviceName: 'Executive ThinkPad X1 Carbon',
      location: 'Authorized Mobile Command',
      ipAddress: '10.0.8.42',
      lastActive: new Date(Date.now() - 3600000 * 5).toISOString(),
      current: false,
    },
  ],
  lastLogin: new Date().toISOString(),
  isOwner: true,
};

export const ALL_RESOURCES: ResourceCategory[] = [
  'dashboard',
  'super_admins',
  'rbac',
  'customers',
  'licenses',
  'products',
  'finance',
  'settings',
  'security',
  'backups',
  'updates',
  'reports',
  'support',
  'diagnostics',
  'audit_logs',
];

export const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'approve',
  'suspend',
  'restore',
];

export const DEFAULT_RBAC_MATRIX: RolePermissionsMatrix = {
  master_owner: {
    dashboard: ['view', 'export'],
    super_admins: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    rbac: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    customers: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    licenses: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    products: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    finance: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    settings: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    security: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    backups: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    updates: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    reports: ['view', 'create', 'edit', 'delete', 'export'],
    support: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    diagnostics: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'suspend', 'restore'],
    audit_logs: ['view', 'export'],
  },
  super_admin: {
    dashboard: ['view', 'export'],
    super_admins: ['view'], // Super Admin can view other super admins, but CANNOT delete or demote Master Owner
    rbac: ['view'],
    customers: ['view', 'create', 'edit', 'export', 'suspend', 'restore'],
    licenses: ['view', 'create', 'edit', 'export', 'suspend', 'restore'],
    products: ['view', 'edit', 'export'],
    finance: ['view', 'export'],
    settings: ['view', 'edit'],
    security: ['view'],
    backups: ['view', 'create', 'export'],
    updates: ['view', 'create'],
    reports: ['view', 'export'],
    support: ['view', 'create', 'edit', 'approve', 'suspend', 'restore'],
    diagnostics: ['view'],
    audit_logs: ['view'],
  },
  administrator: {
    dashboard: ['view'],
    super_admins: [],
    rbac: [],
    customers: ['view', 'create', 'edit', 'export'],
    licenses: ['view', 'create', 'edit', 'export'],
    products: ['view'],
    finance: ['view'],
    settings: ['view'],
    security: [],
    backups: ['view'],
    updates: ['view'],
    reports: ['view', 'export'],
    support: ['view', 'edit'],
    diagnostics: ['view'],
    audit_logs: [],
  },
  manager: {
    dashboard: ['view'],
    super_admins: [],
    rbac: [],
    customers: ['view', 'create', 'edit'],
    licenses: ['view', 'create'],
    products: ['view'],
    finance: ['view'],
    settings: [],
    security: [],
    backups: [],
    updates: [],
    reports: ['view'],
    support: ['view', 'edit'],
    diagnostics: [],
    audit_logs: [],
  },
  employee: {
    dashboard: ['view'],
    super_admins: [],
    rbac: [],
    customers: ['view'],
    licenses: ['view'],
    products: ['view'],
    finance: [],
    settings: [],
    security: [],
    backups: [],
    updates: [],
    reports: [],
    support: ['view', 'edit'],
    diagnostics: [],
    audit_logs: [],
  },
  customer: {
    dashboard: ['view'],
    super_admins: [],
    rbac: [],
    customers: [],
    licenses: ['view'],
    products: ['view'],
    finance: [],
    settings: [],
    security: [],
    backups: [],
    updates: ['view'],
    reports: [],
    support: ['view', 'create'],
    diagnostics: [],
    audit_logs: [],
  },
};

/**
 * Validates whether an actor has permission to perform an action on a resource.
 */
export function hasPermission(
  role: RBACRole,
  resource: ResourceCategory,
  action: PermissionAction,
  matrix: RolePermissionsMatrix = DEFAULT_RBAC_MATRIX
): boolean {
  if (role === 'master_owner') return true;
  const resourcePerms = matrix[role]?.[resource] || [];
  return resourcePerms.includes(action);
}

/**
 * Master Owner Protection Guard:
 * Strictly prevents Super Admins, Administrators, or anyone else from deleting,
 * demoting, altering credentials, or disabling security of the Master Owner account.
 */
export function checkOwnerProtection(
  actor: { id: string; email: string; role: RBACRole },
  target: { id?: string; email?: string; isOwner?: boolean },
  operation: 'delete' | 'suspend' | 'change_password' | 'disable_2fa' | 'demote' | 'revoke_session'
): { allowed: boolean; reason?: string } {
  const isTargetMasterOwner = 
    target.isOwner === true || 
    target.id === MASTER_OWNER_ID || 
    target.email?.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase();

  if (!isTargetMasterOwner) {
    return { allowed: true };
  }

  // Target IS Master Owner
  const isActorMasterOwner = 
    actor.role === 'master_owner' && 
    (actor.id === MASTER_OWNER_ID || actor.email?.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase());

  if (!isActorMasterOwner) {
    return {
      allowed: false,
      reason: `SECURITY VIOLATION: Role '${actor.role}' is not authorized to ${operation.replace('_', ' ')} the Master Owner account (${MASTER_OWNER_EMAIL}). The Master Owner account is immutable by subordinates.`,
    };
  }

  // Master Owner cannot delete themselves
  if (operation === 'delete' || operation === 'demote') {
    return {
      allowed: false,
      reason: 'The Master Owner account cannot be deleted or demoted. Ownership transfer requires formal transfer protocol.',
    };
  }

  return { allowed: true };
}

/**
 * Filter orders and calculate financial statistics based on selected date range.
 */
export function calculateFinancialMetrics(
  orders: Order[],
  range: MetricsDateRange,
  now: number = Date.now()
): {
  grossRevenue: number;
  netRevenue: number;
  refundsTotal: number;
  completedOrdersCount: number;
  avgOrderValue: number;
  mrr: number;
  arr: number;
} {
  const dayMs = 86400000;
  let cutoffTimestamp = 0;

  if (range === 'today') {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    cutoffTimestamp = today.getTime();
  } else if (range === '7d') {
    cutoffTimestamp = now - 7 * dayMs;
  } else if (range === '30d') {
    cutoffTimestamp = now - 30 * dayMs;
  } else if (range === '90d') {
    cutoffTimestamp = now - 90 * dayMs;
  } else if (range === 'this_year') {
    cutoffTimestamp = new Date(new Date(now).getFullYear(), 0, 1).getTime();
  } else {
    cutoffTimestamp = 0; // all
  }

  const filteredOrders = orders.filter(o => {
    if (cutoffTimestamp === 0) return true;
    const orderTime = new Date(o.createdAt).getTime();
    return orderTime >= cutoffTimestamp;
  });

  let gross = 0;
  let refunds = 0;
  let completedCount = 0;

  for (const ord of filteredOrders) {
    if (ord.status === 'completed') {
      gross += ord.amount;
      completedCount++;
    } else if (ord.status === 'refunded') {
      refunds += ord.amount;
    }
  }

  const net = Math.max(0, gross - refunds);
  const avgOrderValue = completedCount > 0 ? Math.round(gross / completedCount) : 0;
  
  // Approximate MRR from monthly recurring base
  const mrr = Math.round(gross * 0.35);
  const arr = mrr * 12;

  return {
    grossRevenue: gross,
    netRevenue: net,
    refundsTotal: refunds,
    completedOrdersCount: completedCount,
    avgOrderValue,
    mrr,
    arr,
  };
}
