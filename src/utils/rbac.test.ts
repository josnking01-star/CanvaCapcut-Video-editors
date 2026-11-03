import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  hasPermission, 
  checkOwnerProtection, 
  calculateFinancialMetrics, 
  MASTER_OWNER_EMAIL, 
  MASTER_OWNER_ID,
  DEFAULT_RBAC_MATRIX 
} from './rbac';
import { Order } from '../types';

test('Master Owner has universal access to all resources and actions', () => {
  assert.equal(hasPermission('master_owner', 'dashboard', 'view'), true);
  assert.equal(hasPermission('master_owner', 'super_admins', 'delete'), true);
  assert.equal(hasPermission('master_owner', 'security', 'edit'), true);
  assert.equal(hasPermission('master_owner', 'backups', 'restore'), true);
});

test('Super Admin has restricted access and cannot delete Master Owner or modify owner security', () => {
  // Super Admin permissions check
  assert.equal(hasPermission('super_admin', 'customers', 'create'), true);
  assert.equal(hasPermission('super_admin', 'licenses', 'suspend'), true);
  assert.equal(hasPermission('super_admin', 'super_admins', 'delete'), false);
  assert.equal(hasPermission('super_admin', 'security', 'edit'), false);
  assert.equal(hasPermission('super_admin', 'rbac', 'delete'), false);
});

test('Customer has strictly isolated viewer/support permissions', () => {
  assert.equal(hasPermission('customer', 'dashboard', 'view'), true);
  assert.equal(hasPermission('customer', 'support', 'create'), true);
  assert.equal(hasPermission('customer', 'customers', 'view'), false);
  assert.equal(hasPermission('customer', 'finance', 'view'), false);
  assert.equal(hasPermission('customer', 'security', 'view'), false);
});

test('Master Owner Protection Guard prevents Super Admin from deleting or modifying Master Owner', () => {
  const superAdminActor = {
    id: 'admin_123',
    email: 'ops_lead@omnicut.com',
    role: 'super_admin' as const,
  };

  const masterOwnerTarget = {
    id: MASTER_OWNER_ID,
    email: MASTER_OWNER_EMAIL,
    isOwner: true,
  };

  // Attempt delete
  const deleteAttempt = checkOwnerProtection(superAdminActor, masterOwnerTarget, 'delete');
  assert.equal(deleteAttempt.allowed, false);
  assert.match(deleteAttempt.reason || '', /SECURITY VIOLATION/);

  // Attempt suspend
  const suspendAttempt = checkOwnerProtection(superAdminActor, masterOwnerTarget, 'suspend');
  assert.equal(suspendAttempt.allowed, false);

  // Attempt password change
  const pwdAttempt = checkOwnerProtection(superAdminActor, masterOwnerTarget, 'change_password');
  assert.equal(pwdAttempt.allowed, false);

  // Attempt 2FA disable
  const twoFaAttempt = checkOwnerProtection(superAdminActor, masterOwnerTarget, 'disable_2fa');
  assert.equal(twoFaAttempt.allowed, false);
});

test('Master Owner cannot accidentally delete themselves', () => {
  const ownerActor = {
    id: MASTER_OWNER_ID,
    email: MASTER_OWNER_EMAIL,
    role: 'master_owner' as const,
  };

  const masterOwnerTarget = {
    id: MASTER_OWNER_ID,
    email: MASTER_OWNER_EMAIL,
    isOwner: true,
  };

  const selfDelete = checkOwnerProtection(ownerActor, masterOwnerTarget, 'delete');
  assert.equal(selfDelete.allowed, false);
  assert.match(selfDelete.reason || '', /cannot be deleted or demoted/);
});

test('Super Admin CAN manage regular subordinate accounts', () => {
  const superAdminActor = {
    id: 'admin_123',
    email: 'ops_lead@omnicut.com',
    role: 'super_admin' as const,
  };

  const regularCustomer = {
    id: 'cust_999',
    email: 'customer@gmail.com',
    isOwner: false,
  };

  const deleteCust = checkOwnerProtection(superAdminActor, regularCustomer, 'delete');
  assert.equal(deleteCust.allowed, true);
});

test('Financial metrics calculation accurately sums revenues and filters by date range', () => {
  const now = new Date('2026-11-01T12:00:00Z').getTime();
  const dayMs = 86400000;

  const mockOrders: Order[] = [
    {
      id: 'ord_1',
      orderNumber: 'ORD-1001',
      customerId: 'cust_1',
      customerName: 'Alex Smith',
      customerEmail: 'alex@example.com',
      editionName: 'Enterprise Edition',
      amount: 499,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'stripe',
      invoiceId: 'inv_1',
      createdAt: new Date(now - 1 * dayMs).toISOString(), // 1 day ago
    },
    {
      id: 'ord_2',
      orderNumber: 'ORD-1002',
      customerId: 'cust_2',
      customerName: 'Maria Garcia',
      customerEmail: 'maria@example.com',
      editionName: 'Pro Edition',
      amount: 199,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'paypal',
      invoiceId: 'inv_2',
      createdAt: new Date(now - 5 * dayMs).toISOString(), // 5 days ago
    },
    {
      id: 'ord_3',
      orderNumber: 'ORD-1003',
      customerId: 'cust_3',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      editionName: 'Standard Edition',
      amount: 99,
      currency: 'USD',
      status: 'refunded',
      paymentMethod: 'stripe',
      invoiceId: 'inv_3',
      createdAt: new Date(now - 2 * dayMs).toISOString(), // 2 days ago
    },
    {
      id: 'ord_4',
      orderNumber: 'ORD-1004',
      customerId: 'cust_4',
      customerName: 'Old Customer',
      customerEmail: 'old@example.com',
      editionName: 'Pro Edition',
      amount: 199,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'stripe',
      invoiceId: 'inv_4',
      createdAt: new Date(now - 45 * dayMs).toISOString(), // 45 days ago
    },
  ];

  // 7 days filter: ord_1 (499), ord_2 (199), ord_3 (99 refunded)
  const metrics7d = calculateFinancialMetrics(mockOrders, '7d', now);
  assert.equal(metrics7d.grossRevenue, 499 + 199);
  assert.equal(metrics7d.refundsTotal, 99);
  assert.equal(metrics7d.netRevenue, 698 - 99);
  assert.equal(metrics7d.completedOrdersCount, 2);

  // All time: includes ord_4 (199)
  const metricsAll = calculateFinancialMetrics(mockOrders, 'all', now);
  assert.equal(metricsAll.grossRevenue, 499 + 199 + 199);
  assert.equal(metricsAll.refundsTotal, 99);
  assert.equal(metricsAll.completedOrdersCount, 3);
});
