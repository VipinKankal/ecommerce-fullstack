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

export const CONSTRUCTION_OPTIONS = [
  { label: 'Knitted', value: 'KNITTED' },
  { label: 'Woven', value: 'WOVEN' },
  { label: 'Made-up textile', value: 'MADE_UP_TEXTILE' },
  { label: 'Other', value: 'OTHER' },
] as const;

export const GENDER_OPTIONS = [
  { label: 'Men', value: 'MEN' },
  { label: 'Women', value: 'WOMEN' },
  { label: 'Unisex', value: 'UNISEX' },
  { label: 'Boys', value: 'BOYS' },
  { label: 'Girls', value: 'GIRLS' },
] as const;

export const FABRIC_OPTIONS = [
  'Cotton',
  'Polyester',
  'Viscose',
  'Wool',
  'Silk',
  'Linen',
  'Denim',
  'Blended',
  'Other',
] as const;

export const FIBER_FAMILY_OPTIONS = [
  'Cotton',
  'Silk',
  'Synthetic filament',
  'Synthetic staple',
  'Wool',
  'Linen',
  'Other',
] as const;

export const HSN_SELECTION_MODE_OPTIONS = [
  { label: 'Auto suggest', value: 'AUTO' },
  { label: 'Manual override request', value: 'MANUAL' },
] as const;

export interface VariantRow {
  variantType: string;
  variantValue: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  quantity: string;
}

export interface SellerProductTaxPreview {
  uiCategoryKey?: string;
  subcategoryKey?: string;
  displayLabel?: string;
  constructionType?: string;
  gender?: string;
  fabricType?: string;
  fiberFamily?: string;
  mappingMode?: string;
  hsnChapter?: string;
  suggestedHsnCode?: string;
  resolvedHsnCode?: string;
  requestedHsnCode?: string;
  hsnSelectionMode?: string;
  taxClass?: string;
  gstRuleCode?: string;
  tcsRuleCode?: string;
  effectiveRuleDate?: string;
  valueBasis?: string;
  supplyTypeAssumption?: string;
  placeOfSupplyStatus?: string;
  sellingPricePerPiece?: number;
  taxableValuePreview?: number;
  gstRatePreview?: number;
  gstAmountPreview?: number;
  commissionAmountPreview?: number;
  commissionGstPreview?: number;
  tcsAmountPreview?: number;
  netPayoutPreview?: number;
  estimatedProfitPreview?: number;
  requiresFiberSelection?: boolean;
  requiresReview?: boolean;
  reviewStatus?: string;
  sellerTaxEligible?: boolean;
  sellerTaxEligibilityStatus?: string;
  sellerOnboardingPolicy?: string;
  note?: string;
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
  pricingMode: 'INCLUSIVE',
  taxClass: 'APPAREL_STANDARD',
  taxRuleVersion: 'AUTO_ACTIVE',
  taxPercentage: '0',
  costPrice: '',
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
  warrantyDays: '',
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
  gender: '',
  fabricType: '',
  constructionType: '',
  fiberFamily: '',
  hsnSelectionMode: 'AUTO',
  overrideRequestedHsnCode: '',
  hsnOverrideReason: '',
  suggestedHsnCode: '',
  taxReviewStatus: 'NOT_REQUIRED',
};

export type AddProductFormValues = typeof initialProductFormValues;

export const resolveUiCategoryKey = (values: Pick<
  AddProductFormValues,
  'category' | 'category2' | 'category3'
>) => values.category3 || values.category2 || values.category;

export const resolveSubcategoryKey = (values: Pick<
  AddProductFormValues,
  'category' | 'category2'
>) => values.category2 || values.category;

export const resolveSelectedCategoryLabel = (
  values: Pick<AddProductFormValues, 'category' | 'category2' | 'category3'>,
) => {
  const levelThreeOption = categoryThree[values.category]?.find(
    (item) => item.categoryId === values.category3,
  );
  if (levelThreeOption) {
    return levelThreeOption.name;
  }
  const levelTwoOption = categoryTwo[values.category]?.find(
    (item) => item.categoryId === values.category2,
  );
  return levelTwoOption?.name || values.category || '';
};
