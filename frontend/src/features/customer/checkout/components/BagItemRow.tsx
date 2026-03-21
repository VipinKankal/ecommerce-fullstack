import React from 'react';
import { CartItem } from 'shared/types/cart.types';

interface Props {
  item: CartItem;
  selected: boolean;
  deliveryEstimate?: string | null;
  onToggleSelect: (id: number) => void;
  onRemove: (id: number) => void;
  onChangeQuantity: (id: number, nextQuantity: number) => void;
  onChangeSize: (id: number, nextSize: string) => void;
  quantityUpdating: boolean;
}

const BagItemRow = ({
  item,
  selected,
  deliveryEstimate,
  onToggleSelect,
  onRemove,
  onChangeQuantity,
  onChangeSize,
  quantityUpdating,
}: Props) => {
  const product = item.product || {};
  const productImage = product?.images?.[0] || '/no-image.png';
  const productTitle = product?.title || 'Product';
  const brand = product?.brand || '';
  const mrpPrice = item?.mrpPrice ?? product?.mrpPrice ?? 0;
  const sellingPrice = item?.sellingPrice ?? product?.sellingPrice ?? 0;
  const offPercent =
    mrpPrice > sellingPrice && mrpPrice > 0
      ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
      : 0;
  const maxAvailable = Number(
    product?.warehouseStock ?? product?.quantity ?? item.quantity ?? 0,
  );
  const availableSizes =
    typeof product?.sizes === 'string'
      ? product.sizes
          .split(',')
          .map((size) => size.trim())
          .filter(Boolean)
      : [];
  const selectedSize = (item.size || '').trim();
  const isKnownSelectedSize =
    !selectedSize || availableSizes.includes(selectedSize);
  const sizeOptions = isKnownSelectedSize
    ? availableSizes
    : [selectedSize, ...availableSizes.filter((size) => size !== selectedSize)];

  return (
    <div className="relative flex gap-4 rounded-lg border border-gray-200 p-4">
      <div className="absolute right-3 top-3">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-700"
          onClick={() => onRemove(item.id)}
        >
          x
        </button>
      </div>
      <div className="pt-1">
        <input
          type="checkbox"
          className="h-4 w-4 accent-rose-500"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
        />
      </div>
      <div className="h-24 w-20 overflow-hidden rounded-md border bg-gray-50">
        <img
          src={productImage}
          alt={productTitle}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-gray-800">{brand}</p>
        <p className="text-sm text-gray-700">{productTitle}</p>
        <p className="text-xs text-gray-500">
          Sold by: {product?.seller?.sellerName || 'Seller'}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-700">
          <div className="rounded border px-1 py-0.5">
            <label className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-gray-600">
                Size
              </span>
              <select
                value={selectedSize || availableSizes[0] || ''}
                onChange={(event) => onChangeSize(item.id, event.target.value)}
                disabled={quantityUpdating || sizeOptions.length === 0}
                className="max-w-[84px] bg-transparent text-[11px] font-semibold text-gray-700 outline-none"
              >
                {sizeOptions.length === 0 ? (
                  <option value="">Size select kro</option>
                ) : (
                  sizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
          <div className="flex items-center rounded border px-1 py-0.5">
            <button
              type="button"
              className="h-5 w-5 rounded text-[11px] font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
              onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
              disabled={quantityUpdating || item.quantity <= 1}
            >
              -
            </button>
            <span className="min-w-10 text-center text-[11px] font-semibold text-gray-700">
              Qty: {item.quantity}
            </span>
            <button
              type="button"
              className="h-5 w-5 rounded text-[11px] font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
              onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
              disabled={
                quantityUpdating ||
                (maxAvailable > 0 && item.quantity >= maxAvailable)
              }
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm font-semibold text-gray-900">
          Rs {sellingPrice}
          {mrpPrice > sellingPrice && (
            <span className="ml-2 text-xs text-gray-400 line-through">
              Rs {mrpPrice}
            </span>
          )}
          {offPercent > 0 && (
            <span className="ml-2 text-xs text-rose-500">
              {offPercent}% OFF
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600">
          Delivery by {deliveryEstimate || '--'}
        </p>
      </div>
    </div>
  );
};

export default BagItemRow;
