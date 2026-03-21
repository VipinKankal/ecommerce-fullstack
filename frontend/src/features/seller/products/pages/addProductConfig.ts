import { menLevelTwo } from 'shared/constants/data/Category/Level Two/menLavelTwo';
import { womenLevelTwo } from 'shared/constants/data/Category/Level Two/womenLavelTwo';
import { furnitureLevelTwo } from 'shared/constants/data/Category/Level Two/furuitureLavelTwo';
import { electronicsLevelTwo } from 'shared/constants/data/Category/Level Two/electronicsLavelTwo';
import { menLevelThree } from 'shared/constants/data/Category/Level Three/menLavelThree';
import { womenLevelThree } from 'shared/constants/data/Category/Level Three/womenLavelThree';
import { furnitureLevelThree } from 'shared/constants/data/Category/Level Three/furuitureLavelThree';
import { electronicsLevelThree } from 'shared/constants/data/Category/Level Three/electronicsLavelThree';

type CategoryNode = {
  name: string;
  categoryId: string;
  parentCategoryId: string;
  parentCategoryName?: string;
  level?: number;
};

export const categoryTwo: Record<string, CategoryNode[]> = {
  men: menLevelTwo,
  women: womenLevelTwo,
  home_furniture: furnitureLevelTwo,
  electronics: electronicsLevelTwo,
};

export const categoryThree: Record<string, CategoryNode[]> = {
  men: menLevelThree,
  women: womenLevelThree,
  home_furniture: furnitureLevelThree,
  electronics: electronicsLevelThree,
};

export const PRODUCT_DESCRIPTION_MAX_LENGTH = 300;

export interface VariantRow {
  variantType: string;
  variantValue: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  quantity: string;
}

export const emptyVariant = (): VariantRow => ({
  variantType: 'SIZE_COLOR',
  variantValue: '',
  size: '',
  color: '',
  sku: '',
  price: '',
  quantity: '',
});

export const initialProductFormValues = {
  title: '',
  brand: '',
  description: '',
  shortDescription: '',
  productHighlights: '',
  searchKeywords: '',
  tags: '',
  sku: '',
  barcode: '',
  modelNumber: '',
  hsnCode: '',
  manufacturerPartNumber: '',
  countryOfOrigin: 'India',
  mrpPrice: '',
  sellingPrice: '',
  taxPercentage: '18',
  currency: 'INR',
  platformCommission: '0',
  stockQuantity: '',
  minOrderQuantity: '1',
  maxOrderQuantity: '5',
  stockStatus: 'IN_STOCK',
  warehouseLocation: '',
  reservedQuantity: '0',
  color: '',
  sizes: '',
  images: [] as string[],
  videoUrl: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  packageType: 'BOX',
  shippingClass: 'STANDARD',
  returnable: true,
  returnWindowDays: '7',
  warrantyType: 'NONE',
  warrantyPeriod: '',
  replacementAvailable: true,
  manufacturerName: '',
  manufacturerAddress: '',
  packerName: '',
  importerName: '',
  safetyInformation: '',
  metaTitle: '',
  metaDescription: '',
  category: '',
  category2: '',
  category3: '',
};

export type AddProductFormValues = typeof initialProductFormValues;
