import { Seller } from './seller.types';

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
  color: string;
  images: string[];
  numRatings?: number;
  category?: Category;
  seller?: Seller;
  createdAt?: Date;
  sizes: string;
}

export interface Category {
  id?: number;
  name: string;
  categoryId: string;
  parentCategory?: Category;
  level: number;
}
