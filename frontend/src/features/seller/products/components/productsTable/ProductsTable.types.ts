import { Product } from 'shared/types/product.types';

export type ProductEditFormState = {
  title: string;
  brand: string;
  description: string;
  sellingPrice: string;
  mrpPrice: string;
  quantity: string;
  color: string;
  sizes: string;
  warrantyType: string;
  warrantyDays: string;
};

export type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ProductWithOptionalSize = Product & { size?: string };
export type ProductUpdatePayload = Partial<Product> & {
  size?: string;
  sizes?: string;
};
export type PickupMode = 'SELLER_DROP' | 'WAREHOUSE_PICKUP';
export type SellerDemandProductRow = {
  productId?: number;
  subscribedCount?: number;
  notifiedCount?: number;
  convertedCount?: number;
};
export type SellerDemandInsights = {
  pendingSubscribers?: number;
  notifiedSubscribers?: number;
  convertedSubscribers?: number;
  demandProducts?: SellerDemandProductRow[];
};
export type SellerMovementRow = {
  id: number;
  action?: string;
  from?: string;
  to?: string;
  quantity?: number;
  movementType?: string;
  requestType?: string;
  addedBy?: string;
  updatedBy?: string;
  note?: string;
  createdAt?: string;
};
export type SellerRecommendationMeta = {
  recommendedQty: number;
  headline: string;
  detail: string;
  tone: 'success' | 'warning' | 'error' | 'info';
  variantHighlights: string[];
};
