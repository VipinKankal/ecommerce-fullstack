import React from 'react';
import { FormikProps } from 'formik';
import {
  AddProductFormValues,
  SellerProductTaxPreview,
  VariantRow,
} from 'features/seller/products/pages/addProductConfig';

export type SharedAddProductFormProps = {
  formik: FormikProps<AddProductFormValues>;
};

export type AddProductMediaSectionProps = SharedAddProductFormProps & {
  uploading: boolean;
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void | Promise<void>;
};

export type AddProductPricingSectionProps = SharedAddProductFormProps & {
  taxPreview: SellerProductTaxPreview | null;
  taxPreviewLoading: boolean;
  taxPreviewError: string | null;
};

export type AddProductVariantsSectionProps = {
  variants: VariantRow[];
  setVariants: React.Dispatch<React.SetStateAction<VariantRow[]>>;
  updateVariant: (
    index: number,
    field: keyof VariantRow,
    value: string,
  ) => void;
};
