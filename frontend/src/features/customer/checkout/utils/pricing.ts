import { Cart, CartItem } from 'shared/types/cart.types';

export interface OrderSummaryPriceBreakdown {
  platformFee?: number;
  totalMRP?: number;
  totalSellingPrice?: number;
  totalDiscount?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax?: number;
}

export interface OrderSummaryResponse {
  estimatedDeliveryDate?: string;
  priceBreakdown?: OrderSummaryPriceBreakdown;
  orderItems?: Array<{ id?: number | string }>;
}

export interface CheckoutPricingResult {
  totalMrp: number;
  totalSelling: number;
  discount: number;
  itemCount: number;
  selectedItemCount: number;
  selectedPriceMrp: number;
  selectedPriceSelling: number;
  selectedDiscount: number;
}

export const deriveCheckoutPricing = ({
  cart,
  currentSummary,
  cartItems,
  selectedItemIds,
}: {
  cart?: Cart | null;
  currentSummary?: OrderSummaryResponse | null;
  cartItems: CartItem[];
  selectedItemIds: number[];
}): CheckoutPricingResult => {
  const selectedItems = cartItems.filter((item: CartItem) =>
    selectedItemIds.includes(item.id),
  );
  const selectedMrp = selectedItems.reduce(
    (sum: number, item: CartItem) => sum + (item.mrpPrice ?? 0),
    0,
  );
  const selectedSelling = selectedItems.reduce(
    (sum: number, item: CartItem) => sum + (item.sellingPrice ?? 0),
    0,
  );

  const totalMrp =
    currentSummary?.priceBreakdown?.totalMRP ?? cart?.totalMrpPrice ?? 0;
  const totalSelling =
    currentSummary?.priceBreakdown?.totalSellingPrice ??
    cart?.totalSellingPrice ??
    0;
  const discount =
    currentSummary?.priceBreakdown?.totalDiscount ?? totalMrp - totalSelling;
  const itemCount = currentSummary?.orderItems?.length ?? cartItems.length ?? 0;
  const selectedItemCount = selectedItemIds.length || itemCount;
  const selectedPriceMrp = selectedItemIds.length ? selectedMrp : totalMrp;
  const selectedPriceSelling = selectedItemIds.length
    ? selectedSelling
    : totalSelling;
  const selectedDiscount = selectedItemIds.length
    ? selectedMrp - selectedSelling
    : discount;

  return {
    totalMrp,
    totalSelling,
    discount,
    itemCount,
    selectedItemCount,
    selectedPriceMrp,
    selectedPriceSelling,
    selectedDiscount,
  };
};
