import { Product } from 'shared/types/product.types';
import {
  PickupMode,
  ProductWithOptionalSize,
  SellerRecommendationMeta,
} from './ProductsTable.types';

export const LOW_STOCK_THRESHOLD = 5;

export const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const prettify = (value?: string | null) =>
  (value || '-').replaceAll('_', ' ');

export const getSafeImage = (image?: string) => {
  if (!image || image.startsWith('blob:')) return '/no-image.png';
  return image;
};

export const getColorLabel = (color: unknown) =>
  typeof color === 'string'
    ? color
    : color && typeof color === 'object' && 'name' in color
      ? String((color as { name?: unknown }).name || 'N/A')
      : 'N/A';

export const getCategoryLabel = (product: Product) =>
  product.category?.name ||
  product.category?.categoryId?.replace(/_/g, ' ') ||
  'N/A';

export const getRecommendationMeta = (
  product: Product,
  demandByProductId: Map<number, { waiting: number; notified: number; converted: number }>,
): SellerRecommendationMeta => {
  const sellerStock = Number(product.sellerStock ?? 0);
  const warehouseStock = Number(product.warehouseStock ?? product.quantity ?? 0);
  const demand = demandByProductId.get(Number(product.id)) || {
    waiting: 0,
    notified: 0,
    converted: 0,
  };
  const targetWarehouseStock = Math.max(LOW_STOCK_THRESHOLD, demand.waiting);
  const recommendedQty = Math.max(
    0,
    Math.min(sellerStock, targetWarehouseStock - warehouseStock),
  );
  const variantHighlights = (product.variants || [])
    .map((variant) => {
      const label =
        variant.size || variant.variantValue || variant.sku || `Variant ${variant.id}`;
      const variantSellerStock = Number(variant.sellerStock ?? 0);
      const variantWarehouseStock = Number(variant.warehouseStock ?? 0);

      if (variantWarehouseStock <= 0 && variantSellerStock > 0) {
        return `${label}: send soon`;
      }
      if (variantWarehouseStock <= 0) {
        return `${label}: empty`;
      }
      if (variantWarehouseStock <= LOW_STOCK_THRESHOLD) {
        return `${label}: ${variantWarehouseStock} left`;
      }
      return '';
    })
    .filter(Boolean)
    .slice(0, 2);

  if (sellerStock <= 0) {
    return {
      recommendedQty: 0,
      headline: 'Seller stock unavailable',
      detail: demand.waiting > 0
        ? `${demand.waiting} users are waiting but seller stock is empty.`
        : 'No units available to send right now.',
      tone: 'error',
      variantHighlights,
    };
  }

  if (recommendedQty > 0) {
    return {
      recommendedQty,
      headline:
        warehouseStock <= 0 ? 'Send to warehouse now' : 'Top up warehouse stock',
      detail:
        demand.waiting > 0
          ? `${demand.waiting} users are waiting. Recommended transfer ${recommendedQty} units.`
          : `Threshold top-up recommended: ${recommendedQty} units.`,
      tone: warehouseStock <= 0 ? 'warning' : 'info',
      variantHighlights,
    };
  }

  return {
    recommendedQty: 0,
    headline: 'Warehouse stock healthy',
    detail:
      demand.waiting > 0
        ? `${demand.waiting} users waiting, but warehouse can still cover demand.`
        : 'No transfer recommendation right now.',
    tone: 'success',
    variantHighlights,
  };
};

export const buildEditForm = (row: Product) => ({
  title: row.title || '',
  brand: row.brand || '',
  description: row.description || '',
  sellingPrice: String(row.sellingPrice ?? ''),
  mrpPrice: String(row.mrpPrice ?? ''),
  quantity: String(row.sellerStock ?? 0),
  color: getColorLabel(row.color),
  sizes: (row as ProductWithOptionalSize).size || row.sizes || '',
  warrantyType: row.warrantyType || 'NONE',
  warrantyDays: String(row.warrantyDays ?? 0),
});

export const buildTransferState = () => ({
  quantity: '1',
  pickupMode: 'WAREHOUSE_PICKUP' as PickupMode,
  sellerNote: '',
});
