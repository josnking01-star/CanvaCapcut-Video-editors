import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateSubscriptionRenewalPrice, 
  calculateNewPurchasePrice, 
  executeGlobalPlanPriceUpdate 
} from './pricingEngine';
import { SubscriptionPlan, CustomerSubscription } from '../types';

const mockMonthlyPlan: SubscriptionPlan = {
  id: 'plan_pro_monthly',
  name: 'Professional Studio Elite (Monthly)',
  billingCycle: 'monthly',
  currentPrice: 149,
  previousPrice: 99,
  currency: 'USD',
  effectiveDate: '2026-11-01',
  version: 2,
  status: 'active',
  description: 'Pro tier with 4K export and bulk automation',
  gracePeriodDays: 7,
  tier: 'pro',
};

const mockExistingSub: CustomerSubscription = {
  id: 'sub_001',
  customerId: 'cust_001',
  customerName: 'Sarah Jenkins',
  customerEmail: 'sarah@example.com',
  planId: 'plan_pro_monthly',
  planName: 'Professional Studio Elite (Monthly)',
  agreedPrice: 99, // Grandfathered price
  currentStandardPrice: 149,
  isPriceLocked: true,
  priceLockType: 'grandfathered',
  billingCycle: 'monthly',
  status: 'active',
  autoRenew: true,
  startDate: '2025-11-01',
  renewalDate: '2026-12-01',
  currency: 'USD',
};

test('Existing active customer with grandfathered subscription renews at protected agreed price ($99 not $149)', () => {
  const renewal = calculateSubscriptionRenewalPrice(mockExistingSub, mockMonthlyPlan);
  assert.equal(renewal.renewalPrice, 99);
  assert.equal(renewal.isGrandfathered, true);
  assert.equal(renewal.savingsVsStandard, 50);
});

test('New subscription purchase receives latest active price ($149)', () => {
  const purchase = calculateNewPurchasePrice(mockMonthlyPlan);
  assert.equal(purchase.checkoutPrice, 149);
  assert.equal(purchase.pricingVersion, 2);
});

test('Global price update increases plan standard price without modifying agreed price on existing subscriptions', () => {
  const existingSubs = [mockExistingSub];
  const { updatedPlan, historyRecord, affectedSubscriptionsPreservedCount } = executeGlobalPlanPriceUpdate(
    mockMonthlyPlan,
    199,
    'Annual price adjustment for 8K video engine',
    'josnking01@gmail.com',
    existingSubs
  );

  assert.equal(updatedPlan.currentPrice, 199);
  assert.equal(updatedPlan.previousPrice, 149);
  assert.equal(historyRecord.newPrice, 199);
  assert.equal(affectedSubscriptionsPreservedCount, 1);

  // Existing subscription still calculates renewal at original $99
  const renewalAfterPriceHike = calculateSubscriptionRenewalPrice(mockExistingSub, updatedPlan);
  assert.equal(renewalAfterPriceHike.renewalPrice, 99);
  assert.equal(renewalAfterPriceHike.savingsVsStandard, 100);
});

test('Customer whose 1-year price lock expired falls back to current standard price', () => {
  const now = new Date('2026-11-01T12:00:00Z').getTime();
  const expiredSub: CustomerSubscription = {
    ...mockExistingSub,
    priceLockType: '1_year',
    priceLockExpiresAt: '2026-10-01T00:00:00Z', // Expired 1 month ago
  };

  const renewal = calculateSubscriptionRenewalPrice(expiredSub, mockMonthlyPlan, now);
  assert.equal(renewal.renewalPrice, 149);
  assert.equal(renewal.isGrandfathered, false);
});
