import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { CheckoutStep, PaymentOption } from '../types/checkoutTypes';

interface Props {
  currentStep: CheckoutStep;
  paymentMethod: PaymentOption;
  loading: boolean;
  submitting: boolean;
  masterApiLoading: boolean;
  onBagBack: () => void;
  onBagContinue: () => void;
  onAddressBack: () => void;
  onAddressContinue: () => void;
  onPaymentBack: () => void;
  onPlaceOrder: () => void;
}

const buttonSx = {
  py: 1.6,
  borderColor: '#ff3f6c',
  color: '#ff3f6c',
  fontWeight: 'bold',
  '&:hover': { borderColor: '#e6375f', color: '#e6375f' },
};

const primaryButtonSx = {
  py: 1.6,
  bgcolor: '#ff3f6c',
  fontWeight: 'bold',
  '&:hover': { bgcolor: '#e6375f' },
};

const CheckoutActionBar = ({
  currentStep,
  paymentMethod,
  loading,
  submitting,
  masterApiLoading,
  onBagBack,
  onBagContinue,
  onAddressBack,
  onAddressContinue,
  onPaymentBack,
  onPlaceOrder,
}: Props) => {
  if (currentStep === 'BAG') {
    return (
      <div className="flex items-center gap-3">
        <Button fullWidth variant="outlined" onClick={onBagBack} sx={buttonSx}>
          Back
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onBagContinue}
          sx={primaryButtonSx}
        >
          Continue to Address
        </Button>
      </div>
    );
  }

  if (currentStep === 'ADDRESS') {
    return (
      <div className="flex items-center gap-3">
        <Button
          fullWidth
          variant="outlined"
          onClick={onAddressBack}
          sx={buttonSx}
        >
          Back
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onAddressContinue}
          sx={primaryButtonSx}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        fullWidth
        variant="outlined"
        onClick={onPaymentBack}
        sx={buttonSx}
      >
        Back
      </Button>
      <Button
        fullWidth
        variant="contained"
        onClick={onPlaceOrder}
        disabled={loading || submitting || masterApiLoading}
        sx={primaryButtonSx}
      >
        {submitting || masterApiLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : paymentMethod === 'COD' ? (
          'Place COD Order'
        ) : (
          'Proceed to PhonePe'
        )}
      </Button>
    </div>
  );
};

export default CheckoutActionBar;
