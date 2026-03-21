import React from 'react';
import BagItemRow from './BagItemRow';
import { CartItem } from 'shared/types/cart.types';

interface Props {
  cartItems: CartItem[];
  selectedItemIds: number[];
  itemCount: number;
  allSelected: boolean;
  deliveryEstimate?: string | null;
  onToggleSelectAll: () => void;
  onToggleSelectItem: (id: number) => void;
  onRemoveSelected: () => void;
  onMoveSelectedToWishlist: () => void;
  onRemoveItem: (id: number) => void;
  onChangeItemQuantity: (id: number, nextQuantity: number) => void;
  onChangeItemSize: (id: number, nextSize: string) => void;
  updatingCartItemId?: number | null;
}

const CheckoutBagStep = ({
  cartItems,
  selectedItemIds,
  itemCount,
  allSelected,
  deliveryEstimate,
  onToggleSelectAll,
  onToggleSelectItem,
  onRemoveSelected,
  onMoveSelectedToWishlist,
  onRemoveItem,
  onChangeItemQuantity,
  onChangeItemSize,
  updatingCartItemId,
}: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-rose-500"
            checked={allSelected}
            onChange={onToggleSelectAll}
          />
          <span>
            {selectedItemIds.length}/{itemCount} ITEMS SELECTED
          </span>
        </div>
        <div className="flex gap-6 text-xs text-gray-500">
          <button
            type="button"
            className="hover:text-gray-900"
            onClick={onRemoveSelected}
          >
            REMOVE
          </button>
          <button
            type="button"
            className="hover:text-gray-900"
            onClick={onMoveSelectedToWishlist}
          >
            MOVE TO WISHLIST
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <BagItemRow
            key={item.id}
            item={item}
            selected={selectedItemIds.includes(item.id)}
            deliveryEstimate={deliveryEstimate}
            onToggleSelect={onToggleSelectItem}
            onRemove={onRemoveItem}
            onChangeQuantity={onChangeItemQuantity}
            onChangeSize={onChangeItemSize}
            quantityUpdating={updatingCartItemId === item.id}
          />
        ))}
      </div>
    </div>
  );
};

export default CheckoutBagStep;
