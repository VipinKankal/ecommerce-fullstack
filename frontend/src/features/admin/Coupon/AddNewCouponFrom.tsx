import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { adminCreateCoupon } from 'State/backend/MasterApiThunks';

const validationSchema = Yup.object({
  code: Yup.string().required('Coupon code is required').min(3, 'Code is too short'),
  discountType: Yup.string().required('Discount type is required'),
  discountValue: Yup.number()
    .required('Discount value is required')
    .min(1, 'Minimum discount must be 1'),
  maxDiscount: Yup.number().min(0, 'Cannot be negative').nullable(),
  minOrderValue: Yup.number()
    .required('Minimum order value is required')
    .min(0, 'Cannot be negative'),
  usageLimit: Yup.number().min(1, 'Minimum usage limit is 1').nullable(),
  perUserLimit: Yup.number().min(1, 'Minimum per-user limit is 1').nullable(),
  scopeType: Yup.string().required('Scope type is required'),
  scopeId: Yup.number()
    .nullable()
    .when('scopeType', {
      is: (value: string) => value && value !== 'GLOBAL',
      then: (schema) => schema.required('Scope id is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  userEligibilityType: Yup.string().required('User eligibility is required'),
  inactiveDaysThreshold: Yup.number()
    .nullable()
    .when('userEligibilityType', {
      is: (value: string) => value === 'INACTIVE_USERS_ONLY',
      then: (schema) =>
        schema
          .required('Inactive days threshold is required')
          .min(1, 'Inactive days must be at least 1'),
      otherwise: (schema) => schema.nullable(),
    }),
  startDate: Yup.date().required('Start date is required').nullable(),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date cannot be before start date')
    .nullable(),
});

type AddNewCouponFromProps = {
  embedded?: boolean;
  onCreated?: () => void;
  onCancel?: () => void;
};

const AddNewCouponFrom = ({
  embedded = false,
  onCreated,
  onCancel,
}: AddNewCouponFromProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.masterApi.loading);
  const apiError = useAppSelector((state) => state.masterApi.error);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      code: '',
      discountType: 'PERCENT',
      discountValue: 10,
      maxDiscount: null as number | null,
      minOrderValue: 0,
      usageLimit: null as number | null,
      perUserLimit: 1,
      scopeType: 'GLOBAL',
      scopeId: null as number | null,
      firstOrderOnly: false,
      userEligibilityType: 'ALL_USERS',
      inactiveDaysThreshold: null as number | null,
      startDate: null as Date | null,
      endDate: null as Date | null,
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitError(null);
      try {
        await dispatch(
          adminCreateCoupon({
            code: values.code.toUpperCase(),
            discountType: values.discountType as 'PERCENT' | 'FLAT',
            discountValue: Number(values.discountValue),
            maxDiscount:
              values.maxDiscount === null || values.maxDiscount === 0
                ? null
                : Number(values.maxDiscount),
            minimumOrderValue: Number(values.minOrderValue),
            usageLimit:
              values.usageLimit === null || values.usageLimit === 0
                ? null
                : Number(values.usageLimit),
            perUserLimit:
              values.perUserLimit === null || values.perUserLimit === 0
                ? null
                : Number(values.perUserLimit),
            scopeType: values.scopeType as
              | 'GLOBAL'
              | 'SELLER'
              | 'CATEGORY'
              | 'PRODUCT',
            scopeId:
              values.scopeType === 'GLOBAL' || values.scopeId === null
                ? null
                : Number(values.scopeId),
            firstOrderOnly: Boolean(values.firstOrderOnly),
            userEligibilityType: values.userEligibilityType as
              | 'ALL_USERS'
              | 'NEW_USERS_ONLY'
              | 'RETURNING_USERS_ONLY'
              | 'INACTIVE_USERS_ONLY',
            inactiveDaysThreshold:
              values.userEligibilityType === 'INACTIVE_USERS_ONLY'
                ? Number(values.inactiveDaysThreshold || 30)
                : null,
            active: true,
            validityStartDate: values.startDate
              ? dayjs(values.startDate).format('YYYY-MM-DD')
              : '',
            validityEndDate: values.endDate
              ? dayjs(values.endDate).format('YYYY-MM-DD')
              : '',
          }),
        ).unwrap();
        if (embedded) {
          formik.resetForm();
          onCreated?.();
          return;
        }
        navigate('/admin/coupon');
      } catch (error: unknown) {
        setSubmitError(
          typeof error === 'string' ? error : 'Failed to create coupon.',
        );
      }
    },
  });

  const discountLabel =
    formik.values.discountType === 'PERCENT'
      ? 'Discount (%)'
      : 'Flat Discount';
  const adornment =
    formik.values.discountType === 'PERCENT' ? '%' : 'Rs';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        p: embedded ? 0 : { xs: 2, lg: 10 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '720px',
          p: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}
        >
          Create New Coupon
        </Typography>

        {(submitError || apiError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError || apiError}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
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
                error={
                  formik.touched.discountType &&
                  Boolean(formik.errors.discountType)
                }
                helperText={
                  formik.touched.discountType && formik.errors.discountType
                }
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
                error={
                  formik.touched.discountValue &&
                  Boolean(formik.errors.discountValue)
                }
                helperText={
                  formik.touched.discountValue && formik.errors.discountValue
                }
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
                error={
                  formik.touched.maxDiscount &&
                  Boolean(formik.errors.maxDiscount)
                }
                helperText={
                  formik.touched.maxDiscount && formik.errors.maxDiscount
                }
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
                error={
                  formik.touched.minOrderValue &&
                  Boolean(formik.errors.minOrderValue)
                }
                helperText={
                  formik.touched.minOrderValue && formik.errors.minOrderValue
                }
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
                label={
                  formik.values.scopeType === 'GLOBAL'
                    ? 'Scope Id (not required)'
                    : 'Scope Id'
                }
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
                error={
                  formik.touched.userEligibilityType &&
                  Boolean(formik.errors.userEligibilityType)
                }
                helperText={
                  formik.touched.userEligibilityType &&
                  (formik.errors.userEligibilityType as string)
                }
              >
                <MenuItem value="ALL_USERS">All users</MenuItem>
                <MenuItem value="NEW_USERS_ONLY">New users only</MenuItem>
                <MenuItem
                  value="RETURNING_USERS_ONLY"
                  disabled={Boolean(formik.values.firstOrderOnly)}
                >
                  Returning users only
                </MenuItem>
                <MenuItem
                  value="INACTIVE_USERS_ONLY"
                  disabled={Boolean(formik.values.firstOrderOnly)}
                >
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
                error={
                  formik.touched.inactiveDaysThreshold &&
                  Boolean(formik.errors.inactiveDaysThreshold)
                }
                helperText={
                  formik.touched.inactiveDaysThreshold &&
                  (formik.errors.inactiveDaysThreshold as string)
                }
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
                error={
                  formik.touched.usageLimit &&
                  Boolean(formik.errors.usageLimit)
                }
                helperText={
                  formik.touched.usageLimit && formik.errors.usageLimit
                }
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
                error={
                  formik.touched.perUserLimit &&
                  Boolean(formik.errors.perUserLimit)
                }
                helperText={
                  formik.touched.perUserLimit && formik.errors.perUserLimit
                }
              />
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Start Date"
                  value={
                    formik.values.startDate
                      ? dayjs(formik.values.startDate)
                      : null
                  }
                  onChange={(value) =>
                    formik.setFieldValue('startDate', value ? value.toDate() : null)
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      onBlur: () => formik.setFieldTouched('startDate'),
                      error:
                        formik.touched.startDate &&
                        Boolean(formik.errors.startDate),
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
                  value={
                    formik.values.endDate ? dayjs(formik.values.endDate) : null
                  }
                  minDate={
                    formik.values.startDate
                      ? dayjs(formik.values.startDate)
                      : undefined
                  }
                  onChange={(value) =>
                    formik.setFieldValue('endDate', value ? value.toDate() : null)
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      onBlur: () => formik.setFieldTouched('endDate'),
                      error:
                        formik.touched.endDate &&
                        Boolean(formik.errors.endDate),
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
                onClick={() => {
                  if (embedded) {
                    onCancel?.();
                    return;
                  }
                  navigate('/admin/coupon');
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddNewCouponFrom;
