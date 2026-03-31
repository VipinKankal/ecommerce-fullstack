import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { getUserProfile } from 'State/features/customer/auth/thunks';
import { getAuthRole } from 'shared/api/Api';
import {
  deleteItem,
  fetchUserCart,
  updateItem,
} from 'State/features/customer/cart/slice';
import {
  couponRecommendation,
  orderSummary,
  productsList,
} from 'State/backend/MasterApiThunks';
import { CheckoutStep, PaymentOption, ShippingAddressForm } from '../types/checkoutTypes';
import { useCheckoutAddress } from './useCheckoutAddress';
import { useCheckoutPricing } from './useCheckoutPricing';
import { useCheckoutSubmit } from './useCheckoutSubmit';
import { resolveStep } from '../utils/checkoutStep';
import {
  toCouponRecommendation,
  toOrderSummary,
} from '../utils/orderSummaryAdapters';

type PaymentOptionCard = {
  id: PaymentOption;
  title: string;
  sub: string;
};

const CHECKOUT_STEPS: CheckoutStep[] = ['BAG', 'ADDRESS', 'PAYMENT'];

const PAYMENT_OPTIONS: PaymentOptionCard[] = [
  {
    id: 'COD',
    title: 'Cash On Delivery (Cash/UPI)',
    sub: 'Pay at delivery time',
  },
  {
    id: 'PHONEPE',
    title: 'PhonePe UPI',
    sub: 'Pay now using direct PhonePe checkout',
  },
];

export const useCheckoutPageController = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const customer = useAppSelector((state) => state.customerAuth.user);
  const { cart, loading } = useAppSelector((state) => state.cart);
  const masterApi = useAppSelector((state) => state.masterApi);
  const [updatingCartItemId, setUpdatingCartItemId] = useState<number | null>(
    null,
  );

  const pathStep = location.pathname.split('/')[2];
  const currentStep = resolveStep(pathStep);

  const {
    addressForm,
    handleSelectSavedAddress,
    onAddressChange,
    savedAddresses,
    selectedAddressId,
    setUseManualAddress,
    startNewAddress,
    useManualAddress,
    validateAddress,
  } = useCheckoutAddress({ customer });

  useEffect(() => {
    let active = true;

    const ensureCustomerSession = async () => {
      if (customer) {
        dispatch(fetchUserCart());
        return;
      }

      const authRole = getAuthRole();
      if (authRole && authRole !== 'customer') {
        navigate('/login');
        return;
      }

      try {
        await dispatch(getUserProfile()).unwrap();
      } catch {
        if (active) {
          navigate('/login');
        }
      }
    };

    ensureCustomerSession();

    return () => {
      active = false;
    };
  }, [customer, dispatch, navigate]);

  const currentSummary = useMemo(
    () => toOrderSummary(masterApi.responses.orderSummary),
    [masterApi.responses.orderSummary],
  );

  const recommendation = useMemo(
    () => toCouponRecommendation(masterApi.responses.couponRecommendation),
    [masterApi.responses.couponRecommendation],
  );

  const {
    allSelected,
    cartItems,
    featuredCategoryId,
    pricing,
    selectedItemIds,
    toggleSelectAll,
    toggleSelectItem,
  } = useCheckoutPricing({ cart, currentSummary });

  const paymentOptions = useMemo(() => PAYMENT_OPTIONS, []);
  const steps = useMemo(() => CHECKOUT_STEPS, []);

  const goToStep = useCallback(
    (step: CheckoutStep) => {
      const path = step === 'BAG' ? 'cart' : step.toLowerCase();
      navigate(`/checkout/${path}`);
    },
    [navigate],
  );

  const handleRemoveItem = useCallback(
    (id: number) => {
      dispatch(deleteItem({ cartItemId: id }));
    },
    [dispatch],
  );

  const handleChangeItemQuantity = useCallback(
    async (cartItemId: number, nextQuantity: number) => {
      if (nextQuantity < 1) return;
      setUpdatingCartItemId(cartItemId);
      try {
        await dispatch(
          updateItem({
            cartItemId,
            cartItem: { quantity: nextQuantity },
          }),
        ).unwrap();
      } finally {
        setUpdatingCartItemId(null);
      }
    },
    [dispatch],
  );

  const handleChangeItemSize = useCallback(
    async (cartItemId: number, nextSize: string) => {
      const currentItem = cartItems.find((item) => item.id === cartItemId);
      if (!currentItem || !nextSize || nextSize === currentItem.size) return;
      setUpdatingCartItemId(cartItemId);
      try {
        await dispatch(
          updateItem({
            cartItemId,
            cartItem: { quantity: currentItem.quantity, size: nextSize },
          }),
        ).unwrap();
      } finally {
        setUpdatingCartItemId(null);
      }
    },
    [cartItems, dispatch],
  );

  const {
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
  } = useCheckoutSubmit({
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
  });

  useEffect(() => {
    if (!cartItems.length) return;
    dispatch(
      productsList({
        category: featuredCategoryId || undefined,
        pageNumber: 0,
      }),
    );
  }, [dispatch, featuredCategoryId, cartItems]);

  useEffect(() => {
    if (currentStep !== 'BAG' || !cartItems.length || cart?.couponCode) {
      return;
    }
    dispatch(couponRecommendation());
  }, [currentStep, cart?.couponCode, cartItems.length, dispatch]);

  const fetchSummary = useCallback(
    async (shippingDetails: ShippingAddressForm) => {
      try {
        await dispatch(
          orderSummary({
            shippingAddress: {
              name: shippingDetails.name.trim(),
              mobileNumber: shippingDetails.mobileNumber.trim(),
              street:
                shippingDetails.street.trim() || shippingDetails.address.trim(),
              address: shippingDetails.address.trim(),
              locality: shippingDetails.locality.trim(),
              city: shippingDetails.city.trim(),
              state: shippingDetails.state.trim(),
              pinCode: shippingDetails.pinCode.trim(),
              country: 'India',
            },
          }),
        ).unwrap();
      } catch {}
    },
    [dispatch],
  );

  useEffect(() => {
    const validationError = validateAddress();
    if (!cartItems.length || validationError) return;
    const timer = setTimeout(() => {
      fetchSummary(addressForm);
    }, 350);
    return () => clearTimeout(timer);
  }, [addressForm, cartItems, fetchSummary, validateAddress]);

  const handleBack = useCallback(() => {
    if (currentStep === 'PAYMENT') {
      goToStep('ADDRESS');
      return;
    }
    if (currentStep === 'ADDRESS') {
      goToStep('BAG');
      return;
    }
    const lastPath =
      globalThis.sessionStorage !== undefined
        ? globalThis.sessionStorage.getItem('last_non_checkout_path')
        : null;
    if (lastPath && !lastPath.startsWith('/checkout')) {
      navigate(lastPath);
      return;
    }
    navigate('/');
  }, [currentStep, goToStep, navigate]);

  return {
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
  };
};

