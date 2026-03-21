import React from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  InputAdornment,
  Grid,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Validation Schema using Yup
const validationSchema = Yup.object({
  code: Yup.string()
    .required('Coupon code is required')
    .min(3, 'Code is too short'),
  discount: Yup.number()
    .required('Discount is required')
    .min(1, 'Minimum 1% discount')
    .max(100, 'Maximum 100% discount'),
  minOrderValue: Yup.number()
    .required('Minimum order value is required')
    .min(0, 'Cannot be negative'),
  startDate: Yup.date().required('Start date is required').nullable(),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date cannot be before start date')
    .nullable(),
});

const AddNewCouponFrom = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      code: '',
      discount: 0,
      minOrderValue: 0,
      startDate: null,
      endDate: null,
    },
    validationSchema,
    onSubmit: (values) => {
      // Formatting dates only if they exist to prevent crashes
      const formattedData = {
        ...values,
        code: values.code.toUpperCase(),
        startDate: values.startDate
          ? dayjs(values.startDate).format('YYYY-MM-DD')
          : null,
        endDate: values.endDate
          ? dayjs(values.endDate).format('YYYY-MM-DD')
          : null,
      };

      void formattedData;
      alert('Coupon Created Successfully!');
      // navigate("/admin/coupon");
    },
  });

  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', p: { xs: 2, lg: 10 } }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '600px',
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

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Coupon Code */}
            <Grid size={{ xs: 12 }}>
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
                slotProps={{
                  htmlInput: { style: { textTransform: 'uppercase' } },
                }}
              />
            </Grid>

            {/* Discount Percentage */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                name="discount"
                label="Discount (%)"
                type="number"
                value={formik.values.discount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.discount && Boolean(formik.errors.discount)
                }
                helperText={formik.touched.discount && formik.errors.discount}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            {/* Minimum Order Value */}
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

            {/* Date Selection */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Start Date"
                  value={
                    formik.values.startDate
                      ? dayjs(formik.values.startDate)
                      : null
                  }
                  onChange={(val) =>
                    formik.setFieldValue('startDate', val ? val.toDate() : null)
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
                  } // Logical validation
                  onChange={(val) =>
                    formik.setFieldValue('endDate', val ? val.toDate() : null)
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

            {/* Action Buttons */}
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ fontWeight: 'bold' }}
              >
                Create Coupon
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => navigate('/admin/coupon')}
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
