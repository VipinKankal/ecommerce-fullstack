import React from 'react';
import { Button, TextField } from '@mui/material';

interface Props {
  couponCode: string;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
}

const CouponSection = ({
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
}: Props) => {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase text-gray-600">Coupons</p>
      <div className="flex gap-2">
        <TextField
          size="small"
          placeholder="Apply Coupons"
          value={couponCode}
          onChange={(e) => onCouponCodeChange(e.target.value)}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
        <Button variant="outlined" size="small" onClick={onApplyCoupon}>
          Apply
        </Button>
      </div>
    </div>
  );
};

export default CouponSection;
