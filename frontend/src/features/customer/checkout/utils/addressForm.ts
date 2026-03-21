import { ShippingAddressForm } from '../types/checkoutTypes';

export const emptyAddressForm = (
  customer?: { fullName?: string; mobileNumber?: string } | null,
): ShippingAddressForm => ({
  name: customer?.fullName || '',
  mobileNumber: customer?.mobileNumber || '',
  address: '',
  locality: '',
  street: '',
  city: '',
  state: '',
  pinCode: '',
});

export const matchesAddress = (
  left: ShippingAddressForm,
  right?: Partial<ShippingAddressForm> | null,
) => {
  if (!right) return false;
  const normalize = (value?: string | null) =>
    (value || '').trim().toLowerCase();
  return (
    normalize(left.name) === normalize(right.name) &&
    normalize(left.mobileNumber) === normalize(right.mobileNumber) &&
    normalize(left.address) === normalize(right.address) &&
    normalize(left.street) === normalize(right.street) &&
    normalize(left.locality) === normalize(right.locality) &&
    normalize(left.city) === normalize(right.city) &&
    normalize(left.state) === normalize(right.state) &&
    normalize(left.pinCode) === normalize(right.pinCode)
  );
};
