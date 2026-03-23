import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CouponSection from './CouponSection';

describe('CouponSection', () => {
  test('shows recommended coupon and lets user apply it quickly', () => {
    const onUseRecommended = jest.fn();

    render(
      <CouponSection
        couponCode=""
        appliedCouponCode={null}
        couponDiscountAmount={0}
        recommendedCouponCode="SAVE20"
        recommendedDiscount={120}
        onCouponCodeChange={() => undefined}
        onApplyCoupon={() => undefined}
        onRemoveCoupon={() => undefined}
        onUseRecommended={onUseRecommended}
      />,
    );

    expect(screen.getByText(/Recommended coupon/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /use/i }));
    expect(onUseRecommended).toHaveBeenCalledWith('SAVE20');
  });

  test('hides recommendation when a coupon is already applied', () => {
    render(
      <CouponSection
        couponCode="SAVE10"
        appliedCouponCode="SAVE10"
        couponDiscountAmount={80}
        recommendedCouponCode="SAVE20"
        recommendedDiscount={120}
        onCouponCodeChange={() => undefined}
        onApplyCoupon={() => undefined}
        onRemoveCoupon={() => undefined}
        onUseRecommended={() => undefined}
      />,
    );

    expect(screen.getByText(/Applied coupon/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recommended coupon/i)).not.toBeInTheDocument();
  });
});
