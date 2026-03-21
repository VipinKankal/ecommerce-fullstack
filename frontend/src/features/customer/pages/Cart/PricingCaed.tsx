import React from 'react';
import { Divider } from '@mui/material';
import { useAppSelector } from 'app/store/Store';

const PricingCard = () => {
  const cart = useAppSelector((state) => state.cart.cart);

  const totalMrp = cart?.totalMrpPrice ?? 0;
  const totalSelling = cart?.totalSellingPrice ?? 0;
  const discount = totalMrp - totalSelling;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase">
        Price Details
      </h3>

      <Divider />

      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Total MRP</span>
          <span>Rs {totalMrp}</span>
        </div>

        <div className="flex justify-between text-teal-600">
          <span>Discount</span>
          <span>-Rs {discount}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-teal-600 font-bold">FREE</span>
        </div>
      </div>

      <Divider />

      <div className="flex justify-between text-xl font-bold">
        <span>Total Amount</span>
        <span className="text-teal-700">Rs {totalSelling}</span>
      </div>
    </div>
  );
};

export default PricingCard;
