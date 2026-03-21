export interface PickupAddress {
  id?: number;
  name: string;
  street?: string;
  mobileNumber: string;
  pinCode: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  country?: string;
}

export interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName?: string;
}

export interface BusinessDetails {
  businessName: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface KycDetails {
  panCardUrl?: string;
  aadhaarCardUrl?: string;
  gstCertificateUrl?: string;
}

export interface StoreDetails {
  storeName?: string;
  storeLogo?: string;
  storeDescription?: string;
  primaryCategory?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface Seller {
  id?: number;
  mobileNumber: string;
  GSTIN: string;
  pickupAddress: PickupAddress;
  bankDetails: BankDetails;
  sellerName: string;
  email: string;
  businessDetails: BusinessDetails;
  kycDetails?: KycDetails;
  storeDetails?: StoreDetails;
  dateOfBirth?: string;
  emailVerified?: boolean;
  role?: string;
  accountStatus?: string;
}

export interface SellerReport {
  id: number;
  seller: Seller;
  totalEarnings: number;
  totalSales: number;
  totalRefunds: number;
  totalTax: number;
  netEarnings: number;
  totalOrders: number;
  canceledOrders: number;
  totalTransactions: number;
}
