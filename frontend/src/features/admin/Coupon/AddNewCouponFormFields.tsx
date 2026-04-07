import React from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { FormikProps } from 'formik';

type CouponFormValues = {
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  usageLimit: number | null;
  perUserLimit: number;
  scopeType: string;
  scopeId: number | null;
  firstOrderOnly: boolean;
  userEligibilityType: string;
  inactiveDaysThreshold: number | null;
  startDate: Date | null;
  endDate: Date | null;
};

type Props = {
  formik: FormikProps<CouponFormValues>;
  loading: boolean;
  embedded: boolean;
  onCancel: () => void;
};

const AddNewCouponFormFields = ({ formik, loading, embedded, onCancel }: Props) => {
  const discountLabel =
    formik.values.discountType === 'PERCENT'
      ? 'Discount (%)'
      : 'Flat Discount';
  const adornment =
    formik.values.discountType === 'PERCENT' ? '%' : 'Rs';

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="code"
          label="Coupon Code"
          placeholder="E.g. WELCOME2026"
          value={formik.values.code}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.code && Boolean(formik.errors.code)}
          helperText={formik.touched.code && formik.errors.code}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          name="discountType"
          label="Discount Type"
          value={formik.values.discountType}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.discountType && Boolean(formik.errors.discountType)}
          helperText={formik.touched.discountType && formik.errors.discountType}
        >
          <MenuItem value="PERCENT">Percent</MenuItem>
          <MenuItem value="FLAT">Flat</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="discountValue"
          label={discountLabel}
          type="number"
          value={formik.values.discountValue}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.discountValue && Boolean(formik.errors.discountValue)}
          helperText={formik.touched.discountValue && formik.errors.discountValue}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">{adornment}</InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="maxDiscount"
          label="Max Discount"
          type="number"
          value={formik.values.maxDiscount ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.maxDiscount && Boolean(formik.errors.maxDiscount)}
          helperText={formik.touched.maxDiscount && formik.errors.maxDiscount}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">Rs</InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="minOrderValue"
          label="Min Order Value"
          type="number"
          value={formik.values.minOrderValue}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.minOrderValue && Boolean(formik.errors.minOrderValue)}
          helperText={formik.touched.minOrderValue && formik.errors.minOrderValue}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">Rs</InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          name="scopeType"
          label="Scope Type"
          value={formik.values.scopeType}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.scopeType && Boolean(formik.errors.scopeType)}
          helperText={formik.touched.scopeType && (formik.errors.scopeType as string)}
        >
          <MenuItem value="GLOBAL">Global</MenuItem>
          <MenuItem value="SELLER">Seller</MenuItem>
          <MenuItem value="CATEGORY">Category</MenuItem>
          <MenuItem value="PRODUCT">Product</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="scopeId"
          label={formik.values.scopeType === 'GLOBAL' ? 'Scope Id (not required)' : 'Scope Id'}
          type="number"
          value={formik.values.scopeId ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.scopeId && Boolean(formik.errors.scopeId)}
          helperText={formik.touched.scopeId && (formik.errors.scopeId as string)}
          disabled={formik.values.scopeType === 'GLOBAL'}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <FormControlLabel
          control={
            <Checkbox
              name="firstOrderOnly"
              checked={Boolean(formik.values.firstOrderOnly)}
              onChange={(event) => {
                const checked = event.target.checked;
                formik.setFieldValue('firstOrderOnly', checked);
                if (
                  checked &&
                  !['ALL_USERS', 'NEW_USERS_ONLY'].includes(
                    formik.values.userEligibilityType,
                  )
                ) {
                  formik.setFieldValue('userEligibilityType', 'NEW_USERS_ONLY');
                }
              }}
            />
          }
          label="First order users only"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          name="userEligibilityType"
          label="User Eligibility"
          value={formik.values.userEligibilityType}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.userEligibilityType && Boolean(formik.errors.userEligibilityType)}
          helperText={formik.touched.userEligibilityType && (formik.errors.userEligibilityType as string)}
        >
          <MenuItem value="ALL_USERS">All users</MenuItem>
          <MenuItem value="NEW_USERS_ONLY">New users only</MenuItem>
          <MenuItem value="RETURNING_USERS_ONLY" disabled={Boolean(formik.values.firstOrderOnly)}>
            Returning users only
          </MenuItem>
          <MenuItem value="INACTIVE_USERS_ONLY" disabled={Boolean(formik.values.firstOrderOnly)}>
            Inactive users only
          </MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="inactiveDaysThreshold"
          label="Inactive Days Threshold"
          type="number"
          value={formik.values.inactiveDaysThreshold ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.inactiveDaysThreshold && Boolean(formik.errors.inactiveDaysThreshold)}
          helperText={formik.touched.inactiveDaysThreshold && (formik.errors.inactiveDaysThreshold as string)}
          disabled={formik.values.userEligibilityType !== 'INACTIVE_USERS_ONLY'}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="usageLimit"
          label="Usage Limit"
          type="number"
          value={formik.values.usageLimit ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.usageLimit && Boolean(formik.errors.usageLimit)}
          helperText={formik.touched.usageLimit && formik.errors.usageLimit}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          name="perUserLimit"
          label="Per User Limit"
          type="number"
          value={formik.values.perUserLimit ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.perUserLimit && Boolean(formik.errors.perUserLimit)}
          helperText={formik.touched.perUserLimit && formik.errors.perUserLimit}
        />
      </Grid>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label="Start Date"
            value={formik.values.startDate ? dayjs(formik.values.startDate) : null}
            onChange={(value) =>
              formik.setFieldValue('startDate', value ? value.toDate() : null)
            }
            slotProps={{
              textField: {
                fullWidth: true,
                onBlur: () => formik.setFieldTouched('startDate'),
                error: formik.touched.startDate && Boolean(formik.errors.startDate),
                helperText:
                  formik.touched.startDate &&
                  (formik.errors.startDate as string),
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label="End Date"
            value={formik.values.endDate ? dayjs(formik.values.endDate) : null}
            minDate={formik.values.startDate ? dayjs(formik.values.startDate) : undefined}
            onChange={(value) =>
              formik.setFieldValue('endDate', value ? value.toDate() : null)
            }
            slotProps={{
              textField: {
                fullWidth: true,
                onBlur: () => formik.setFieldTouched('endDate'),
                error: formik.touched.endDate && Boolean(formik.errors.endDate),
                helperText:
                  formik.touched.endDate &&
                  (formik.errors.endDate as string),
              },
            }}
          />
        </Grid>
      </LocalizationProvider>

      <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ fontWeight: 'bold' }}
        >
          {loading ? 'Creating...' : 'Create Coupon'}
        </Button>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={onCancel}
        >
          {embedded ? 'Close' : 'Cancel'}
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddNewCouponFormFields;
