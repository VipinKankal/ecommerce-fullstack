import { RootState, useAppDispatch, useAppSelector } from 'app/store/Store';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchSellerProfile,
  updateSellerProfile,
} from 'State/features/seller/auth/thunks';
import { emptyForm } from '../profileConfig';
import { SellerProfileForm } from '../types';
import { getErrorMessage } from 'shared/errors/apiError';

type SellerProfile = NonNullable<RootState['sellerAuth']['profile']>;

const mapProfileToForm = (profile: SellerProfile): SellerProfileForm => ({
  sellerName: profile?.sellerName || '',
  mobileNumber: profile?.mobileNumber || '',
  email: profile?.email || '',
  dateOfBirth: profile?.dateOfBirth || '',
  GSTIN: profile?.GSTIN || profile?.businessDetails?.gstNumber || '',
  businessDetails: {
    businessName: profile?.businessDetails?.businessName || '',
    businessType: profile?.businessDetails?.businessType || '',
    gstNumber: profile?.businessDetails?.gstNumber || profile?.GSTIN || '',
    panNumber: profile?.businessDetails?.panNumber || '',
  },
  pickupAddress: {
    name: profile?.pickupAddress?.name || '',
    mobileNumber: profile?.pickupAddress?.mobileNumber || '',
    address: profile?.pickupAddress?.address || '',
    locality: profile?.pickupAddress?.locality || '',
    city: profile?.pickupAddress?.city || '',
    state: profile?.pickupAddress?.state || '',
    pinCode: profile?.pickupAddress?.pinCode || '',
    country: profile?.pickupAddress?.country || 'India',
  },
  bankDetails: {
    accountHolderName: profile?.bankDetails?.accountHolderName || '',
    bankName: profile?.bankDetails?.bankName || '',
    accountNumber: profile?.bankDetails?.accountNumber || '',
    ifscCode: profile?.bankDetails?.ifscCode || '',
  },
  kycDetails: {
    panCardUrl: profile?.kycDetails?.panCardUrl || '',
    aadhaarCardUrl: profile?.kycDetails?.aadhaarCardUrl || '',
    gstCertificateUrl: profile?.kycDetails?.gstCertificateUrl || '',
  },
  storeDetails: {
    storeName: profile?.storeDetails?.storeName || '',
    storeLogo: profile?.storeDetails?.storeLogo || '',
    storeDescription: profile?.storeDetails?.storeDescription || '',
    primaryCategory: profile?.storeDetails?.primaryCategory || '',
    supportEmail: profile?.storeDetails?.supportEmail || '',
    supportPhone: profile?.storeDetails?.supportPhone || '',
  },
});

