export type SellerAddress = {
  mobileNumber?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pinCode?: string;
};

export type SellerBankDetails = {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
};

export type SellerKycDetails = {
  panCardUrl?: string;
  aadhaarCardUrl?: string;
  gstCertificateUrl?: string;
};

export type SellerStoreDetails = {
  storeName?: string;
  primaryCategory?: string;
  supportEmail?: string;
  supportPhone?: string;
};

export type SellerListItem = {
  id: number;
  sellerName: string;
  email: string;
  mobile: string;
  businessEmail: string;
  businessMobile: string;
  businessAddress: string;
  gstin: string;
  businessName: string;
  businessType: string;
  panNumber: string;
  status: string;
  pickupAddress?: SellerAddress;
  bankDetails?: SellerBankDetails;
  kycDetails?: SellerKycDetails;
  storeDetails?: SellerStoreDetails;
  emailVerified?: boolean;
  createdAt?: string;
};
