export type SellerProfileForm = {
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
