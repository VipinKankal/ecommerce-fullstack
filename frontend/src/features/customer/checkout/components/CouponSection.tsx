import React from 'react';
import { Alert, Button, TextField } from '@mui/material';

interface Props {
  couponCode: string;
  appliedCouponCode?: string | null;
  couponDiscountAmount?: number | null;
  recommendedCouponCode?: string | null;
  recommendedDiscount?: number | null;
  onUseRecommended?: (code: string) => void;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
}

const CouponSection = ({
  couponCode,
  appliedCouponCode,
  couponDiscountAmount,
  recommendedCouponCode,
  recommendedDiscount,
  onUseRecommended,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
}: Props) => {
  const hasAppliedCoupon = Boolean(appliedCouponCode);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase text-gray-600">Coupons</p>
      {hasAppliedCoupon && (
        <Alert severity="success">
          Applied coupon <strong>{appliedCouponCode}</strong>
          {couponDiscountAmount ? ` and saved Rs ${couponDiscountAmount}` : ''}.
        </Alert>
      )}
      {!hasAppliedCoupon && recommendedCouponCode && (
        <Alert
          severity="info"
          action={
            onUseRecommended ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => onUseRecommended(recommendedCouponCode)}
              >
                Use
              </Button>
            ) : undefined
          }
        >
          Recommended coupon <strong>{recommendedCouponCode}</strong>
          {recommendedDiscount ? ` (est. save Rs ${recommendedDiscount})` : ''}.
        </Alert>
      )}
      <div className="flex gap-2">
        <TextField
          size="small"
          placeholder="Apply Coupons"
          value={appliedCouponCode || couponCode}
          onChange={(e) => onCouponCodeChange(e.target.value)}
          disabled={hasAppliedCoupon}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={hasAppliedCoupon ? onRemoveCoupon : onApplyCoupon}
        >
          {hasAppliedCoupon ? 'Remove' : 'Apply'}
        </Button>
      </div>
    </div>
  );
};

export default CouponSection;
