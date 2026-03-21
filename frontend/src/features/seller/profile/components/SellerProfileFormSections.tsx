import React from 'react';
import { MenuItem, TextField } from '@mui/material';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import { BUSINESS_TYPES, PRIMARY_CATEGORIES } from '../profileConfig';
import SellerProfileSectionHeader from './SellerProfileSectionHeader';
import { SellerProfileForm } from '../types';

type SellerProfileFormSectionsProps = {
  form: SellerProfileForm;
  isEditing: boolean;
  updateRoot: (field: keyof SellerProfileForm, value: string) => void;
  updateSection: <T extends keyof SellerProfileForm>(
    section: T,
    field: keyof SellerProfileForm[T],
    value: string,
  ) => void;
};

const SellerProfileFormSections = ({
  form,
  isEditing,
  updateRoot,
  updateSection,
}: SellerProfileFormSectionsProps) => (
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <SellerProfileSectionHeader
        title="Basic Personal Information"
        subtitle="Seller identity and login-related account details."
        icon={<BadgeOutlinedIcon />}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          fullWidth
          label="Full Name"
          value={form.sellerName}
          onChange={(e) => updateRoot('sellerName', e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Mobile Number"
          value={form.mobileNumber}
          onChange={(e) => updateRoot('mobileNumber', e.target.value)}
          disabled={!isEditing}
        />
        <TextField fullWidth label="Email ID" value={form.email} disabled />
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => updateRoot('dateOfBirth', e.target.value)}
          disabled={!isEditing}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </div>
    </div>

    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <SellerProfileSectionHeader
        title="Business Information"
        subtitle="Business identity, tax registration, and legal information."
        icon={<BusinessCenterOutlinedIcon />}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          fullWidth
          label="Business Name"
          value={form.businessDetails.businessName}
          onChange={(e) =>
            updateSection('businessDetails', 'businessName', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          select
          fullWidth
          label="Business Type"
          value={form.businessDetails.businessType}
          onChange={(e) =>
            updateSection('businessDetails', 'businessType', e.target.value)
          }
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
          onChange={(e) => updateRoot('GSTIN', e.target.value.toUpperCase())}
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="PAN Number"
          value={form.businessDetails.panNumber}
          onChange={(e) =>
            updateSection(
              'businessDetails',
              'panNumber',
              e.target.value.toUpperCase(),
            )
          }
          disabled={!isEditing}
        />
      </div>
    </div>

    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <SellerProfileSectionHeader
        title="Address Information"
        subtitle="Pickup address used for shipping origin and logistics."
        icon={<HomeWorkOutlinedIcon />}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          fullWidth
          label="Contact Name"
          value={form.pickupAddress.name}
          onChange={(e) =>
            updateSection('pickupAddress', 'name', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Contact Mobile"
          value={form.pickupAddress.mobileNumber}
          onChange={(e) =>
            updateSection('pickupAddress', 'mobileNumber', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Address"
          value={form.pickupAddress.address}
          onChange={(e) =>
            updateSection('pickupAddress', 'address', e.target.value)
          }
          disabled={!isEditing}
          className="sm:col-span-2"
        />
        <TextField
          fullWidth
          label="Locality"
          value={form.pickupAddress.locality}
          onChange={(e) =>
            updateSection('pickupAddress', 'locality', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="City"
          value={form.pickupAddress.city}
          onChange={(e) =>
            updateSection('pickupAddress', 'city', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="State"
          value={form.pickupAddress.state}
          onChange={(e) =>
            updateSection('pickupAddress', 'state', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Pincode"
          value={form.pickupAddress.pinCode}
          onChange={(e) =>
            updateSection('pickupAddress', 'pinCode', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Country"
          value={form.pickupAddress.country}
          onChange={(e) =>
            updateSection('pickupAddress', 'country', e.target.value)
          }
          disabled={!isEditing}
          className="sm:col-span-2"
        />
      </div>
    </div>

    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <SellerProfileSectionHeader
        title="Bank Details"
        subtitle="Settlement and payout information for seller earnings."
        icon={<PaymentsOutlinedIcon />}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          fullWidth
          label="Account Holder Name"
          value={form.bankDetails.accountHolderName}
          onChange={(e) =>
            updateSection('bankDetails', 'accountHolderName', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Bank Name"
          value={form.bankDetails.bankName}
          onChange={(e) =>
            updateSection('bankDetails', 'bankName', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Account Number"
          value={form.bankDetails.accountNumber}
          onChange={(e) =>
            updateSection('bankDetails', 'accountNumber', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="IFSC Code"
          value={form.bankDetails.ifscCode}
          onChange={(e) =>
            updateSection(
              'bankDetails',
              'ifscCode',
              e.target.value.toUpperCase(),
            )
          }
          disabled={!isEditing}
        />
      </div>
    </div>

    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <SellerProfileSectionHeader
        title="Identity Verification"
        subtitle="KYC document links used for trust and verification review."
        icon={<VerifiedRoundedIcon />}
      />
      <div className="grid grid-cols-1 gap-4">
        <TextField
          fullWidth
          label="PAN Card URL"
          value={form.kycDetails.panCardUrl}
          onChange={(e) =>
            updateSection('kycDetails', 'panCardUrl', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Aadhaar Card URL"
          value={form.kycDetails.aadhaarCardUrl}
          onChange={(e) =>
            updateSection('kycDetails', 'aadhaarCardUrl', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="GST Certificate URL"
          value={form.kycDetails.gstCertificateUrl}
          onChange={(e) =>
            updateSection('kycDetails', 'gstCertificateUrl', e.target.value)
          }
          disabled={!isEditing}
        />
      </div>
    </div>

    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <SellerProfileSectionHeader
        title="Store Information"
        subtitle="Branding, product category focus, and buyer support details."
        icon={<StorefrontOutlinedIcon />}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          fullWidth
          label="Store Name"
          value={form.storeDetails.storeName}
          onChange={(e) =>
            updateSection('storeDetails', 'storeName', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Store Logo URL"
          value={form.storeDetails.storeLogo}
          onChange={(e) =>
            updateSection('storeDetails', 'storeLogo', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          select
          fullWidth
          label="Primary Category"
          value={form.storeDetails.primaryCategory}
          onChange={(e) =>
            updateSection('storeDetails', 'primaryCategory', e.target.value)
          }
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
          onChange={(e) =>
            updateSection('storeDetails', 'supportEmail', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          label="Support Phone"
          value={form.storeDetails.supportPhone}
          onChange={(e) =>
            updateSection('storeDetails', 'supportPhone', e.target.value)
          }
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          multiline
          minRows={4}
          label="Store Description"
          value={form.storeDetails.storeDescription}
          onChange={(e) =>
            updateSection('storeDetails', 'storeDescription', e.target.value)
          }
          disabled={!isEditing}
          className="sm:col-span-2"
        />
      </div>
    </div>
  </div>
);

export default SellerProfileFormSections;
