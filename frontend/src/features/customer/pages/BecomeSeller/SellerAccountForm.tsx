import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Step,
  StepLabel,
  Stepper,
} from '@mui/material';
import { FormikErrors, FormikTouched, useFormik } from 'formik';
import * as Yup from 'yup';
import BecomeSellerFormStep2 from './BecomeSellerFormStep2';
import BecomeSellerFormStep3 from './BecomeSellerFormStep3';
import BecomeSellerFormStep4 from './BecomeSellerFormStep4';
import BecomeSellerFormStep1 from './BecomeSellerFormStep1';
import BecomeSellerFormStep5 from './BecomeSellerFormStep5';
import BecomeSellerFormStep6 from './BecomeSellerFormStep6';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { clearAuthError } from 'State/features/seller/auth/slice';
import { registerSeller } from 'State/features/seller/auth/thunks';
import { SellerAccountFormValues } from './types';

const steps = [
  'Personal Info',
  'Business Info',
  'Address',
  'Bank Details',
  'KYC',
  'Store Info',
];

const buildTouchedState = <T,>(errors: FormikErrors<T>): FormikTouched<T> => {
  const touchedEntries = Object.entries(errors).map(([key, value]) => {
    if (!value || typeof value === 'string') {
      return [key, true];
    }

    if (Array.isArray(value)) {
      return [
        key,
        value.map((item) =>
          typeof item === 'string'
            ? true
            : buildTouchedState(item as FormikErrors<unknown>),
        ),
      ];
    }

    return [key, buildTouchedState(value as FormikErrors<unknown>)];
  });

  return Object.fromEntries(touchedEntries) as FormikTouched<T>;
};

const validationSchemas = [
  Yup.object({
    sellerName: Yup.string().required('Required'),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, 'Must be 10 digits')
      .required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(6, 'Min 6 chars').required('Required'),
    dateOfBirth: Yup.string().required('Required'),
    storeDetails: Yup.object({
      primaryCategory: Yup.string().required('Required'),
    }),
  }),
  Yup.object({
    gstin: Yup.string()
      .length(15, 'GSTIN must be 15 chars')
      .required('Required'),
    businessDetails: Yup.object({
      businessName: Yup.string().required('Required'),
      businessType: Yup.string().required('Required'),
      panNumber: Yup.string().required('Required'),
    }),
  }),
  Yup.object({
    pickupAddress: Yup.object({
      name: Yup.string().required('Required'),
      mobile: Yup.string()
        .matches(/^[0-9]{10}$/, 'Must be 10 digits')
        .required('Required'),
      pincode: Yup.string().length(6, 'Invalid Pincode').required('Required'),
      address: Yup.string().required('Required'),
      city: Yup.string().required('Required'),
      state: Yup.string().required('Required'),
      country: Yup.string().required('Required'),
    }),
  }),
  Yup.object({
    bankDetails: Yup.object({
      bankName: Yup.string().required('Required'),
      accountNumber: Yup.string().min(9).max(18).required('Required'),
      ifscCode: Yup.string().required('Required'),
      accountHolderName: Yup.string().required('Required'),
    }),
  }),
  Yup.object({
    kycDetails: Yup.object({
      panCardUrl: Yup.string().required('Required'),
      aadhaarCardUrl: Yup.string().required('Required'),
      gstCertificateUrl: Yup.string().required('Required'),
    }),
  }),
  Yup.object({
    storeDetails: Yup.object({
      storeName: Yup.string().required('Required'),
      storeDescription: Yup.string().required('Required'),
      supportEmail: Yup.string().email('Invalid email').required('Required'),
      supportPhone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Must be 10 digits')
        .required('Required'),
    }),
  }),
];

interface SellerAccountFormProps {
  onRegisterSuccess?: () => void;
}

