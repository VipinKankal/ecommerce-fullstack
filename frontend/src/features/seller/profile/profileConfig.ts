import { SellerProfileForm } from './types';

export const emptyForm: SellerProfileForm = {
  sellerName: '',
  mobileNumber: '',
  email: '',
  dateOfBirth: '',
  GSTIN: '',
  businessDetails: {
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
  },
  pickupAddress: {
    name: '',
    mobileNumber: '',
    address: '',
    locality: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
  },
  bankDetails: {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  },
  kycDetails: {
    panCardUrl: '',
    aadhaarCardUrl: '',
    gstCertificateUrl: '',
  },
  storeDetails: {
    storeName: '',
    storeLogo: '',
    storeDescription: '',
    primaryCategory: '',
    supportEmail: '',
    supportPhone: '',
  },
};

export const BUSINESS_TYPES = ['Individual', 'Company', 'Partnership', 'LLP'];
export const PRIMARY_CATEGORIES = [
  'Menswear',
  'Womenswear',
  'Ethnic Wear',
  'Footwear',
  'Innerwear & Sleepwear',
  'Accessories',
];
