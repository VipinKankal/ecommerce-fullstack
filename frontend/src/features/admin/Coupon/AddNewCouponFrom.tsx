import React, { useState } from 'react';
import {
  Alert,
  Box,
  Paper,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { adminCreateCoupon } from 'State/backend/MasterApiThunks';
import AddNewCouponFormFields from './AddNewCouponFormFields';
import { validationSchema } from './AddNewCouponForm.support';

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
          <AddNewCouponFormFields
            formik={formik}
            loading={loading}
            embedded={embedded}
            onCancel={() => {
              if (embedded) {
                onCancel?.();
                return;
              }
              navigate('/admin/coupon');
            }}
          />
        </form>
      </Paper>
    </Box>
  );
};

export default AddNewCouponFrom;
