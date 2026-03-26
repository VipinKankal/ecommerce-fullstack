import { FormikProps } from 'formik';

export interface SellerAccountFormValues {
  sellerName: string;
  mobile: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gstin: string;
  gstRegistrationType: 'GST_REGISTERED' | 'NON_GST_DECLARATION';
  gstDeclarationAccepted: boolean;
  pickupAddress: {
    name: string;
    mobile: string;
    pincode: string;
    address: string;
    locality: string;
    city: string;
    state: string;
    country: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  businessDetails: {
    businessName: string;
    businessType: string;
    gstNumber: string;
    panNumber: string;
  };
  kycDetails: {
    panCardUrl: string;
    aadhaarCardUrl: string;
    gstCertificateUrl: string;
    panCardUrlName: string;
    aadhaarCardUrlName: string;
    gstCertificateUrlName: string;
  };
  storeDetails: {
    storeName: string;
    storeLogo: string;
    storeLogoName: string;
    storeDescription: string;
    primaryCategory: string;
    supportEmail: string;
    supportPhone: string;
  };
}

export type SellerAccountFormik = FormikProps<SellerAccountFormValues>;
