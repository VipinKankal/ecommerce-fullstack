export type PaymentOption = 'PHONEPE' | 'COD';

export type CheckoutStep = 'BAG' | 'ADDRESS' | 'PAYMENT';

export interface ShippingAddressForm {
  name: string;
  mobileNumber: string;
  address: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
}
