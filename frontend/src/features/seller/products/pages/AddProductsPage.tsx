import React, { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { createProduct } from 'State/features/seller/products/thunks';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from 'shared/utils/uploadToCloudinary';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import {
  AddProductFormValues,
  emptyVariant,
  initialProductFormValues,
  resolveSubcategoryKey,
  resolveUiCategoryKey,
  SellerProductTaxPreview,
  VariantRow,
} from './addProductConfig';
import { addProductValidationSchema } from './addProductValidation';
import AddProductFormBody from './components/AddProductFormBody';

const canRequestTaxPreview = (values: AddProductFormValues) =>
  Boolean(
    resolveUiCategoryKey(values) &&
      values.constructionType &&
      Number(values.sellingPrice || 0) > 0,
  );

const buildTaxPreviewPayload = (values: AddProductFormValues) => ({
  uiCategoryKey: resolveUiCategoryKey(values),
  subcategoryKey: resolveSubcategoryKey(values),
  gender: values.gender || undefined,
  fabricType: values.fabricType || undefined,
  constructionType: values.constructionType,
  fiberFamily: values.fiberFamily || undefined,
  hsnSelectionMode: values.hsnSelectionMode,
  overrideRequestedHsnCode: values.overrideRequestedHsnCode.trim() || undefined,
  hsnOverrideReason: values.hsnOverrideReason.trim() || undefined,
  pricingMode: values.pricingMode,
  taxClass: values.taxClass.trim() || undefined,
  taxRuleVersion: values.taxRuleVersion.trim() || undefined,
  sellingPricePerPiece: Number(values.sellingPrice || 0),
  costPrice: Number(values.costPrice || 0),
  platformCommission: Number(values.platformCommission || 0),
});

const AddProducts = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);
  const [taxPreview, setTaxPreview] = useState<SellerProductTaxPreview | null>(
    null,
  );
  const [taxPreviewLoading, setTaxPreviewLoading] = useState(false);
  const [taxPreviewError, setTaxPreviewError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.sellerProduct);

  const formik = useFormik({
    initialValues: initialProductFormValues,
    validationSchema: addProductValidationSchema,
    onSubmit: async (values) => {
      setSubmitError(null);

      if (canRequestTaxPreview(values) && !taxPreview) {
        setSubmitError(
          'Tax preview is still loading. Please wait for GST / HSN resolution before publishing.',
        );
        return;
      }

      if (taxPreview?.sellerTaxEligible === false) {
        setSubmitError(
          taxPreview.note ||
            'Seller tax eligibility is not complete yet. Please update onboarding tax details first.',
        );
        return;
      }

      if (taxPreview?.requiresFiberSelection && !values.fiberFamily.trim()) {
        setSubmitError(
          'This product needs a fibre family before the CA-approved HSN can be resolved.',
        );
        return;
      }

      const parsedVariants = variants
        .filter((variant) => variant.sku.trim())
        .map((variant) => ({
          variantType: variant.variantType,
          variantValue:
            variant.variantValue.trim() ||
            [variant.size.trim(), variant.color.trim()]
              .filter(Boolean)
              .join(' / '),
          size: variant.size.trim() || undefined,
          color: variant.color.trim() || undefined,
          sku: variant.sku.trim(),
          price: Number(variant.price || values.sellingPrice),
          quantity: Number(variant.quantity || 0),
        }));

      const requestBody = {
        title: values.title.trim(),
        brand: values.brand.trim(),
        categoryId: values.category3 || values.category2 || values.category,
        subCategoryId: values.category2 || values.category,
        category: values.category,
        category2: values.category2,
        category3: values.category3,
        uiCategoryKey: resolveUiCategoryKey(values),
        subcategoryKey: resolveSubcategoryKey(values),
        gender: values.gender || undefined,
        fabricType: values.fabricType.trim() || undefined,
        constructionType: values.constructionType,
        fiberFamily: values.fiberFamily.trim() || undefined,
        hsnSelectionMode: values.hsnSelectionMode,
        suggestedHsnCode:
          taxPreview?.suggestedHsnCode || values.suggestedHsnCode || undefined,
        overrideRequestedHsnCode:
          values.overrideRequestedHsnCode.trim() || undefined,
        hsnOverrideReason: values.hsnOverrideReason.trim() || undefined,
        taxReviewStatus:
          taxPreview?.reviewStatus || values.taxReviewStatus || undefined,
        description: values.description.trim(),
        productDescription: values.description.trim(),
        shortDescription: values.shortDescription.trim(),
        productHighlights: values.productHighlights
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        searchKeywords: values.searchKeywords
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        tags: values.tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        sku: values.sku.trim(),
        barcode: values.barcode.trim() || undefined,
        modelNumber: values.modelNumber.trim() || undefined,
        hsnCode:
          taxPreview?.resolvedHsnCode ||
          values.overrideRequestedHsnCode.trim() ||
          values.hsnCode.trim() ||
          undefined,
        manufacturerPartNumber:
          values.manufacturerPartNumber.trim() || undefined,
        countryOfOrigin: values.countryOfOrigin.trim() || undefined,
        mrpPrice: Number(values.mrpPrice),
        sellingPrice: Number(values.sellingPrice),
        pricingMode: values.pricingMode,
        taxClass: taxPreview?.taxClass || values.taxClass.trim() || undefined,
        taxRuleVersion:
          taxPreview?.gstRuleCode || values.taxRuleVersion.trim() || undefined,
        taxPercentage: Number(
          values.taxPercentage || taxPreview?.gstRatePreview || 0,
        ),
        costPrice: Number(values.costPrice || 0),
        currency: values.currency,
        platformCommission: Number(values.platformCommission || 0),
        stockQuantity: Number(values.stockQuantity),
        minOrderQuantity: Number(values.minOrderQuantity || 1),
        maxOrderQuantity: Number(
          values.maxOrderQuantity || values.stockQuantity || 1,
        ),
        stockStatus: values.stockStatus,
        warehouseLocation: values.warehouseLocation.trim() || undefined,
        reservedQuantity: Number(values.reservedQuantity || 0),
        color: values.color.trim(),
        sizes: values.sizes.trim(),
        images: values.images,
        mainImage: values.images[0],
        thumbnail: values.images[1] || values.images[0],
        galleryImages: values.images,
        videoUrl: values.videoUrl.trim() || undefined,
        weight: Number(values.weight || 0),
        length: Number(values.length || 0),
        width: Number(values.width || 0),
        height: Number(values.height || 0),
        packageType: values.packageType,
        shippingClass: values.shippingClass,
        returnable: values.returnable,
        returnWindowDays: Number(values.returnWindowDays || 0),
        warrantyType: values.warrantyType,
        warrantyDays: Number(values.warrantyDays || 0),
        replacementAvailable: values.replacementAvailable,
        manufacturerName: values.manufacturerName.trim(),
        manufacturerAddress: values.manufacturerAddress.trim() || undefined,
        packerName: values.packerName.trim() || undefined,
        importerName: values.importerName.trim() || undefined,
        safetyInformation: values.safetyInformation.trim() || undefined,
        metaTitle: values.metaTitle.trim() || values.title.trim(),
        metaDescription:
          values.metaDescription.trim() || values.shortDescription.trim(),
        size: values.sizes,
        quantity: Number(values.stockQuantity),
        variants: parsedVariants,
      };

      const res = await dispatch(createProduct({ request: requestBody }));
      if (res.meta.requestStatus === 'fulfilled') {
        navigate('/seller/products');
      } else {
        setSubmitError((res.payload as string) || 'Product creation failed');
      }
    },
  });

  const taxPreviewPayload = useMemo(
    () => buildTaxPreviewPayload(formik.values),
    [formik.values],
  );

  useEffect(() => {
    let cancelled = false;

    if (!canRequestTaxPreview(formik.values)) {
      setTaxPreview(null);
      setTaxPreviewError(null);
      formik.setFieldValue('hsnCode', '', false);
      formik.setFieldValue('suggestedHsnCode', '', false);
      formik.setFieldValue('taxReviewStatus', 'NOT_REQUIRED', false);
      return () => {
        cancelled = true;
      };
    }

    const timer = setTimeout(async () => {
      setTaxPreviewLoading(true);
      setTaxPreviewError(null);
      try {
        const response = await api.post(
          API_ROUTES.sellers.taxPreview,
          taxPreviewPayload,
        );
        if (cancelled) {
          return;
        }
        const preview = (response.data || null) as SellerProductTaxPreview | null;
        setTaxPreview(preview);
        formik.setFieldValue('hsnCode', preview?.resolvedHsnCode || '', false);
        formik.setFieldValue(
          'suggestedHsnCode',
          preview?.suggestedHsnCode || '',
          false,
        );
        formik.setFieldValue(
          'taxClass',
          preview?.taxClass || formik.values.taxClass,
          false,
        );
        formik.setFieldValue(
          'taxRuleVersion',
          preview?.gstRuleCode || formik.values.taxRuleVersion,
          false,
        );
        formik.setFieldValue(
          'taxPercentage',
          preview?.gstRatePreview != null
            ? String(preview.gstRatePreview)
            : formik.values.taxPercentage,
          false,
        );
        formik.setFieldValue(
          'taxReviewStatus',
          preview?.reviewStatus || 'NOT_REQUIRED',
          false,
        );
      } catch (previewError: unknown) {
        if (!cancelled) {
          const message =
            typeof previewError === 'object' &&
            previewError !== null &&
            'response' in previewError
              ? (
                  previewError as {
                    response?: { data?: { message?: string } | string };
                    message?: string;
                  }
                ).response?.data
              : null;
          const resolvedMessage =
            typeof message === 'string'
              ? message
              : typeof message === 'object' && message?.message
                ? message.message
                : 'Unable to resolve GST / HSN preview right now.';
          setTaxPreview(null);
          setTaxPreviewError(resolvedMessage);
        }
      } finally {
        if (!cancelled) {
          setTaxPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formik, taxPreviewPayload]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        formik.setFieldValue('images', [...formik.values.images, url]);
      }
    } catch (uploadErr) {
      console.error('Upload failed', uploadErr);
      setUploadError(
        'Image upload failed. Check your internet connection or Cloudinary configuration, then try again.',
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateVariant = (
    index: number,
    field: keyof VariantRow,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Add Marketplace Product
      </Typography>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          {(uploadError || submitError || error) && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="error">
                {uploadError || submitError || error}
              </Alert>
            </Box>
          )}

          <AddProductFormBody
            formik={formik}
            uploading={uploading}
            handleImageUpload={handleImageUpload}
            variants={variants}
            setVariants={setVariants}
            updateVariant={updateVariant}
            loading={loading}
            taxPreview={taxPreview}
            taxPreviewLoading={taxPreviewLoading}
            taxPreviewError={taxPreviewError}
          />
        </form>
      </Paper>
      {loading && (
        <Box sx={{ display: 'none' }}>
          <CircularProgress size={18} />
        </Box>
      )}
    </Box>
  );
};

export default AddProducts;
