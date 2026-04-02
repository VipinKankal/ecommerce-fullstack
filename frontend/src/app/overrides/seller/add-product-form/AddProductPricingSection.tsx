import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { resolveSelectedCategoryLabel } from 'features/seller/products/pages/addProductConfig';
import { AddProductPricingSectionProps } from './types';

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

const AddProductPricingSection = ({
  formik,
  taxPreview,
  taxPreviewLoading,
  taxPreviewError,
}: AddProductPricingSectionProps) => {
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
    pricingMode === 'INCLUSIVE'
      ? sellingPrice / (1 + localTaxRate / 100 || 1)
      : sellingPrice;
  const fallbackGstAmount =
    pricingMode === 'INCLUSIVE'
      ? sellingPrice - fallbackTaxableValue
      : fallbackTaxableValue * (localTaxRate / 100);
  const fallbackCommissionGst = commissionAmount * 0.18;
  const fallbackNetReceivable =
    sellingPrice - commissionAmount - fallbackCommissionGst;
  const fallbackProfit =
    costPrice > 0 ? fallbackNetReceivable - costPrice : null;
  const taxableValue = taxPreview?.taxableValuePreview ?? fallbackTaxableValue;
  const gstAmount = taxPreview?.gstAmountPreview ?? fallbackGstAmount;
  const commissionGst =
    taxPreview?.commissionGstPreview ?? fallbackCommissionGst;
  const tcsAmount = taxPreview?.tcsAmountPreview ?? 0;
  const netReceivable = taxPreview?.netPayoutPreview ?? fallbackNetReceivable;
  const estimatedProfit = taxPreview?.estimatedProfitPreview ?? fallbackProfit;
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

  return (
    <>
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
              severity={
                taxPreview.sellerTaxEligible === false ? 'error' : 'info'
              }
              sx={{ mb: 2 }}
            >
              {taxPreview.note}
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <div>
              <strong>Suggested HSN:</strong>{' '}
              {taxPreview?.suggestedHsnCode ||
                formik.values.suggestedHsnCode ||
                'Pending'}
            </div>
            <div>
              <strong>HSN Chapter:</strong>{' '}
              {taxPreview?.hsnChapter || 'Pending'}
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
              <strong>GST Rate:</strong> {taxRate ? `${taxRate}%` : 'Pending'}
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
            <Typography
              variant="body2"
              sx={{ mt: 1, fontWeight: 700, color: '#b45309' }}
            >
              Fibre family is required before this product can receive a
              CA-approved HSN mapping.
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
    </>
  );
};

export default AddProductPricingSection;
