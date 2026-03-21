import React, { useState } from 'react';
import { useFormik } from 'formik';
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { createProduct } from 'State/features/seller/products/thunks';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from 'shared/utils/uploadToCloudinary';
import {
  emptyVariant,
  initialProductFormValues,
  VariantRow,
} from './addProductConfig';
import { addProductValidationSchema } from './addProductValidation';
import AddProductFormBody from './components/AddProductFormBody';

const AddProducts = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.sellerProduct);

  const formik = useFormik({
    initialValues: initialProductFormValues,
    validationSchema: addProductValidationSchema,
    onSubmit: async (values) => {
      setSubmitError(null);
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
        category: values.category3 || values.category2 || values.category,
        category2: values.category2 || values.category,
        category3: values.category3,
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
        hsnCode: values.hsnCode.trim() || undefined,
        manufacturerPartNumber:
          values.manufacturerPartNumber.trim() || undefined,
        countryOfOrigin: values.countryOfOrigin.trim() || undefined,
        mrpPrice: Number(values.mrpPrice),
        sellingPrice: Number(values.sellingPrice),
        taxPercentage: Number(values.taxPercentage || 0),
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
