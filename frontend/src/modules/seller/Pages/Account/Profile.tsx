import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  TextField,
} from "@mui/material";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import { useAppDispatch, useAppSelector } from "../../../State/Store";
import {
  fetchSellerProfile,
  updateSellerProfile,
} from "../../../State/Seller/SellerAuthThunks";

type SellerProfileForm = {
  sellerName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth: string;
  GSTIN: string;
  businessDetails: {
    businessName: string;
    businessType: string;
    gstNumber: string;
    panNumber: string;
  };
  pickupAddress: {
    name: string;
    mobileNumber: string;
    address: string;
    locality: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  };
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  kycDetails: {
    panCardUrl: string;
    aadhaarCardUrl: string;
    gstCertificateUrl: string;
  };
  storeDetails: {
    storeName: string;
    storeLogo: string;
    storeDescription: string;
    primaryCategory: string;
    supportEmail: string;
    supportPhone: string;
  };
};

const emptyForm: SellerProfileForm = {
  sellerName: "",
  mobileNumber: "",
  email: "",
  dateOfBirth: "",
  GSTIN: "",
  businessDetails: {
    businessName: "",
    businessType: "",
    gstNumber: "",
    panNumber: "",
  },
  pickupAddress: {
    name: "",
    mobileNumber: "",
    address: "",
    locality: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  },
  bankDetails: {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  },
  kycDetails: {
    panCardUrl: "",
    aadhaarCardUrl: "",
    gstCertificateUrl: "",
  },
  storeDetails: {
    storeName: "",
    storeLogo: "",
    storeDescription: "",
    primaryCategory: "",
    supportEmail: "",
    supportPhone: "",
  },
};

const BUSINESS_TYPES = ["Individual", "Company", "Partnership", "LLP"];
const PRIMARY_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Shoes",
  "Furniture",
  "Beauty",
  "Grocery",
  "Accessories",
];