export const useSellerProfile = () => {
  const dispatch = useAppDispatch();
  const { profile, loading, error, message } = useAppSelector(
    (state) => state.sellerAuth,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<SellerProfileForm>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const profileForm = useMemo(
    () => (profile ? mapProfileToForm(profile) : emptyForm),
    [profile],
  );

  useEffect(() => {
    dispatch(fetchSellerProfile());
  }, [dispatch]);

  const updateRoot = (field: keyof SellerProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSection = <T extends keyof SellerProfileForm>(
    section: T,
    field: keyof SellerProfileForm[T],
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, string>),
        [field]: value,
      },
    }));
  };

  const validationError = useMemo(() => {
    if (!isEditing) return null;
    if (!form.sellerName.trim()) return 'Full name is required.';
    if (!/^[0-9]{10}$/.test(form.mobileNumber.trim())) {
      return 'Mobile number must be 10 digits.';
    }
    if (!form.dateOfBirth) return 'Date of birth is required.';
    if (!form.businessDetails.businessName.trim()) {
      return 'Business name is required.';
    }
    if (!form.businessDetails.businessType.trim()) {
      return 'Business type is required.';
    }
    if (!form.GSTIN.trim()) return 'GST number is required.';
    if (!form.businessDetails.panNumber.trim())
      return 'PAN number is required.';
    if (!form.pickupAddress.address.trim())
      return 'Pickup address is required.';
    if (!form.pickupAddress.city.trim() || !form.pickupAddress.state.trim()) {
      return 'Pickup city and state are required.';
    }
    if (!/^[0-9]{6}$/.test(form.pickupAddress.pinCode.trim())) {
      return 'Pickup pincode must be 6 digits.';
    }
    if (!form.bankDetails.accountHolderName.trim()) {
      return 'Account holder name is required.';
    }
    if (!form.bankDetails.bankName.trim()) return 'Bank name is required.';
    if (!form.bankDetails.accountNumber.trim()) {
      return 'Account number is required.';
    }
    if (!form.bankDetails.ifscCode.trim()) return 'IFSC code is required.';
    if (!form.storeDetails.storeName.trim()) return 'Store name is required.';
    if (!form.storeDetails.primaryCategory.trim()) {
      return 'Primary category is required.';
    }
    if (
      form.storeDetails.supportEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.storeDetails.supportEmail.trim())
    ) {
      return 'Support email format is invalid.';
    }
    if (
      form.storeDetails.supportPhone &&
      !/^[0-9]{10}$/.test(form.storeDetails.supportPhone.trim())
    ) {
      return 'Support phone must be 10 digits.';
    }
    return null;
  }, [form, isEditing]);

  const handleCancel = () => {
    setForm(profileForm);
    setLocalError(null);
    setLocalSuccess(null);
    setIsEditing(false);
  };

  const handleSetIsEditing = (nextValue: boolean) => {
    if (nextValue) {
      setForm(profileForm);
    } else {
      setLocalError(null);
      setLocalSuccess(null);
    }

    setIsEditing(nextValue);
  };

  const handleSave = async () => {
    setLocalError(null);
    setLocalSuccess(null);

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      await dispatch(
        updateSellerProfile({
          sellerName: form.sellerName.trim(),
          mobileNumber: form.mobileNumber.trim(),
          dateOfBirth: form.dateOfBirth || null,
          GSTIN: form.GSTIN.trim(),
          businessDetails: {
            ...form.businessDetails,
            businessName: form.businessDetails.businessName.trim(),
            businessType: form.businessDetails.businessType.trim(),
            gstNumber: form.GSTIN.trim(),
            panNumber: form.businessDetails.panNumber.trim(),
          },
          pickupAddress: {
            ...form.pickupAddress,
            name: form.pickupAddress.name.trim(),
            mobileNumber:
              form.pickupAddress.mobileNumber.trim() ||
              form.mobileNumber.trim(),
            address: form.pickupAddress.address.trim(),
            street: form.pickupAddress.address.trim(),
            locality: form.pickupAddress.locality.trim(),
            city: form.pickupAddress.city.trim(),
            state: form.pickupAddress.state.trim(),
            pinCode: form.pickupAddress.pinCode.trim(),
            country: form.pickupAddress.country.trim(),
          },
          bankDetails: {
            ...form.bankDetails,
            accountHolderName: form.bankDetails.accountHolderName.trim(),
            bankName: form.bankDetails.bankName.trim(),
            accountNumber: form.bankDetails.accountNumber.trim(),
            ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),
          },
          kycDetails: {
            ...form.kycDetails,
            panCardUrl: form.kycDetails.panCardUrl.trim(),
            aadhaarCardUrl: form.kycDetails.aadhaarCardUrl.trim(),
            gstCertificateUrl: form.kycDetails.gstCertificateUrl.trim(),
          },
          storeDetails: {
            ...form.storeDetails,
            storeName: form.storeDetails.storeName.trim(),
            storeLogo: form.storeDetails.storeLogo.trim(),
            storeDescription: form.storeDetails.storeDescription.trim(),
            primaryCategory: form.storeDetails.primaryCategory.trim(),
            supportEmail: form.storeDetails.supportEmail.trim(),
            supportPhone: form.storeDetails.supportPhone.trim(),
          },
        }),
      ).unwrap();
      setLocalSuccess('Seller profile updated successfully.');
      setIsEditing(false);
      dispatch(fetchSellerProfile());
    } catch (error: unknown) {
      setLocalError(getErrorMessage(error, 'Failed to update seller profile.'));
    }
  };

  return {
    error,
    form: isEditing ? form : profileForm,
    handleCancel,
    handleSave,
    handleSetIsEditing,
    isEditing,
    loading,
    localError,
    localSuccess,
    message,
    profile,
    updateRoot,
    updateSection,
  };
};
