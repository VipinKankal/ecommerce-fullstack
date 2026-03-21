import { CheckoutStep } from '../types/checkoutTypes';

export const resolveStep = (segment?: string | null): CheckoutStep => {
  switch ((segment || '').toLowerCase()) {
    case 'cart':
      return 'BAG';
    case 'address':
      return 'ADDRESS';
    case 'payment':
      return 'PAYMENT';
    default:
      return 'BAG';
  }
};