const SellerProfile = () => {
  const dispatch = useAppDispatch();
  const { profile, loading, error, message } = useAppSelector((state) => state.sellerAuth);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<SellerProfileForm>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSellerProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      sellerName: profile.sellerName || "",
      mobileNumber: profile.mobileNumber || "",
      email: profile.email || "",
      dateOfBirth: profile.dateOfBirth || "",
      GSTIN: profile.GSTIN || profile.businessDetails?.gstNumber || "",
      businessDetails: {
        businessName: profile.businessDetails?.businessName || "",
        businessType: profile.businessDetails?.businessType || "",
        gstNumber: profile.businessDetails?.gstNumber || profile.GSTIN || "",
        panNumber: profile.businessDetails?.panNumber || "",
      },
      pickupAddress: {
        name: profile.pickupAddress?.name || "",
        mobileNumber: profile.pickupAddress?.mobileNumber || "",
        address: profile.pickupAddress?.address || "",
        locality: profile.pickupAddress?.locality || "",
        city: profile.pickupAddress?.city || "",
        state: profile.pickupAddress?.state || "",
        pinCode: profile.pickupAddress?.pinCode || "",
        country: profile.pickupAddress?.country || "India",
      },
      bankDetails: {
        accountHolderName: profile.bankDetails?.accountHolderName || "",
        bankName: profile.bankDetails?.bankName || "",
        accountNumber: profile.bankDetails?.accountNumber || "",
        ifscCode: profile.bankDetails?.ifscCode || "",
      },
      kycDetails: {
        panCardUrl: profile.kycDetails?.panCardUrl || "",
        aadhaarCardUrl: profile.kycDetails?.aadhaarCardUrl || "",
        gstCertificateUrl: profile.kycDetails?.gstCertificateUrl || "",
      },
      storeDetails: {
        storeName: profile.storeDetails?.storeName || "",
        storeLogo: profile.storeDetails?.storeLogo || "",
        storeDescription: profile.storeDetails?.storeDescription || "",
        primaryCategory: profile.storeDetails?.primaryCategory || "",
        supportEmail: profile.storeDetails?.supportEmail || "",
        supportPhone: profile.storeDetails?.supportPhone || "",
      },
    });
  }, [profile]);

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
    if (!form.sellerName.trim()) return "Full name is required.";
    if (!/^[0-9]{10}$/.test(form.mobileNumber.trim())) return "Mobile number must be 10 digits.";
    if (!form.dateOfBirth) return "Date of birth is required.";
    if (!form.businessDetails.businessName.trim()) return "Business name is required.";
    if (!form.businessDetails.businessType.trim()) return "Business type is required.";
    if (!form.GSTIN.trim()) return "GST number is required.";
    if (!form.businessDetails.panNumber.trim()) return "PAN number is required.";
    if (!form.pickupAddress.address.trim()) return "Pickup address is required.";
    if (!form.pickupAddress.city.trim() || !form.pickupAddress.state.trim()) {
      return "Pickup city and state are required.";
    }
    if (!/^[0-9]{6}$/.test(form.pickupAddress.pinCode.trim())) {
      return "Pickup pincode must be 6 digits.";
    }
    if (!form.bankDetails.accountHolderName.trim()) return "Account holder name is required.";
    if (!form.bankDetails.bankName.trim()) return "Bank name is required.";
    if (!form.bankDetails.accountNumber.trim()) return "Account number is required.";
    if (!form.bankDetails.ifscCode.trim()) return "IFSC code is required.";
    if (!form.storeDetails.storeName.trim()) return "Store name is required.";
    if (!form.storeDetails.primaryCategory.trim()) return "Primary category is required.";
    if (
      form.storeDetails.supportEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.storeDetails.supportEmail.trim())
    ) {
      return "Support email format is invalid.";
    }
    if (
      form.storeDetails.supportPhone &&
      !/^[0-9]{10}$/.test(form.storeDetails.supportPhone.trim())
    ) {
      return "Support phone must be 10 digits.";
    }
    return null;
  }, [form, isEditing]);

  const handleCancel = () => {
    if (profile) {
      setForm({
        sellerName: profile.sellerName || "",
        mobileNumber: profile.mobileNumber || "",
        email: profile.email || "",
        dateOfBirth: profile.dateOfBirth || "",
        GSTIN: profile.GSTIN || profile.businessDetails?.gstNumber || "",
        businessDetails: {
          businessName: profile.businessDetails?.businessName || "",
          businessType: profile.businessDetails?.businessType || "",
          gstNumber: profile.businessDetails?.gstNumber || profile.GSTIN || "",
          panNumber: profile.businessDetails?.panNumber || "",
        },
        pickupAddress: {
          name: profile.pickupAddress?.name || "",
          mobileNumber: profile.pickupAddress?.mobileNumber || "",
          address: profile.pickupAddress?.address || "",
          locality: profile.pickupAddress?.locality || "",
          city: profile.pickupAddress?.city || "",
          state: profile.pickupAddress?.state || "",
          pinCode: profile.pickupAddress?.pinCode || "",
          country: profile.pickupAddress?.country || "India",
        },
        bankDetails: {
          accountHolderName: profile.bankDetails?.accountHolderName || "",
          bankName: profile.bankDetails?.bankName || "",
          accountNumber: profile.bankDetails?.accountNumber || "",
          ifscCode: profile.bankDetails?.ifscCode || "",
        },
        kycDetails: {
          panCardUrl: profile.kycDetails?.panCardUrl || "",
          aadhaarCardUrl: profile.kycDetails?.aadhaarCardUrl || "",
          gstCertificateUrl: profile.kycDetails?.gstCertificateUrl || "",
        },
        storeDetails: {
          storeName: profile.storeDetails?.storeName || "",
          storeLogo: profile.storeDetails?.storeLogo || "",
          storeDescription: profile.storeDetails?.storeDescription || "",
          primaryCategory: profile.storeDetails?.primaryCategory || "",
          supportEmail: profile.storeDetails?.supportEmail || "",
          supportPhone: profile.storeDetails?.supportPhone || "",
        },
      });
    }
    setLocalError(null);
    setLocalSuccess(null);
    setIsEditing(false);
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
            mobileNumber: form.pickupAddress.mobileNumber.trim() || form.mobileNumber.trim(),
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
      setLocalSuccess("Seller profile updated successfully.");
      setIsEditing(false);
      dispatch(fetchSellerProfile());
    } catch (updateError: any) {
      setLocalError(
        typeof updateError === "string" ? updateError : "Failed to update seller profile.",
      );
    }
  };

  const SectionHeader = ({
    title,
    subtitle,
    icon,
  }: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }) => (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      <div>
        <h2 className="text-lg font-black tracking-tight text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Seller Account
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              {form.storeDetails.storeName || form.sellerName || "Seller Profile"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Personal, business, address, payout, KYC, and store support information for seller operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip
              icon={profile?.emailVerified ? <VerifiedRoundedIcon /> : <PendingOutlinedIcon />}
              label={profile?.emailVerified ? "Email Verified" : "Verification Pending"}
              color={profile?.emailVerified ? "success" : "warning"}
            />
            <Chip
              label={profile?.accountStatus || "PENDING_VERIFICATION"}
              color={profile?.accountStatus === "ACTIVE" ? "success" : "warning"}
              variant="outlined"
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.24)" }}
            />
            {profile?.role && (
              <Chip
                label={profile.role}
                variant="outlined"
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.24)" }}
              />
            )}
          </div>
        </div>
      </div>

      {(error || localError || localSuccess || message) && (
        <Alert severity={error || localError ? "error" : "success"}>
          {error || localError || localSuccess || message}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900">Seller Information</h2>
          <p className="text-sm text-gray-500">
            This structure matches production-level seller onboarding and profile maintenance.
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing && (
            <Button variant="outlined" color="inherit" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={loading}
            sx={{
              borderRadius: "999px",
              px: 3,
              bgcolor: "#0f172a",
              "&:hover": { bgcolor: "#020617" },
            }}
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Edit Profile"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Basic Personal Information"
            subtitle="Seller identity and login-related account details."
            icon={<BadgeOutlinedIcon />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              fullWidth
              label="Full Name"
              value={form.sellerName}
              onChange={(e) => updateRoot("sellerName", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Mobile Number"
              value={form.mobileNumber}
              onChange={(e) => updateRoot("mobileNumber", e.target.value)}
              disabled={!isEditing}
            />
            <TextField fullWidth label="Email ID" value={form.email} disabled />
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateRoot("dateOfBirth", e.target.value)}
              disabled={!isEditing}
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Business Information"
            subtitle="Business identity, tax registration, and legal information."
            icon={<BusinessCenterOutlinedIcon />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              fullWidth
              label="Business Name"
              value={form.businessDetails.businessName}
              onChange={(e) => updateSection("businessDetails", "businessName", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              select
              fullWidth
              label="Business Type"
              value={form.businessDetails.businessType}
              onChange={(e) => updateSection("businessDetails", "businessType", e.target.value)}
              disabled={!isEditing}
            >
              {BUSINESS_TYPES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="GST Number"
              value={form.GSTIN}
              onChange={(e) => updateRoot("GSTIN", e.target.value.toUpperCase())}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="PAN Number"
              value={form.businessDetails.panNumber}
              onChange={(e) => updateSection("businessDetails", "panNumber", e.target.value.toUpperCase())}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Address Information"
            subtitle="Pickup address used for shipping origin and logistics."
            icon={<HomeWorkOutlinedIcon />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              fullWidth
              label="Contact Name"
              value={form.pickupAddress.name}
              onChange={(e) => updateSection("pickupAddress", "name", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Contact Mobile"
              value={form.pickupAddress.mobileNumber}
              onChange={(e) => updateSection("pickupAddress", "mobileNumber", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Address"
              value={form.pickupAddress.address}
              onChange={(e) => updateSection("pickupAddress", "address", e.target.value)}
              disabled={!isEditing}
              className="sm:col-span-2"
            />
            <TextField
              fullWidth
              label="Locality"
              value={form.pickupAddress.locality}
              onChange={(e) => updateSection("pickupAddress", "locality", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="City"
              value={form.pickupAddress.city}
              onChange={(e) => updateSection("pickupAddress", "city", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="State"
              value={form.pickupAddress.state}
              onChange={(e) => updateSection("pickupAddress", "state", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Pincode"
              value={form.pickupAddress.pinCode}
              onChange={(e) => updateSection("pickupAddress", "pinCode", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Country"
              value={form.pickupAddress.country}
              onChange={(e) => updateSection("pickupAddress", "country", e.target.value)}
              disabled={!isEditing}
              className="sm:col-span-2"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Bank Details"
            subtitle="Settlement and payout information for seller earnings."
            icon={<PaymentsOutlinedIcon />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              fullWidth
              label="Account Holder Name"
              value={form.bankDetails.accountHolderName}
              onChange={(e) => updateSection("bankDetails", "accountHolderName", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Bank Name"
              value={form.bankDetails.bankName}
              onChange={(e) => updateSection("bankDetails", "bankName", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Account Number"
              value={form.bankDetails.accountNumber}
              onChange={(e) => updateSection("bankDetails", "accountNumber", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="IFSC Code"
              value={form.bankDetails.ifscCode}
              onChange={(e) => updateSection("bankDetails", "ifscCode", e.target.value.toUpperCase())}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Identity Verification"
            subtitle="KYC document links used for trust and verification review."
            icon={<VerifiedRoundedIcon />}
          />
          <div className="grid grid-cols-1 gap-4">
            <TextField
              fullWidth
              label="PAN Card URL"
              value={form.kycDetails.panCardUrl}
              onChange={(e) => updateSection("kycDetails", "panCardUrl", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Aadhaar Card URL"
              value={form.kycDetails.aadhaarCardUrl}
              onChange={(e) => updateSection("kycDetails", "aadhaarCardUrl", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="GST Certificate URL"
              value={form.kycDetails.gstCertificateUrl}
              onChange={(e) => updateSection("kycDetails", "gstCertificateUrl", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Store Information"
            subtitle="Branding, product category focus, and buyer support details."
            icon={<StorefrontOutlinedIcon />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              fullWidth
              label="Store Name"
              value={form.storeDetails.storeName}
              onChange={(e) => updateSection("storeDetails", "storeName", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Store Logo URL"
              value={form.storeDetails.storeLogo}
              onChange={(e) => updateSection("storeDetails", "storeLogo", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              select
              fullWidth
              label="Primary Category"
              value={form.storeDetails.primaryCategory}
              onChange={(e) => updateSection("storeDetails", "primaryCategory", e.target.value)}
              disabled={!isEditing}
            >
              {PRIMARY_CATEGORIES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Support Email"
              value={form.storeDetails.supportEmail}
              onChange={(e) => updateSection("storeDetails", "supportEmail", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Support Phone"
              value={form.storeDetails.supportPhone}
              onChange={(e) => updateSection("storeDetails", "supportPhone", e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Store Description"
              value={form.storeDetails.storeDescription}
              onChange={(e) => updateSection("storeDetails", "storeDescription", e.target.value)}
              disabled={!isEditing}
              className="sm:col-span-2"
            />
          </div>
        </div>
      </div>

      <Divider />
    </div>
  );
};

export default SellerProfile;
