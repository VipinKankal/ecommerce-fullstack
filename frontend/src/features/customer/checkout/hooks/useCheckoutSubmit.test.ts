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

  test('maps coupon apply failures to user-friendly messages', async () => {
    const dispatch = jest.fn().mockReturnValue({
      unwrap: jest
        .fn()
        .mockRejectedValue({ message: 'Coupon not valid', reasonCode: 'COUPON_EXPIRED' }),
    });
    const params = createParams({ dispatch });
    const { result } = renderHook(() => useCheckoutSubmit(params));

    await act(async () => {
      result.current.setCouponCode('SAVE10');
    });

    await act(async () => {
      await result.current.handleApplyCoupon();
    });

    expect(result.current.submitError).toBe('This coupon has expired.');
  });

  test('returns checkout to BAG step when coupon revalidation fails during order placement', async () => {
    const dispatch = jest
      .fn()
      .mockReturnValueOnce({
        unwrap: jest
          .fn()
          .mockRejectedValue({ message: 'Coupon usage limit reached', reasonCode: 'USAGE_LIMIT_REACHED' }),
      })
      .mockReturnValueOnce({
        unwrap: jest.fn().mockResolvedValue({}),
      });

    const params = createParams({
      cart: { cartItems: [{ id: 1 }] },
      cartItems: [{ id: 1 }],
      dispatch,
      addressForm: {
        name: 'Vipin',
        mobileNumber: '9999999999',
        address: 'Street 1',
        locality: 'Area',
        street: 'Street 1',
        city: 'Jaipur',
        state: 'Rajasthan',
        pinCode: '302001',
      },
    });
    const { result } = renderHook(() => useCheckoutSubmit(params));

    await act(async () => {
      await result.current.handlePlaceOrder();
    });

    expect(params.goToStep).toHaveBeenCalledWith('BAG');
    expect(result.current.submitError).toBe(
      'This coupon has reached its usage limit. Go back to your bag and update the coupon before placing the order again.',
    );
  });
});
