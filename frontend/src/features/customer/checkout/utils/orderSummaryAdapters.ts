import { OrderSummaryResponse } from './pricing';

export interface CouponRecommendation {
  recommended: boolean;
  couponCode: string | null;
  estimatedDiscount: number | null;
}

const normalizeNumber = (...candidates: unknown[]) => {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
};

export const toOrderSummary = (payload: unknown): OrderSummaryResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const rawPriceBreakdown =
    record.priceBreakdown && typeof record.priceBreakdown === 'object'
      ? (record.priceBreakdown as Record<string, unknown>)
      : null;
  const rawTaxBreakdown =
    record.taxBreakdown && typeof record.taxBreakdown === 'object'
      ? (record.taxBreakdown as Record<string, unknown>)
      : null;

  return {
    estimatedDeliveryDate:
      typeof record.estimatedDeliveryDate === 'string'
        ? record.estimatedDeliveryDate
        : undefined,
    appliedGstRuleVersion:
      typeof record.appliedGstRuleVersion === 'string'
        ? record.appliedGstRuleVersion
        : undefined,
    effectiveRuleDate:
      typeof record.effectiveRuleDate === 'string'
        ? record.effectiveRuleDate
        : undefined,
    valueBasis:
      typeof record.valueBasis === 'string' ? record.valueBasis : undefined,
    priceBreakdown:
      rawPriceBreakdown || rawTaxBreakdown
        ? {
            platformFee: normalizeNumber(rawPriceBreakdown?.platformFee),
            totalMRP: normalizeNumber(
              rawPriceBreakdown?.totalMRP,
              rawPriceBreakdown?.totalMrp,
            ),
            totalSellingPrice: normalizeNumber(
              rawPriceBreakdown?.totalSellingPrice,
              rawPriceBreakdown?.totalSelling,
            ),
            totalDiscount: normalizeNumber(
              rawPriceBreakdown?.totalDiscount,
              rawPriceBreakdown?.discount,
            ),
            taxableAmount: normalizeNumber(
              rawPriceBreakdown?.taxableAmount,
              rawPriceBreakdown?.taxableValue,
              rawTaxBreakdown?.taxableAmount,
              rawTaxBreakdown?.taxableValue,
            ),
            cgst: normalizeNumber(
              rawPriceBreakdown?.cgst,
              rawPriceBreakdown?.cgstAmount,
              rawTaxBreakdown?.cgst,
              rawTaxBreakdown?.cgstAmount,
            ),
            sgst: normalizeNumber(
              rawPriceBreakdown?.sgst,
              rawPriceBreakdown?.sgstAmount,
              rawTaxBreakdown?.sgst,
              rawTaxBreakdown?.sgstAmount,
            ),
            igst: normalizeNumber(
              rawPriceBreakdown?.igst,
              rawPriceBreakdown?.igstAmount,
              rawTaxBreakdown?.igst,
              rawTaxBreakdown?.igstAmount,
            ),
            totalTax: normalizeNumber(
              rawPriceBreakdown?.totalTax,
              rawPriceBreakdown?.gstAmount,
              rawTaxBreakdown?.totalTax,
              rawTaxBreakdown?.gstAmount,
            ),
          }
        : undefined,
    orderItems: Array.isArray(record.orderItems)
      ? record.orderItems
          .filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === 'object',
          )
          .map((item) => ({
            id:
              typeof item.id === 'number' || typeof item.id === 'string'
                ? item.id
                : undefined,
          }))
      : undefined,
  };
};

export const toCouponRecommendation = (
  payload: unknown,
): CouponRecommendation | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;

  return {
    recommended: record.recommended === true,
    couponCode:
      typeof record.couponCode === 'string' ? record.couponCode : null,
    estimatedDiscount:
      typeof record.estimatedDiscount === 'number'
        ? record.estimatedDiscount
        : null,
  };
};
