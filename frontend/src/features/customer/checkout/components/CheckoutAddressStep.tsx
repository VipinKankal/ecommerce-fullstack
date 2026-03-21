import React from 'react';
import { Button } from '@mui/material';
import { teal } from '@mui/material/colors';
import { Address } from 'shared/types/user.types';
import { ShippingAddressForm } from '../types/checkoutTypes';
import AddressForm from '../../pages/Checkout/AddressForm';
import AddressSelectionList from './AddressSelectionList';

interface Props {
  savedAddresses: Address[];
  selectedAddressId: number | null;
  useManualAddress: boolean;
  addressForm: ShippingAddressForm;
  savingAddress: boolean;
  submitting: boolean;
  onSelectSavedAddress: (address: Address) => void;
  onAddNewAddress: () => void;
  onAddressChange: (field: keyof ShippingAddressForm, value: string) => void;
  onSaveAddress: () => void;
  onContinue: () => void;
}

const CheckoutAddressStep = ({
  savedAddresses,
  selectedAddressId,
  useManualAddress,
  addressForm,
  savingAddress,
  submitting,
  onSelectSavedAddress,
  onAddNewAddress,
  onAddressChange,
  onSaveAddress,
  onContinue,
}: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Select Delivery Address
        </h2>
        <Button variant="outlined" size="small" onClick={onAddNewAddress}>
          Add New Address
        </Button>
      </div>

      <AddressSelectionList
        addresses={savedAddresses}
        selectedAddressId={selectedAddressId}
        useManualAddress={useManualAddress}
        onSelect={onSelectSavedAddress}
      />

      {(useManualAddress || savedAddresses.length === 0) && (
        <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4">
          <p className="text-sm font-semibold text-rose-500">Add New Address</p>
          <AddressForm value={addressForm} onChange={onAddressChange} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Save this address to your profile before continuing.
            </p>
            <Button
              variant="outlined"
              disabled={savingAddress || submitting}
              onClick={onSaveAddress}
            >
              {savingAddress ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="contained"
          onClick={onContinue}
          sx={{ bgcolor: teal[600], '&:hover': { bgcolor: teal[800] } }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CheckoutAddressStep;
