import { Seller } from './seller.types';

export interface ProductVariant {
  id?: number;
  variantType?: string;
  variantValue?: string;
  size?: string;
  color?: string;
  sku?: string;
  price?: number;
  sellerStock?: number;
  warehouseStock?: number;
}

export interface ProductTaxReviewSummary {
  id?: number;
  productId?: number;
  suggestedHsnCode?: string;
  requestedHsnCode?: string;
  overrideReason?: string;
  reviewStatus?: string;
  reviewerNote?: string;
  requestedAt?: string;
  reviewedAt?: string;
}

export interface Product {
  id?: number;
  title: string;
  brand?: string;
  description: string;
  mrpPrice: number;
  sellingPrice: number;
  discountPercent: number;
  quantity: number;
  sellerStock?: number;
  warehouseStock?: number;
  warrantyType?: 'NONE' | 'BRAND' | 'SELLER' | string;
  warrantyDays?: number;
  color: string;
  images: string[];
  numRatings?: number;
  category?: Category;
  seller?: Seller;
  createdAt?: Date;
  sizes: string;
  active?: boolean;
  variants?: ProductVariant[];
  hsnCode?: string;
  taxClass?: string;
  taxRuleVersion?: string;
  taxPercentage?: number;
  pricingMode?: 'INCLUSIVE' | 'EXCLUSIVE' | string;
  platformCommission?: number;
  uiCategoryKey?: string;
  subcategoryKey?: string;
  gender?: string;
  fabricType?: string;
  constructionType?: string;
  fiberFamily?: string;
  hsnSelectionMode?: string;
  suggestedHsnCode?: string;
  overrideRequestedHsnCode?: string;
  hsnOverrideReason?: string;
  taxReviewStatus?: string;
  taxReview?: ProductTaxReviewSummary;
}

export interface Category {
  id?: number;
  name: string;
  categoryId: string;
  parentCategory?: Category;
  level: number;
}
