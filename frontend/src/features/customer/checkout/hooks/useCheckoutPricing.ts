import { useMemo, useState } from 'react';
import { Cart, CartItem } from 'shared/types/cart.types';
import { deriveCheckoutPricing, OrderSummaryResponse } from '../utils/pricing';

interface Params {
  cart?: Cart | null;
  currentSummary?: OrderSummaryResponse | null;
}

export const useCheckoutPricing = ({ cart, currentSummary }: Params) => {
  const cartItems = useMemo(() => cart?.cartItems || [], [cart?.cartItems]);
  const cartItemIds = useMemo(
    () => cartItems.map((item: CartItem) => item.id).filter(Boolean),
    [cartItems],
  );
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const featuredCategoryId = useMemo(
    () => cartItems[0]?.product?.category?.categoryId,
    [cartItems],
  );

  const effectiveSelectedItemIds = useMemo(() => {
    if (!selectedItemIds.length) {
      return cartItemIds;
    }

    const next = selectedItemIds.filter((id) => cartItemIds.includes(id));
    return next.length ? next : cartItemIds;
  }, [cartItemIds, selectedItemIds]);

  const pricing = useMemo(
    () =>
      deriveCheckoutPricing({
        cart,
        currentSummary,
        cartItems,
        selectedItemIds: effectiveSelectedItemIds,
      }),
    [cart, cartItems, currentSummary, effectiveSelectedItemIds],
  );

  const allSelected =
    cartItems.length > 0 &&
    effectiveSelectedItemIds.length === cartItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
      return;
    }
    setSelectedItemIds(cartItemIds);
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  return {
    allSelected,
    cartItems,
    featuredCategoryId,
    pricing,
    selectedItemIds: effectiveSelectedItemIds,
    toggleSelectAll,
    toggleSelectItem,
  };
};
