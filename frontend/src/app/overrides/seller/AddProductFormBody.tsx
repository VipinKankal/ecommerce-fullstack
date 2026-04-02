import React from 'react';
import { FormikProps } from 'formik';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  AddProductFormValues,
  categoryThree,
  categoryTwo,
  CONSTRUCTION_OPTIONS,
  emptyVariant,
  FABRIC_OPTIONS,
  FIBER_FAMILY_OPTIONS,
  GENDER_OPTIONS,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  resolveSelectedCategoryLabel,
  SellerProductTaxPreview,
  VariantRow,
} from 'features/seller/products/pages/addProductConfig';

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

const formatMoney = (value?: number | null) =>
  value == null
    ? 'Pending'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(value);

const labelize = (value?: string | null) =>
  value ? value.replaceAll('_', ' ') : '-';

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

  const pricingMode =
    formik.values.pricingMode === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE';
  const sellingPrice = Number(formik.values.sellingPrice || 0);
  const localTaxRate = Number(formik.values.taxPercentage || 0);
  const taxRate = taxPreview?.gstRatePreview ?? localTaxRate;
  const commissionAmount =
    taxPreview?.commissionAmountPreview ??
    Number(formik.values.platformCommission || 0);
  const costPrice = Number(formik.values.costPrice || 0);

  const fallbackTaxableValue =
    pricingMode === 'INCLUSIVE' ? sellingPrice / (1 + localTaxRate / 100 || 1) : sellingPrice;
  const fallbackGstAmount =
    pricingMode === 'INCLUSIVE'
      ? sellingPrice - fallbackTaxableValue
      : fallbackTaxableValue * (localTaxRate / 100);
  const fallbackCommissionGst = commissionAmount * 0.18;
  const fallbackNetReceivable =
    sellingPrice - commissionAmount - fallbackCommissionGst;
  const fallbackProfit = costPrice > 0 ? fallbackNetReceivable - costPrice : null;

  const taxableValue = taxPreview?.taxableValuePreview ?? fallbackTaxableValue;
  const gstAmount = taxPreview?.gstAmountPreview ?? fallbackGstAmount;
  const commissionGst =
    taxPreview?.commissionGstPreview ?? fallbackCommissionGst;
  const tcsAmount = taxPreview?.tcsAmountPreview ?? 0;
  const netReceivable =
    taxPreview?.netPayoutPreview ?? fallbackNetReceivable;
  const estimatedProfit =
    taxPreview?.estimatedProfitPreview ?? fallbackProfit;
  const appliedTaxRuleVersion =
    taxPreview?.gstRuleCode || formik.values.taxRuleVersion || 'AUTO_ACTIVE';
  const selectedCategoryLabel = resolveSelectedCategoryLabel(formik.values);
  const slabHint = taxPreview?.valueBasis
    ? `${labelize(taxPreview.valueBasis)} based preview for ${selectedCategoryLabel || 'selected category'}.`
    : taxableValue <= 1000
      ? 'Lower slab preview based on the current draft inputs.'
      : taxableValue <= 2500
        ? 'Near slab transition range. Verify the active rule version before publishing.'
        : 'Higher slab preview based on the current draft inputs.';
  const submitLabel = taxPreview?.requiresReview
    ? 'CREATE PRODUCT (PENDING REVIEW)'
    : 'CREATE PRODUCT';

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Product Media
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="p-img"
            type="file"
            onChange={handleImageUpload}
          />
          <label htmlFor="p-img">
            <Box
              sx={{
                width: 120,
                height: 120,
                border: '2px dashed #ccc',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {uploading ? (
                <CircularProgress size={24} />
              ) : (
                <AddPhotoAlternateIcon color="action" />
              )}
            </Box>
          </label>
          {formik.values.images.map((img, index) => (
            <Box
              key={img}
              sx={{ position: 'relative', width: 120, height: 120 }}
            >
              <img
                src={img}
                alt="preview"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  objectFit: 'cover',
                }}
              />
              <IconButton
                size="small"
                onClick={() =>
                  formik.setFieldValue(
                    'images',
                    formik.values.images.filter((_, i) => i !== index),
                  )
                }
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'white',
                  boxShadow: 1,
                }}
              >
                <CloseIcon sx={{ fontSize: 16, color: 'red' }} />
              </IconButton>
            </Box>
          ))}
        </Box>
        {formik.touched.images && formik.errors.images && (
          <Typography variant="caption" color="error">
            {formik.errors.images as string}
          </Typography>
        )}
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Basic Information
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          label="Product Title"
          {...formik.getFieldProps('title')}
          error={formik.touched.title && !!formik.errors.title}
          helperText={formik.touched.title && formik.errors.title}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="Brand"
          {...formik.getFieldProps('brand')}
          error={formik.touched.brand && !!formik.errors.brand}
          helperText={formik.touched.brand && formik.errors.brand}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          label="Short Description"
          {...formik.getFieldProps('shortDescription')}
          error={
            formik.touched.shortDescription && !!formik.errors.shortDescription
          }
          helperText={
            formik.touched.shortDescription && formik.errors.shortDescription
          }
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Detailed Description"
          {...formik.getFieldProps('description')}
          error={formik.touched.description && !!formik.errors.description}
          helperText={descriptionHelperText}
          inputProps={{ maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH }}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Product Highlights (one per line)"
          {...formik.getFieldProps('productHighlights')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Search Keywords (comma separated)"
          {...formik.getFieldProps('searchKeywords')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Tags (comma separated)"
          {...formik.getFieldProps('tags')}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Category And Classification
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          fullWidth
          label="Main Category"
          {...formik.getFieldProps('category')}
          onChange={(e) => {
            formik.setFieldValue('category', e.target.value);
            formik.setFieldValue('category2', '');
            formik.setFieldValue('category3', '');
          }}
        >
          <MenuItem value="men">Men</MenuItem>
          <MenuItem value="women">Women</MenuItem>
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          fullWidth
          label="Sub Category"
          {...formik.getFieldProps('category2')}
          disabled={!formik.values.category}
        >
          {categoryTwo[formik.values.category] ? (
            categoryTwo[formik.values.category].map((item) => (
              <MenuItem key={item.categoryId} value={item.categoryId}>
                {item.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled value="">
              Select Main Category
            </MenuItem>
          )}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          fullWidth
          label="Third Category"
          {...formik.getFieldProps('category3')}
          disabled={!formik.values.category2}
        >
          {categoryThree[formik.values.category]?.filter(
            (x) => x.parentCategoryId === formik.values.category2,
          ).length > 0 ? (
            categoryThree[formik.values.category]
              .filter((x) => x.parentCategoryId === formik.values.category2)
              .map((item) => (
                <MenuItem key={item.categoryId} value={item.categoryId}>
                  {item.name}
                </MenuItem>
              ))
          ) : (
            <MenuItem disabled value="">
              No options found
            </MenuItem>
          )}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          fullWidth
          label="Gender"
          {...formik.getFieldProps('gender')}
        >
          <MenuItem value="">Not specified</MenuItem>
          {GENDER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          fullWidth
          label="Fabric"
          {...formik.getFieldProps('fabricType')}
        >
          <MenuItem value="">Not specified</MenuItem>
          {FABRIC_OPTIONS.map((option) => (
            <MenuItem key={option} value={option.toUpperCase().replaceAll(' ', '_')}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          fullWidth
          label="Construction"
          {...formik.getFieldProps('constructionType')}
          error={
            formik.touched.constructionType &&
            !!formik.errors.constructionType
          }
          helperText={
            (formik.touched.constructionType && formik.errors.constructionType) ||
            'Required for HSN chapter and GST rule mapping'
          }
        >
          {CONSTRUCTION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          select
          fullWidth
          label="Fibre Family (required for fibre-based categories)"
          {...formik.getFieldProps('fiberFamily')}
          helperText="Use this for saree / dhoti / textile mappings when CA-approved HSN depends on fibre."
        >
          <MenuItem value="">Not applicable</MenuItem>
          {FIBER_FAMILY_OPTIONS.map((option) => (
            <MenuItem key={option} value={option.toUpperCase().replaceAll(' ', '_')}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Identification And Pricing
        </Typography>
      </Grid>
      {[
        ['sku', 'Primary SKU'],
        ['barcode', 'Barcode'],
        ['modelNumber', 'Model Number'],
        ['manufacturerPartNumber', 'Manufacturer Part Number'],
        ['countryOfOrigin', 'Country of Origin'],
        ['mrpPrice', 'MRP Price'],
        ['sellingPrice', 'Selling Price'],
        ['platformCommission', 'Platform Commission'],
        ['costPrice', 'Cost Price (optional)'],
      ].map(([field, label]) => (
        <Grid key={field} size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label={label}
            type={
              [
                'mrpPrice',
                'sellingPrice',
                'platformCommission',
                'costPrice',
              ].includes(field)
                ? 'number'
                : 'text'
            }
            {...formik.getFieldProps(field)}
          />
        </Grid>
      ))}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Pricing Mode"
          {...formik.getFieldProps('pricingMode')}
        >
          <MenuItem value="INCLUSIVE">Tax Inclusive</MenuItem>
          <MenuItem value="EXCLUSIVE">Tax Exclusive</MenuItem>
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Currency"
          {...formik.getFieldProps('currency')}
        >
          <MenuItem value="INR">INR</MenuItem>
          <MenuItem value="USD">USD</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          GST / HSN Resolution
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="Resolved HSN"
          value={taxPreview?.resolvedHsnCode || formik.values.hsnCode || ''}
          InputProps={{ readOnly: true }}
          helperText="Admin rule engine decides this after category/classification selection"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Alert severity="info">
          HSN and GST are auto-resolved from admin-configured rules only. Manual
          seller override is disabled.
        </Alert>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: '#f8fafc',
            borderColor: '#dbeafe',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              GST / Profit Preview
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {taxPreviewLoading && (
                <Chip size="small" color="info" label="Resolving preview" />
              )}
              <Chip
                size="small"
                color={taxPreview?.requiresReview ? 'warning' : 'info'}
                label={`Rule: ${appliedTaxRuleVersion}`}
              />
              <Chip
                size="small"
                color={
                  taxPreview?.sellerTaxEligible === false ? 'error' : 'success'
                }
                label={labelize(
                  taxPreview?.sellerTaxEligibilityStatus || 'ELIGIBLE',
                )}
              />
              <Chip
                size="small"
                variant="outlined"
                label={labelize(
                  taxPreview?.reviewStatus || formik.values.taxReviewStatus,
                )}
              />
            </Box>
          </Box>
          {taxPreviewError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {taxPreviewError}
            </Alert>
          )}
          {taxPreview?.note && (
            <Alert
              severity={taxPreview.sellerTaxEligible === false ? 'error' : 'info'}
              sx={{ mb: 2 }}
            >
              {taxPreview.note}
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <div>
              <strong>Suggested HSN:</strong>{' '}
              {taxPreview?.suggestedHsnCode || formik.values.suggestedHsnCode || 'Pending'}
            </div>
            <div>
              <strong>HSN Chapter:</strong> {taxPreview?.hsnChapter || 'Pending'}
            </div>
            <div>
              <strong>Tax Class:</strong>{' '}
              {taxPreview?.taxClass || formik.values.taxClass || 'Pending'}
            </div>
            <div>
              <strong>Effective Rule Date:</strong>{' '}
              {taxPreview?.effectiveRuleDate || 'Pending'}
            </div>
            <div>
              <strong>Rule Basis:</strong> {labelize(taxPreview?.valueBasis)}
            </div>
            <div>
              <strong>GST Rate:</strong>{' '}
              {taxRate ? `${taxRate}%` : 'Pending'}
            </div>
            <div>
              <strong>Taxable:</strong> {formatMoney(taxableValue)}
            </div>
            <div>
              <strong>GST Amount:</strong> {formatMoney(gstAmount)}
            </div>
            <div>
              <strong>Commission:</strong> {formatMoney(commissionAmount)}
            </div>
            <div>
              <strong>Commission GST:</strong> {formatMoney(commissionGst)}
            </div>
            <div>
              <strong>TCS Preview:</strong> {formatMoney(tcsAmount)}
            </div>
            <div>
              <strong>Net Payout:</strong> {formatMoney(netReceivable)}
            </div>
          </div>
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 1, color: '#334155' }}
          >
            {slabHint}
          </Typography>
          {taxPreview?.requiresFiberSelection && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: '#b45309' }}>
              Fibre family is required before this product can receive a CA-approved HSN mapping.
            </Typography>
          )}
          {estimatedProfit !== null && (
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                fontWeight: 700,
                color: estimatedProfit >= 0 ? '#166534' : '#b91c1c',
              }}
            >
              Estimated Profit: {formatMoney(estimatedProfit)}
            </Typography>
          )}
        </Paper>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Inventory & Shipping
        </Typography>
      </Grid>
      {[
        ['stockQuantity', 'Seller Stock'],
        ['minOrderQuantity', 'Min Order Quantity'],
        ['maxOrderQuantity', 'Max Order Quantity'],
        ['reservedQuantity', 'Reserved Quantity'],
        ['warehouseLocation', 'Warehouse Location'],
        ['weight', 'Weight (kg)'],
        ['length', 'Length (cm)'],
        ['width', 'Width (cm)'],
        ['height', 'Height (cm)'],
        ['color', 'Primary Color'],
        ['sizes', 'Sizes (comma separated)'],
      ].map(([field, label]) => (
        <Grid key={field} size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label={label}
            type={
              field === 'warehouseLocation' ||
              field === 'color' ||
              field === 'sizes'
                ? 'text'
                : 'number'
            }
            {...formik.getFieldProps(field)}
          />
        </Grid>
      ))}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Stock Status"
          {...formik.getFieldProps('stockStatus')}
        >
          <MenuItem value="IN_STOCK">In Stock</MenuItem>
          <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
          <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
          <MenuItem value="PRE_ORDER">Pre Order</MenuItem>
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Package Type"
          {...formik.getFieldProps('packageType')}
        >
          <MenuItem value="BOX">Box</MenuItem>
          <MenuItem value="BAG">Bag</MenuItem>
          <MenuItem value="ENVELOPE">Envelope</MenuItem>
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Shipping Class"
          {...formik.getFieldProps('shippingClass')}
        >
          <MenuItem value="STANDARD">Standard</MenuItem>
          <MenuItem value="EXPRESS">Express</MenuItem>
          <MenuItem value="HEAVY">Heavy</MenuItem>
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Video URL"
          {...formik.getFieldProps('videoUrl')}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Warranty, Compliance & SEO
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Warranty Type"
          {...formik.getFieldProps('warrantyType')}
        >
          <MenuItem value="NONE">No Warranty</MenuItem>
          <MenuItem value="BRAND">Brand Warranty</MenuItem>
          <MenuItem value="SELLER">Seller Warranty</MenuItem>
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth
          type="number"
          label="Warranty Days"
          {...formik.getFieldProps('warrantyDays')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth
          type="number"
          label="Return Window Days"
          {...formik.getFieldProps('returnWindowDays')}
        />
      </Grid>
      {[
        ['manufacturerName', 'Manufacturer Name'],
        ['manufacturerAddress', 'Manufacturer Address'],
        ['packerName', 'Packer Name'],
        ['importerName', 'Importer Name'],
        ['metaTitle', 'Meta Title'],
        ['metaDescription', 'Meta Description'],
      ].map(([field, label]) => (
        <Grid key={field} size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={label}
            {...formik.getFieldProps(field)}
            multiline={
              field === 'manufacturerAddress' || field === 'metaDescription'
            }
            rows={
              field === 'manufacturerAddress' || field === 'metaDescription'
                ? 2
                : undefined
            }
          />
        </Grid>
      ))}
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Safety Information"
          {...formik.getFieldProps('safetyInformation')}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Product Variants
          </Typography>
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
          >
            Add Variant
          </Button>
        </Box>
      </Grid>
      {variants.map((variant, index) => (
        <Grid
          key={
            variant.sku ||
            `${variant.variantType}-${variant.variantValue}-${variant.size}-${variant.color}`
          }
          size={{ xs: 12 }}
        >
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TextField
                select
                label="Variant Type"
                value={variant.variantType}
                onChange={(e) =>
                  updateVariant(index, 'variantType', e.target.value)
                }
              >
                <MenuItem value="SIZE_COLOR">Size + Color</MenuItem>
                <MenuItem value="SIZE">Size</MenuItem>
                <MenuItem value="COLOR">Color</MenuItem>
              </TextField>
              <TextField
                label="Variant Value"
                value={variant.variantValue}
                onChange={(e) =>
                  updateVariant(index, 'variantValue', e.target.value)
                }
              />
              <TextField
                label="Variant SKU"
                value={variant.sku}
                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
              />
              <TextField
                label="Size"
                value={variant.size}
                onChange={(e) => updateVariant(index, 'size', e.target.value)}
              />
              <TextField
                label="Color"
                value={variant.color}
                onChange={(e) => updateVariant(index, 'color', e.target.value)}
              />
              <TextField
                type="number"
                label="Price"
                value={variant.price}
                onChange={(e) => updateVariant(index, 'price', e.target.value)}
              />
              <TextField
                type="number"
                label="Quantity"
                value={variant.quantity}
                onChange={(e) =>
                  updateVariant(index, 'quantity', e.target.value)
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  color="error"
                  onClick={() =>
                    setVariants((prev) =>
                      prev.filter((_, i) => i !== index || prev.length === 1),
                    )
                  }
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            </div>
          </Paper>
        </Grid>
      ))}

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
