import React, { useEffect, useMemo } from 'react';
import { Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { getUserProfile } from 'State/features/customer/auth/thunks';
import { getAuthRole } from 'shared/api/Api';
import {
  deleteItem,
  fetchUserCart,
  updateItem,
} from 'State/features/customer/cart/slice';
import {
  couponRecommendation,
  orderSummary,
  productsList,
} from 'State/backend/MasterApiThunks';
import CheckoutActionBar from '../components/CheckoutActionBar';
import CheckoutAddressStep from '../components/CheckoutAddressStep';
import CheckoutBagStep from '../components/CheckoutBagStep';
import CheckoutStepper from '../components/CheckoutStepper';
import CouponSection from '../components/CouponSection';
import PaymentMethodList from '../components/PaymentMethodList';
import PriceDetailsCard from '../components/PriceDetailsCard';
import { CheckoutStep, ShippingAddressForm } from '../types/checkoutTypes';
import { useCheckoutAddress } from '../hooks/useCheckoutAddress';
import { useCheckoutPricing } from '../hooks/useCheckoutPricing';
import { useCheckoutSubmit } from '../hooks/useCheckoutSubmit';
import { resolveStep } from '../utils/checkoutStep';
import { OrderSummaryResponse } from '../utils/pricing';

const normalizeNumber = (...candidates: unknown[]) => {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
};

const toOrderSummary = (payload: unknown): OrderSummaryResponse | null => {
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

const CheckoutPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const customer = useAppSelector((state) => state.customerAuth.user);
  const { cart, loading } = useAppSelector((state) => state.cart);
  const [updatingCartItemId, setUpdatingCartItemId] = React.useState<
    number | null
  >(null);
  const masterApi = useAppSelector((state) => state.masterApi);

  const pathStep = location.pathname.split('/')[2];
  const currentStep = resolveStep(pathStep);

  const {
    addressForm,
    handleSelectSavedAddress,
    onAddressChange,
    savedAddresses,
    selectedAddressId,
    setUseManualAddress,
    startNewAddress,
    useManualAddress,
    validateAddress,
  } = useCheckoutAddress({ customer });

  useEffect(() => {
    let active = true;

    const ensureCustomerSession = async () => {
      if (customer) {
        dispatch(fetchUserCart());
        return;
      }

      const authRole = getAuthRole();
      if (authRole && authRole !== 'customer') {
        navigate('/login');
        return;
      }

      try {
        await dispatch(getUserProfile()).unwrap();
      } catch {
        if (active) {
          navigate('/login');
        }
      }
    };

    ensureCustomerSession();

    return () => {
      active = false;
    };
  }, [customer, dispatch, navigate]);

  const currentSummary = useMemo(
    () => toOrderSummary(masterApi.responses.orderSummary),
    [masterApi.responses.orderSummary],
  );
  const recommendation = useMemo(() => {
    const payload = masterApi.responses.couponRecommendation;
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
  }, [masterApi.responses.couponRecommendation]);

  const {
    allSelected,
    cartItems,
    featuredCategoryId,
    pricing,
    selectedItemIds,
    toggleSelectAll,
    toggleSelectItem,
  } = useCheckoutPricing({ cart, currentSummary });

  const paymentOptions = useMemo(
    () => [
      {
        id: 'COD' as const,
        title: 'Cash On Delivery (Cash/UPI)',
        sub: 'Pay at delivery time',
      },
      {
        id: 'PHONEPE' as const,
        title: 'PhonePe UPI',
        sub: 'Pay now using direct PhonePe checkout',
      },
    ],
    [],
  );

  const goToStep = (step: CheckoutStep) => {
    const path = step === 'BAG' ? 'cart' : step.toLowerCase();
    navigate(`/checkout/${path}`);
  };

  const handleChangeItemQuantity = async (
    cartItemId: number,
    nextQuantity: number,
  ) => {
    if (nextQuantity < 1) return;
    setUpdatingCartItemId(cartItemId);
    try {
      await dispatch(
        updateItem({
          cartItemId,
          cartItem: { quantity: nextQuantity },
        }),
      ).unwrap();
    } finally {
      setUpdatingCartItemId(null);
    }
  };

  const handleChangeItemSize = async (cartItemId: number, nextSize: string) => {
    const currentItem = cartItems.find((item) => item.id === cartItemId);
    if (!currentItem || !nextSize || nextSize === currentItem.size) return;
    setUpdatingCartItemId(cartItemId);
    try {
      await dispatch(
        updateItem({
          cartItemId,
          cartItem: { quantity: currentItem.quantity, size: nextSize },
        }),
      ).unwrap();
    } finally {
      setUpdatingCartItemId(null);
    }
  };

  const {
    couponCode,
    handleAddressContinue,
    handleApplyCoupon,
    handleBagContinue,
    handleMoveSelectedToWishlist,
    handleRemoveCoupon,
    handlePlaceOrder,
    handleRemoveSelected,
    handleSaveAddress,
    paymentMethod,
    savingAddress,
    setCouponCode,
    setPaymentMethod,
    submitError,
    submitting,
  } = useCheckoutSubmit({
    cart,
    cartItems,
    dispatch,
    goToStep,
    handleSelectSavedAddress,
    navigate,
    useManualAddress,
    setUseManualAddress,
    addressForm,
    validateAddress,
  });

  useEffect(() => {
    if (!cartItems.length) return;
    dispatch(
      productsList({
        category: featuredCategoryId || undefined,
        pageNumber: 0,
      }),
    );
  }, [dispatch, featuredCategoryId, cartItems]);

  useEffect(() => {
    if (currentStep !== 'BAG' || !cartItems.length || cart?.couponCode) {
      return;
    }
    dispatch(couponRecommendation());
  }, [currentStep, cart?.couponCode, cartItems.length, dispatch]);

  const fetchSummary = useMemo(
    () => async (shippingDetails: ShippingAddressForm) => {
      try {
        await dispatch(
          orderSummary({
            recipientName: shippingDetails.name.trim(),
            mobileNumber: shippingDetails.mobileNumber.trim(),
            fullAddress: shippingDetails.address.trim(),
            pinCode: shippingDetails.pinCode.trim(),
            deliveryInstructions: shippingDetails.locality.trim(),
          }),
        ).unwrap();
      } catch {}
    },
    [dispatch],
  );

  useEffect(() => {
    const validationError = validateAddress();
    if (!cartItems.length || validationError) return;
    const timer = setTimeout(() => {
      fetchSummary(addressForm);
    }, 350);
    return () => clearTimeout(timer);
  }, [addressForm, cartItems, fetchSummary, validateAddress]);

  const handleBack = () => {
    if (currentStep === 'PAYMENT') {
      goToStep('ADDRESS');
      return;
    }
    if (currentStep === 'ADDRESS') {
      goToStep('BAG');
      return;
    }
    const lastPath =
      globalThis.sessionStorage !== undefined
        ? globalThis.sessionStorage.getItem('last_non_checkout_path')
        : null;
    if (lastPath && !lastPath.startsWith('/checkout')) {
      navigate(lastPath);
      return;
    }
    navigate('/');
  };

  const steps: CheckoutStep[] = ['BAG', 'ADDRESS', 'PAYMENT'];

  return (
    <div className="min-h-screen bg-white">
      <CheckoutStepper currentStep={currentStep} steps={steps} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {currentStep === 'BAG' && (
              <CheckoutBagStep
                cartItems={cartItems}
                selectedItemIds={selectedItemIds}
                itemCount={pricing.itemCount}
                allSelected={allSelected}
                deliveryEstimate={currentSummary?.estimatedDeliveryDate}
                onToggleSelectAll={toggleSelectAll}
                onToggleSelectItem={toggleSelectItem}
                onRemoveSelected={() => handleRemoveSelected(selectedItemIds)}
                onMoveSelectedToWishlist={() =>
                  handleMoveSelectedToWishlist(selectedItemIds)
                }
                onRemoveItem={(id) => dispatch(deleteItem({ cartItemId: id }))}
                onChangeItemQuantity={handleChangeItemQuantity}
                onChangeItemSize={handleChangeItemSize}
                updatingCartItemId={updatingCartItemId}
              />
            )}

            {currentStep === 'ADDRESS' && (
              <CheckoutAddressStep
                savedAddresses={savedAddresses}
                selectedAddressId={selectedAddressId}
                useManualAddress={useManualAddress}
                addressForm={addressForm}
                savingAddress={savingAddress}
                submitting={submitting}
                onSelectSavedAddress={handleSelectSavedAddress}
                onAddNewAddress={startNewAddress}
                onAddressChange={onAddressChange}
                onSaveAddress={handleSaveAddress}
                onContinue={handleAddressContinue}
              />
            )}

            {currentStep === 'PAYMENT' && (
              <div className="space-y-4">
                <PaymentMethodList
                  paymentOptions={paymentOptions}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {currentStep === 'BAG' && (
                <CouponSection
                  couponCode={couponCode}
                  appliedCouponCode={cart?.couponCode}
                  couponDiscountAmount={cart?.couponDiscountAmount}
                  recommendedCouponCode={
                    recommendation?.recommended
                      ? recommendation.couponCode
                      : null
                  }
                  recommendedDiscount={recommendation?.estimatedDiscount}
                  onUseRecommended={setCouponCode}
                  onCouponCodeChange={setCouponCode}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                />
              )}

              <PriceDetailsCard
                selectedItemCount={pricing.selectedItemCount}
                selectedPriceMrp={pricing.selectedPriceMrp}
                selectedDiscount={pricing.selectedDiscount}
                platformFee={currentSummary?.priceBreakdown?.platformFee ?? 0}
                taxableAmount={
                  currentSummary?.priceBreakdown?.taxableAmount ?? null
                }
                cgst={currentSummary?.priceBreakdown?.cgst ?? null}
                sgst={currentSummary?.priceBreakdown?.sgst ?? null}
                igst={currentSummary?.priceBreakdown?.igst ?? null}
                totalTax={currentSummary?.priceBreakdown?.totalTax ?? null}
                totalAmount={pricing.selectedPriceSelling}
              />

              {(submitError || masterApi.error) && (
                <Alert severity="error">{submitError || masterApi.error}</Alert>
              )}

              <CheckoutActionBar
                currentStep={currentStep}
                paymentMethod={paymentMethod}
                loading={loading}
                submitting={submitting}
                masterApiLoading={masterApi.loading}
                onBagBack={handleBack}
                onBagContinue={handleBagContinue}
                onAddressBack={() => goToStep('BAG')}
                onAddressContinue={handleAddressContinue}
                onPaymentBack={() => goToStep('ADDRESS')}
                onPlaceOrder={handlePlaceOrder}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
