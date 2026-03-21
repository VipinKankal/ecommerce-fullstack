import React, { useEffect, useMemo } from 'react';
import { Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { deleteItem, fetchUserCart } from 'State/features/customer/cart/slice';
import { orderSummary, productsList } from 'State/backend/MasterApiThunks';
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

const toOrderSummary = (payload: unknown): OrderSummaryResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const rawPriceBreakdown =
    record.priceBreakdown && typeof record.priceBreakdown === 'object'
      ? (record.priceBreakdown as Record<string, unknown>)
      : null;

  return {
    estimatedDeliveryDate:
      typeof record.estimatedDeliveryDate === 'string'
        ? record.estimatedDeliveryDate
        : undefined,
    priceBreakdown: rawPriceBreakdown
      ? {
          platformFee:
            typeof rawPriceBreakdown.platformFee === 'number'
              ? rawPriceBreakdown.platformFee
              : undefined,
          totalMRP:
            typeof rawPriceBreakdown.totalMRP === 'number'
              ? rawPriceBreakdown.totalMRP
              : undefined,
          totalSellingPrice:
            typeof rawPriceBreakdown.totalSellingPrice === 'number'
              ? rawPriceBreakdown.totalSellingPrice
              : undefined,
          totalDiscount:
            typeof rawPriceBreakdown.totalDiscount === 'number'
              ? rawPriceBreakdown.totalDiscount
              : undefined,
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
    const token =
      globalThis.sessionStorage !== undefined
        ? globalThis.sessionStorage.getItem('auth_jwt')
        : null;
    if (!customer && !token) {
      navigate('/login');
      return;
    }
    if (customer) {
      dispatch(fetchUserCart());
    }
  }, [customer, dispatch, navigate]);

  const currentSummary = useMemo(
    () => toOrderSummary(masterApi.responses.orderSummary),
    [masterApi.responses.orderSummary],
  );

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
        title: 'UPI (PhonePe)',
        sub: 'Pay online using UPI',
      },
    ],
    [],
  );

  const goToStep = (step: CheckoutStep) => {
    const path = step === 'BAG' ? 'cart' : step.toLowerCase();
    navigate(`/checkout/${path}`);
  };

  const {
    couponCode,
    handleAddressContinue,
    handleApplyCoupon,
    handleBagContinue,
    handleMoveSelectedToWishlist,
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
    pricing,
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
                  onCouponCodeChange={setCouponCode}
                  onApplyCoupon={handleApplyCoupon}
                />
              )}

              <PriceDetailsCard
                selectedItemCount={pricing.selectedItemCount}
                selectedPriceMrp={pricing.selectedPriceMrp}
                selectedDiscount={pricing.selectedDiscount}
                platformFee={currentSummary?.priceBreakdown?.platformFee ?? 0}
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
