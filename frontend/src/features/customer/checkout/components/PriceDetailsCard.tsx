import React from 'react';
import { Divider } from '@mui/material';

interface Props {
  selectedItemCount: number;
  selectedPriceMrp: number;
  selectedDiscount: number;
  platformFee: number;
  totalAmount: number;
  taxableAmount?: number | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  totalTax?: number | null;
}

const PriceDetailsCard = ({
  selectedItemCount,
  selectedPriceMrp,
  selectedDiscount,
  platformFee,
  totalAmount,
  taxableAmount,
  cgst,
  sgst,
  igst,
  totalTax,
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
      {(taxableAmount != null ||
        cgst != null ||
        sgst != null ||
        igst != null ||
        totalTax != null) && (
        <div className="space-y-2 text-sm rounded-md border border-blue-100 bg-blue-50/40 p-3">
          {taxableAmount != null && (
            <div className="flex justify-between">
              <span>Taxable Amount</span>
              <span>Rs {taxableAmount}</span>
            </div>
          )}
          {cgst != null && (
            <div className="flex justify-between">
              <span>CGST</span>
              <span>Rs {cgst}</span>
            </div>
          )}
          {sgst != null && (
            <div className="flex justify-between">
              <span>SGST</span>
              <span>Rs {sgst}</span>
            </div>
          )}
          {igst != null && (
            <div className="flex justify-between">
              <span>IGST</span>
              <span>Rs {igst}</span>
            </div>
          )}
          {totalTax != null && (
            <div className="flex justify-between font-semibold">
              <span>Total Tax</span>
              <span>Rs {totalTax}</span>
            </div>
          )}
        </div>
      )}
      <Divider />
      <div className="flex justify-between font-semibold">
        <span>Total Amount</span>
        <span>Rs {totalAmount}</span>
      </div>
    </div>
  );
};

export default PriceDetailsCard;
