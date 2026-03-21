import { act, renderHook } from '@testing-library/react';
import { useCheckoutSubmit } from './useCheckoutSubmit';

type CheckoutSubmitParams = Parameters<typeof useCheckoutSubmit>[0];

const createParams = (
  overrides?: Partial<CheckoutSubmitParams>,
): CheckoutSubmitParams => ({
  cart: undefined,
  cartItems: [],
  dispatch: jest.fn(),
  goToStep: jest.fn(),
  handleSelectSavedAddress: jest.fn(),
  navigate: jest.fn(),
  pricing: { selectedPriceSelling: 0 },
  useManualAddress: false,
  setUseManualAddress: jest.fn(),
  addressForm: {
    name: '',
    mobileNumber: '',
    address: '',
    locality: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
  },
  validateAddress: jest.fn(() => null),
  ...overrides,
});

describe('useCheckoutSubmit', () => {
  test('sets error when placing order with empty cart', async () => {
    const params = createParams();
    const { result } = renderHook(() => useCheckoutSubmit(params));

    await act(async () => {
      await result.current.handlePlaceOrder();
    });

    expect(result.current.submitError).toBe('Your cart is empty.');
    expect(params.goToStep).not.toHaveBeenCalled();
  });

  test('redirects to ADDRESS step when address validation fails', async () => {
    const params = createParams({
      cart: { cartItems: [{ id: 1 }] },
      cartItems: [{ id: 1 }],
      validateAddress: jest.fn(() => 'Address is required'),
    });
    const { result } = renderHook(() => useCheckoutSubmit(params));

    await act(async () => {
      await result.current.handlePlaceOrder();
    });

    expect(params.goToStep).toHaveBeenCalledWith('ADDRESS');
    expect(result.current.submitError).toBe('Address is required');
  });
});
