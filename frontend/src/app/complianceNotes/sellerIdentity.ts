type SellerLike = {
  id?: number | string;
  _id?: number | string;
  sellerId?: number | string;
  email?: string;
  mobileNumber?: string;
};

export const getSellerComplianceIdentity = (
  seller: SellerLike | null | undefined,
) => {
  if (!seller) return 'seller:anonymous';
  return String(
    seller.id ||
      seller._id ||
      seller.sellerId ||
      seller.email ||
      seller.mobileNumber ||
      'seller:anonymous',
  );
};

