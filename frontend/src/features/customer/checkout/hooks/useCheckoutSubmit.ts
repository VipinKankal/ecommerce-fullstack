import { useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { AppDispatch } from 'app/store/Store';
import {
  addUserAddress,
  getUserProfile,
} from 'State/features/customer/auth/thunks';
import { deleteItem, fetchUserCart } from 'State/features/customer/cart/slice';
import { applyCoupon } from 'State/features/customer/cart/applyCoupon';
import { createCheckoutOrder } from 'State/backend/MasterApiThunks';
import { getApiError } from 'State/backend/masterApi/shared';
import { toggleWishlistProduct } from 'State/features/customer/wishlist/slice';
import { Address } from 'shared/types/user.types';
import { PaymentOption, ShippingAddressForm } from '../types/checkoutTypes';
import { matchesAddress } from '../utils/addressForm';

type CartItem = {
  id?: number;
  product?: {
    id?: number;
  };
};

type CartShape = {
  cartItems?: CartItem[];
  couponCode?: string | null;
  couponDiscountAmount?: number | null;
};

const readErrorMessage = (error: unknown, fallback: string) =>
  typeof error === 'string'
    ? error
    : (error as { message?: string })?.message || fallback;

const couponReasonMessages: Record<string, string> = {
  COUPON_NOT_FOUND: 'This coupon could not be found.',
  COUPON_INACTIVE: 'This coupon is no longer active.',
  COUPON_EXPIRED: 'This coupon has expired.',
  COUPON_CODE_REQUIRED: 'Please enter a coupon code.',
  MIN_ORDER_NOT_MET: 'Your bag no longer meets this coupon minimum order.',
  PER_USER_LIMIT_REACHED: 'You have already used this coupon the maximum number of times.',
  USAGE_LIMIT_REACHED: 'This coupon has reached its usage limit.',
  FIRST_ORDER_ONLY: 'This coupon is only valid on your first order.',
  USER_NOT_ELIGIBLE: 'This coupon is not available for your account.',
  USER_INACTIVE: 'Only active users can use this coupon.',
  CART_EMPTY: 'Add items to your bag before applying a coupon.',
  NOT_APPLICABLE_TO_CART: 'This coupon does not apply to the items in your bag.',
  COUPON_NOT_APPLIED: 'No coupon is currently applied to your bag.',
};

const couponReasonCodes = new Set(Object.keys(couponReasonMessages));

const resolveCouponError = (error: unknown, fallback: string) => {
  const apiError = getApiError(error, fallback);
  const reasonCode = apiError.reasonCode;

  if (reasonCode && couponReasonCodes.has(reasonCode)) {
    return {
      message: couponReasonMessages[reasonCode] || apiError.message,
      reasonCode,
      isCouponIssue: true,
    };
  }

  return {
    message: apiError.message || fallback,
    reasonCode,
    isCouponIssue: false,
  };
};

interface Params {
  cart?: CartShape | null;
  cartItems: CartItem[];
  dispatch: AppDispatch;
  goToStep: (step: 'BAG' | 'ADDRESS' | 'PAYMENT') => void;
  handleSelectSavedAddress: (address: Address) => void;
  navigate: NavigateFunction;
  useManualAddress: boolean;
  setUseManualAddress: (value: boolean) => void;
  addressForm: ShippingAddressForm;
  validateAddress: () => string | null;
}

export const useCheckoutSubmit = ({
  cart,
  cartItems,
  dispatch,
  goToStep,
  handleSelectSavedAddress,
  navigate,
  useManualAddress,
  setUseManualAddress,
  addressForm,
  validateAddress,
}: Params) => {
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>('PHONEPE');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const checkoutRequestIdRef = useRef(
    globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}`,
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setSubmitError('Please enter a coupon code.');
      return;
    }
    setSubmitError(null);
    try {
      await dispatch(
        applyCoupon({
          apply: true,
          code: couponCode.trim(),
        }),
      ).unwrap();
      await dispatch(fetchUserCart());
    } catch (error: unknown) {
      setSubmitError(resolveCouponError(error, 'Failed to apply coupon.').message);
    }
  };

  const handleRemoveCoupon = async () => {
    const currentCouponCode = (cart?.couponCode || couponCode).trim();
    if (!currentCouponCode) {
      setSubmitError('No coupon is currently applied to your bag.');
      return;
    }

    setSubmitError(null);
    try {
      await dispatch(
        applyCoupon({
          apply: false,
          code: currentCouponCode,
        }),
      ).unwrap();
      await dispatch(fetchUserCart());
      setCouponCode('');
    } catch (error: unknown) {
      setSubmitError(resolveCouponError(error, 'Failed to remove coupon.').message);
    }
  };

  const handleRemoveSelected = async (selectedItemIds: number[]) => {
    const ids = selectedItemIds.length
      ? selectedItemIds
      : (cartItems.map((item) => item?.id).filter(Boolean) as number[]);
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) => dispatch(deleteItem({ cartItemId: id }))),
    );
    dispatch(fetchUserCart());
  };

  const handleMoveSelectedToWishlist = async (selectedItemIds: number[]) => {
    const items = selectedItemIds.length
      ? cartItems.filter((item) => selectedItemIds.includes(item.id || 0))
      : cartItems;
    if (!items.length) return;
    await Promise.all(
      items.map((item) => {
        const productId = item?.product?.id;
        if (!productId) return Promise.resolve();
        return dispatch(toggleWishlistProduct(productId));
      }),
    );
    await Promise.all(
      items
        .filter((item) => item.id)
        .map((item) => dispatch(deleteItem({ cartItemId: item.id as number }))),
    );
    dispatch(fetchUserCart());
  };

  const handleSaveAddress = async () => {
    const validationError = validateAddress();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setSavingAddress(true);
    try {
      const response = await dispatch(addUserAddress(addressForm)).unwrap();
      const nextAddresses = response?.addresses || [];
      const savedAddress =
        nextAddresses.find((address: Address) =>
          matchesAddress(addressForm, address),
        ) || nextAddresses[nextAddresses.length - 1];

      await dispatch(getUserProfile()).unwrap();

      if (savedAddress) {
        handleSelectSavedAddress(savedAddress);
      } else {
        setUseManualAddress(false);
      }
    } catch (error: unknown) {
      setSubmitError(readErrorMessage(error, 'Failed to save address'));
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitError(null);

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    const addressError = validateAddress();
    if (addressError) {
      setSubmitError(addressError);
      goToStep('ADDRESS');
      return;
    }

    setSubmitting(true);
    try {
      let shippingDetails = {
        name: addressForm.name.trim(),
        mobileNumber: addressForm.mobileNumber.trim(),
        address: addressForm.address.trim(),
        locality: addressForm.locality.trim(),
        street: addressForm.street.trim() || addressForm.address.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pinCode: addressForm.pinCode.trim(),
      };

      if (useManualAddress) {
        const response = await dispatch(
          addUserAddress(shippingDetails),
        ).unwrap();
        const nextAddresses = response?.addresses || [];
        const savedAddress =
          nextAddresses.find((address: Address) =>
            matchesAddress(shippingDetails, address),
          ) || nextAddresses[nextAddresses.length - 1];

        await dispatch(getUserProfile()).unwrap();

        if (savedAddress) {
          handleSelectSavedAddress(savedAddress);
          shippingDetails = {
            name: savedAddress.name.trim(),
            mobileNumber: savedAddress.mobileNumber.trim(),
            address: savedAddress.address.trim(),
            locality: savedAddress.locality.trim(),
            street: (savedAddress.street || savedAddress.address).trim(),
            city: savedAddress.city.trim(),
            state: savedAddress.state.trim(),
            pinCode: savedAddress.pinCode.trim(),
          };
        }
      }

      const response = await dispatch(
        createCheckoutOrder({
          shippingAddress: shippingDetails,
          paymentMethod,
          checkoutRequestId: checkoutRequestIdRef.current,
        }),
      ).unwrap();
      await dispatch(getUserProfile()).unwrap();
      await dispatch(fetchUserCart());

      const createdOrderId = response?.orderId;
      const paymentUrl =
        response?.paymentUrl ||
        response?.payment_link_url ||
        response?.paymentLinkUrl;
      if (paymentUrl) {
        globalThis.location.assign(paymentUrl);
        return;
      }

      if (createdOrderId) {
        navigate(`/account/orders/${createdOrderId}`, {
          state: { successMessage: 'Order placed successfully.' },
        });
        return;
      }

      navigate('/account/orders');
    } catch (error: unknown) {
      const resolvedError = resolveCouponError(
        error,
        'Failed to create payment order',
      );
      if (resolvedError.isCouponIssue) {
        await dispatch(fetchUserCart());
        goToStep('BAG');
        setSubmitError(
          `${resolvedError.message} Go back to your bag and update the coupon before placing the order again.`,
        );
      } else {
        setSubmitError(readErrorMessage(error, 'Failed to create payment order'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBagContinue = () => {
    if (!cartItems.length) {
      setSubmitError('Your bag is empty.');
      return;
    }
    setSubmitError(null);
    goToStep('ADDRESS');
  };

  const handleAddressContinue = () => {
    const addressError = validateAddress();
    if (addressError) {
      setSubmitError(addressError);
      return;
    }
    setSubmitError(null);
    goToStep('PAYMENT');
  };

  return {
    couponCode,
    handleAddressContinue,
    handleApplyCoupon,
    handleBagContinue,
    handleMoveSelectedToWishlist,
    handleRemoveCoupon,
    handlePlaceOrder,
    handleRemoveSelected,
    handleSaveAddress,
    paymentMethod,
    savingAddress,
    setCouponCode,
    setPaymentMethod,
    submitError,
    submitting,
  };
};
