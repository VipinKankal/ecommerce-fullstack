import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { adminSignup, getAdminProfile } from 'State/features/admin/auth/thunks';
import { clearAdminAuthError } from 'State/features/admin/auth/slice';

const AdminSignupForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.adminAuth);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().trim().required('Required'),
      email: Yup.string().email('Invalid email').required('Required'),
      mobileNumber: Yup.string()
        .matches(/^[0-9]{10}$/, 'Enter a valid 10-digit mobile number')
        .required('Required'),
      password: Yup.string()
        .min(6, 'Minimum 6 characters')
        .required('Required'),
    }),
    onSubmit: async (values) => {
      const result = await dispatch(adminSignup(values));
      if (adminSignup.fulfilled.match(result)) {
        await dispatch(getAdminProfile());
        navigate('/admin/dashboard');
      }
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="900" textAlign="center" mb={3}>
        Admin Signup
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          label="Full Name"
          margin="normal"
          {...formik.getFieldProps('fullName')}
          error={formik.touched.fullName && !!formik.errors.fullName}
          helperText={formik.touched.fullName && formik.errors.fullName}
          onFocus={() => dispatch(clearAdminAuthError())}
        />

        <TextField
          fullWidth
          label="Email Address"
          margin="normal"
          {...formik.getFieldProps('email')}
          error={formik.touched.email && !!formik.errors.email}
          helperText={formik.touched.email && formik.errors.email}
          onFocus={() => dispatch(clearAdminAuthError())}
        />

        <TextField
          fullWidth
          label="Mobile Number"
          margin="normal"
          {...formik.getFieldProps('mobileNumber')}
          error={formik.touched.mobileNumber && !!formik.errors.mobileNumber}
          helperText={formik.touched.mobileNumber && formik.errors.mobileNumber}
          onFocus={() => dispatch(clearAdminAuthError())}
        />

        <TextField
          fullWidth
          type="password"
          label="Password"
          margin="normal"
          {...formik.getFieldProps('password')}
          error={formik.touched.password && !!formik.errors.password}
          helperText={formik.touched.password && formik.errors.password}
          onFocus={() => dispatch(clearAdminAuthError())}
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{
            mt: 3,
            py: 1.5,
            bgcolor: '#0f172a',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#020617' },
          }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Create Admin'
          )}
        </Button>
      </form>
    </Box>
  );
};

export default AdminSignupForm;
