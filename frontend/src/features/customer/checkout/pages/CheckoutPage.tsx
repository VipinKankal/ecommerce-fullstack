import React from 'react';
import { Alert } from '@mui/material';
import CheckoutActionBar from '../components/CheckoutActionBar';
import CheckoutAddressStep from '../components/CheckoutAddressStep';
import CheckoutBagStep from '../components/CheckoutBagStep';
import CheckoutStepper from '../components/CheckoutStepper';
import CouponSection from '../components/CouponSection';
import PaymentMethodList from '../components/PaymentMethodList';
import PriceDetailsCard from '../components/PriceDetailsCard';
import { useCheckoutPageController } from '../hooks/useCheckoutPageController';

const CheckoutPage = () => {
  const {
    addressForm,
    allSelected,
    cart,
    cartItems,
    couponCode,
    currentStep,
    currentSummary,
    goToStep,
    handleAddressContinue,
    handleApplyCoupon,
    handleBack,
    handleBagContinue,
    handleChangeItemQuantity,
    handleChangeItemSize,
    handleMoveSelectedToWishlist,
    handlePlaceOrder,
    handleRemoveCoupon,
    handleRemoveItem,
    handleRemoveSelected,
    handleSaveAddress,
    handleSelectSavedAddress,
    loading,
    masterApi,
    onAddressChange,
    paymentMethod,
    paymentOptions,
    pricing,
    recommendation,
    savedAddresses,
    savingAddress,
    selectedAddressId,
    selectedItemIds,
    setCouponCode,
    setPaymentMethod,
    startNewAddress,
    steps,
    submitError,
    submitting,
    toggleSelectAll,
    toggleSelectItem,
    updatingCartItemId,
    useManualAddress,
  } = useCheckoutPageController();

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
                onRemoveItem={handleRemoveItem}
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
