import { useMemo, useState } from 'react';
import { Address } from 'shared/types/user.types';
import { ShippingAddressForm } from '../types/checkoutTypes';
import { emptyAddressForm } from '../utils/addressForm';

interface CustomerLike {
  fullName?: string;
  mobileNumber?: string;
  addresses?: Address[];
}

interface Params {
  customer?: CustomerLike | null;
}

export const useCheckoutAddress = ({ customer }: Params) => {
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [manualAddressForm, setManualAddressForm] =
    useState<ShippingAddressForm>(emptyAddressForm(null));

  const savedAddresses = useMemo(
    () => customer?.addresses || [],
    [customer?.addresses],
  );
  const activeSavedAddress = useMemo(() => {
    if (useManualAddress || !savedAddresses.length) {
      return null;
    }

    return (
      savedAddresses.find((address) => address.id === selectedAddressId) ||
      savedAddresses[0] ||
      null
    );
  }, [savedAddresses, selectedAddressId, useManualAddress]);

  const addressForm = useMemo<ShippingAddressForm>(() => {
    if (useManualAddress) {
      return manualAddressForm;
    }

    if (!activeSavedAddress) {
      return emptyAddressForm(customer);
    }

    return {
      name: activeSavedAddress.name || customer?.fullName || '',
      mobileNumber:
        activeSavedAddress.mobileNumber || customer?.mobileNumber || '',
      address: activeSavedAddress.address || '',
      locality: activeSavedAddress.locality || '',
      street: activeSavedAddress.street || '',
      city: activeSavedAddress.city || '',
      state: activeSavedAddress.state || '',
      pinCode: activeSavedAddress.pinCode || '',
    };
  }, [activeSavedAddress, customer, manualAddressForm, useManualAddress]);

  const onAddressChange = (field: keyof ShippingAddressForm, value: string) => {
    if (!useManualAddress) {
      setUseManualAddress(true);
      setSelectedAddressId(null);
    }
    setManualAddressForm((prev) => ({
      ...(useManualAddress ? prev : addressForm),
      [field]: value,
    }));
  };

  const handleSelectSavedAddress = (address: Address) => {
    setUseManualAddress(false);
    setSelectedAddressId(address.id || null);
  };

  const validateAddress = useMemo(
    () => () => {
      if (!addressForm.name.trim()) return 'Name is required';
      if (!/^[0-9]{10}$/.test(addressForm.mobileNumber.trim())) {
        return 'Mobile number must be 10 digits';
      }
      if (!addressForm.address.trim()) return 'Address is required';
      if (!addressForm.city.trim()) return 'City is required';
      if (!addressForm.state.trim()) return 'State is required';
      if (!/^[0-9]{6}$/.test(addressForm.pinCode.trim()))
        return 'Pincode must be 6 digits';
      return null;
    },
    [addressForm],
  );

  const startNewAddress = () => {
    setUseManualAddress(true);
    setSelectedAddressId(null);
    setManualAddressForm(emptyAddressForm(customer));
  };

  return {
    addressForm,
    handleSelectSavedAddress,
    onAddressChange,
    savedAddresses,
    selectedAddressId: useManualAddress ? null : activeSavedAddress?.id || null,
    setUseManualAddress,
    startNewAddress,
    useManualAddress,
    validateAddress,
  };
};
