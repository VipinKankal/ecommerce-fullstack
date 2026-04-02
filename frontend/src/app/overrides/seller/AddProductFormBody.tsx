import React from 'react';
import { FormikProps } from 'formik';
import { Button, CircularProgress, Grid } from '@mui/material';
import {
  AddProductFormValues,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  SellerProductTaxPreview,
  VariantRow,
} from 'features/seller/products/pages/addProductConfig';
import AddProductFormBasics from './add-product-form/AddProductFormBasics';
import AddProductFulfillmentSection from './add-product-form/AddProductFulfillmentSection';
import AddProductMediaSection from './add-product-form/AddProductMediaSection';
import AddProductPricingSection from './add-product-form/AddProductPricingSection';
import AddProductVariantsSection from './add-product-form/AddProductVariantsSection';

type AddProductFormBodyProps = {
  formik: FormikProps<AddProductFormValues>;
  uploading: boolean;
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void | Promise<void>;
  variants: VariantRow[];
  setVariants: React.Dispatch<React.SetStateAction<VariantRow[]>>;
  updateVariant: (
    index: number,
    field: keyof VariantRow,
    value: string,
  ) => void;
  loading: boolean;
  taxPreview: SellerProductTaxPreview | null;
  taxPreviewLoading: boolean;
  taxPreviewError: string | null;
};

const AddProductFormBody = ({
  formik,
  uploading,
  handleImageUpload,
  variants,
  setVariants,
  updateVariant,
  loading,
  taxPreview,
  taxPreviewLoading,
  taxPreviewError,
}: AddProductFormBodyProps) => {
  const descriptionLength = formik.values.description.length;
  const descriptionHelperText =
    formik.touched.description && formik.errors.description
      ? `${formik.errors.description} (${descriptionLength}/${PRODUCT_DESCRIPTION_MAX_LENGTH})`
      : `${descriptionLength}/${PRODUCT_DESCRIPTION_MAX_LENGTH} characters`;
  const submitLabel = taxPreview?.requiresReview
    ? 'CREATE PRODUCT (PENDING REVIEW)'
    : 'CREATE PRODUCT';

  return (
    <Grid container spacing={3}>
      <AddProductMediaSection
        formik={formik}
        uploading={uploading}
        handleImageUpload={handleImageUpload}
      />
      <AddProductFormBasics
        formik={formik}
        descriptionHelperText={descriptionHelperText}
      />
      <AddProductPricingSection
        formik={formik}
        taxPreview={taxPreview}
        taxPreviewLoading={taxPreviewLoading}
        taxPreviewError={taxPreviewError}
      />
      <AddProductFulfillmentSection formik={formik} />
      <AddProductVariantsSection
        variants={variants}
        setVariants={setVariants}
        updateVariant={updateVariant}
      />

      <Grid size={{ xs: 12 }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading || uploading || taxPreviewLoading}
          sx={{ py: 1.5, bgcolor: '#10b981', fontWeight: 'bold' }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            submitLabel
          )}
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddProductFormBody;