const SellerAccountForm = ({ onRegisterSuccess }: SellerAccountFormProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.sellerAuth);

  const formik = useFormik<SellerAccountFormValues>({
    initialValues: {
      sellerName: '',
      mobile: '',
      email: '',
      password: '',
      dateOfBirth: '',
      gstin: '',
      pickupAddress: {
        name: '',
        mobile: '',
        pincode: '',
        address: '',
        locality: '',
        city: '',
        state: '',
        country: 'India',
      },
      bankDetails: {
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
      },
      businessDetails: {
        businessName: '',
        businessType: '',
        gstNumber: '',
        panNumber: '',
      },
      kycDetails: {
        panCardUrl: '',
        aadhaarCardUrl: '',
        gstCertificateUrl: '',
        panCardUrlName: '',
        aadhaarCardUrlName: '',
        gstCertificateUrlName: '',
      },
      storeDetails: {
        storeName: '',
        storeLogo: '',
        storeLogoName: '',
        storeDescription: '',
        primaryCategory: '',
        supportEmail: '',
        supportPhone: '',
      },
    },
    validationSchema: validationSchemas[activeStep],
    onSubmit: async (values) => {
      dispatch(clearAuthError());
      const finalData = {
        sellerName: values.sellerName,
        mobileNumber: values.mobile,
        email: values.email,
        password: values.password,
        dateOfBirth: values.dateOfBirth || null,
        GSTIN: values.gstin,
        pickupAddress: {
          name: values.pickupAddress.name,
          mobileNumber: values.pickupAddress.mobile || values.mobile,
          street: values.pickupAddress.address || 'N/A',
          locality: values.pickupAddress.locality || 'N/A',
          address: values.pickupAddress.address || 'N/A',
          city: values.pickupAddress.city,
          state: values.pickupAddress.state,
          pinCode: values.pickupAddress.pincode,
          country: values.pickupAddress.country,
        },
        businessDetails: {
          businessName: values.businessDetails.businessName,
          businessType: values.businessDetails.businessType,
          gstNumber: values.gstin,
          panNumber: values.businessDetails.panNumber,
        },
        bankDetails: {
          accountNumber: values.bankDetails.accountNumber,
          ifscCode: values.bankDetails.ifscCode,
          accountHolderName: values.bankDetails.accountHolderName,
          bankName: values.bankDetails.bankName,
        },
        kycDetails: {
          panCardUrl: values.kycDetails.panCardUrl,
          aadhaarCardUrl: values.kycDetails.aadhaarCardUrl,
          gstCertificateUrl: values.kycDetails.gstCertificateUrl,
        },
        storeDetails: {
          storeName: values.storeDetails.storeName,
          storeLogo: values.storeDetails.storeLogo,
          storeDescription: values.storeDetails.storeDescription,
          primaryCategory: values.storeDetails.primaryCategory,
          supportEmail: values.storeDetails.supportEmail || values.email,
          supportPhone: values.storeDetails.supportPhone || values.mobile,
        },
      };

      const result = await dispatch(registerSeller(finalData));
      if (registerSeller.fulfilled.match(result)) {
        sessionStorage.setItem('pending_seller_email', values.email);
        onRegisterSuccess?.();
      }
    },
  });

  const handleNext = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length === 0) {
      if (activeStep < steps.length - 1) {
        setActiveStep((prev) => prev + 1);
      } else {
        formik.handleSubmit();
      }
    } else {
      formik.setTouched(buildTouchedState(errors));
    }
  };

  return (
    <Box className="w-full max-w-2xl mx-auto">
      <Stepper activeStep={activeStep} alternativeLabel className="mb-10">
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box className="min-h-[400px]">
        {activeStep === 0 && <BecomeSellerFormStep1 formik={formik} />}
        {activeStep === 1 && <BecomeSellerFormStep2 formik={formik} />}
        {activeStep === 2 && <BecomeSellerFormStep3 formik={formik} />}
        {activeStep === 3 && <BecomeSellerFormStep4 formik={formik} />}
        {activeStep === 4 && <BecomeSellerFormStep5 formik={formik} />}
        {activeStep === 5 && <BecomeSellerFormStep6 formik={formik} />}
      </Box>

      <div className="flex justify-between mt-10">
        <Button
          variant="outlined"
          onClick={() => setActiveStep(activeStep - 1)}
          disabled={activeStep === 0 || loading}
        >
          Back
        </Button>
        <Button variant="contained" onClick={handleNext} disabled={loading}>
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : activeStep === steps.length - 1 ? (
            'Create Account'
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </Box>
  );
};

export default SellerAccountForm;
