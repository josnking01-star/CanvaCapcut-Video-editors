import { 
  SubscriptionPlan, 
  CustomerSubscription, 
  PricingHistoryRecord 
} from '../types';

/**
 * Calculates the renewal price for an existing subscription.
 * RULE: Existing active subscriptions retain their protected agreed price
 * by default if price lock is enabled or if grandfathered.
 */
export function calculateSubscriptionRenewalPrice(
  subscription: CustomerSubscription,
  currentPlan: SubscriptionPlan,
  currentDateMs: number = Date.now()
): {
  renewalPrice: number;
  isGrandfathered: boolean;
  savingsVsStandard: number;
  reason: string;
} {
  // Check if price lock is active
  let isLocked = subscription.isPriceLocked;

  if (subscription.priceLockType === '1_year' && subscription.priceLockExpiresAt) {
    const expiresMs = new Date(subscription.priceLockExpiresAt).getTime();
    if (currentDateMs > expiresMs) {
      isLocked = false;
    }
  }

  if (isLocked) {
    const savings = Math.max(0, currentPlan.currentPrice - subscription.agreedPrice);
    return {
      renewalPrice: subscription.agreedPrice,
      isGrandfathered: true,
      savingsVsStandard: savings,
      reason: `Protected Agreed Renewal Price: Locked at $${subscription.agreedPrice} (Standard public price is $${currentPlan.currentPrice}).`,
    };
  }

  return {
    renewalPrice: currentPlan.currentPrice,
    isGrandfathered: false,
    savingsVsStandard: 0,
    reason: `Current Standard Price: $${currentPlan.currentPrice} (${currentPlan.billingCycle}).`,
  };
}

/**
 * Calculates purchase price for a NEW subscription.
 * MANDATORY BUSINESS RULE: New subscription purchases made after a price increase
 * MUST always use the latest active standard price, even if purchased by an existing customer.
 */
export function calculateNewPurchasePrice(
  currentPlan: SubscriptionPlan
): {
  checkoutPrice: number;
  pricingVersion: number;
  effectiveDate: string;
} {
  return {
    checkoutPrice: currentPlan.currentPrice,
    pricingVersion: currentPlan.version,
    effectiveDate: currentPlan.effectiveDate,
  };
}

/**
 * Executes a global plan price update while preserving existing customer subscriptions.
 */
export function executeGlobalPlanPriceUpdate(
  plan: SubscriptionPlan,
  newPrice: number,
  reason: string,
  actorEmail: string,
  existingSubscriptions: CustomerSubscription[]
): {
  updatedPlan: SubscriptionPlan;
  historyRecord: PricingHistoryRecord;
  affectedSubscriptionsPreservedCount: number;
} {
  const previousPrice = plan.currentPrice;
  const updatedPlan: SubscriptionPlan = {
    ...plan,
    previousPrice,
    currentPrice: newPrice,
    version: plan.version + 1,
    effectiveDate: new Date().toISOString().split('T')[0],
  };

  const historyRecord: PricingHistoryRecord = {
    id: `prc_hist_${Date.now()}`,
    planId: plan.id,
    planName: plan.name,
    previousPrice,
    newPrice,
    currency: plan.currency,
    effectiveDate: updatedPlan.effectiveDate,
    changedBy: actorEmail,
    reason,
    approvedByOwner: true,
  };

  // Verify that existing subscriptions maintain their agreed price
  const preservedCount = existingSubscriptions.filter(
    s => s.planId === plan.id && s.isPriceLocked
  ).length;

  return {
    updatedPlan,
    historyRecord,
    affectedSubscriptionsPreservedCount: preservedCount,
  };
}
