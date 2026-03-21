import React from 'react';
import { Divider } from '@mui/material';

interface Props {
  selectedItemCount: number;
  selectedPriceMrp: number;
  selectedDiscount: number;
  platformFee: number;
  totalAmount: number;
}

const PriceDetailsCard = ({
  selectedItemCount,
  selectedPriceMrp,
  selectedDiscount,
  platformFee,
  totalAmount,
}: Props) => {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase text-gray-600">
        Price Details ({selectedItemCount} Item)
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total MRP</span>
          <span>Rs {selectedPriceMrp}</span>
        </div>
        <div className="flex justify-between text-emerald-600">
          <span>Discount on MRP</span>
          <span>-Rs {selectedDiscount}</span>
        </div>
        <div className="flex justify-between">
          <span>Platform Fee</span>
          <span>Rs {platformFee}</span>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between font-semibold">
        <span>Total Amount</span>
        <span>Rs {totalAmount}</span>
      </div>
    </div>
  );
};

export default PriceDetailsCard;
