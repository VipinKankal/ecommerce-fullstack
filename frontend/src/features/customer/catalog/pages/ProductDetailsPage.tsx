import React from 'react';
import { teal } from '@mui/material/colors';
import { Button, Divider, IconButton } from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Star as StarIcon,
  AddShoppingCart,
  FlashOn,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import SimilarProduct from '../../pages/ProductDetails/SimlarProduct';
import ReviewCard from '../../pages/Review/ReviewCard';
import { useProductDetails } from '../hooks/useProductDetails';

const ProductDetailsPage = () => {
  const {
    activeImage,
    handleAddToCart,
    handleBuyNow,
    handleDecrement,
    handleIncrement,
    handleNotifyMe,
    handleToggleWishlist,
    hasVariantStock,
    isWishlisted,
    isSelectedSizeAvailable,
    isOutOfStock,
    loading,
    notifyLoading,
    notifyMessage,
    notifyStatus,
    onlyLeftLabel,
    productImages,
    quantity,
    selectedProduct,
    selectedSize,
    setActiveImage,
    setSelectedSize,
    sizes,
    warehouseStock,
    wishlistUpdating,
  } = useProductDetails();

  if (!selectedProduct) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  const warrantyLabel =
    selectedProduct.warrantyType &&
    selectedProduct.warrantyType !== 'NONE' &&
    Number(selectedProduct.warrantyDays || 0) > 0
      ? `${selectedProduct.warrantyDays} Day ${
          selectedProduct.warrantyType === 'BRAND' ? 'Brand' : 'Seller'
        } Warranty`
      : 'No Warranty';
  const selectedSizeLabel = selectedSize ? `Size ${selectedSize}` : 'Selected size';

  return (
    <div className="px-3 sm:px-5 lg:px-20 pt-6 sm:pt-10 font-sans pb-20 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
        <section className="flex flex-col lg:flex-row gap-3 sm:gap-5">
          <div className="w-full lg:w-[15%] flex lg:flex-col gap-2 sm:gap-3 order-2 lg:order-1 overflow-x-auto pb-1">
            {productImages.map((item: string, index: number) => (
              <button
                type="button"
                key={`${selectedProduct.id || selectedProduct.title}-${item}`}
                onClick={() => setActiveImage(index)}
                className={`min-w-[72px] w-[72px] sm:w-20 lg:w-full h-20 sm:h-24 bg-gray-100 rounded-md overflow-hidden cursor-pointer border ${
                  activeImage === index ? 'border-teal-500' : 'border-gray-200'
                }`}
              >
                <img
                  className="w-full h-full object-cover"
                  src={item}
                  alt="thumbnail"
                />
              </button>
            ))}
          </div>

          <div className="w-full lg:w-[85%] order-1 lg:order-2">
            <img
              className="w-full rounded-xl shadow-sm border"
              src={productImages[activeImage]}
              alt="main-product"
            />
          </div>
        </section>

        <section>
          <h1 className="font-bold text-xl sm:text-3xl uppercase">
            {selectedProduct.title}
          </h1>

          <p className="text-gray-500 mt-1">
            {selectedProduct.category?.categoryId?.replaceAll('-', ' ')}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-teal-600 font-bold">
              {selectedProduct.ratings || 0}
            </span>
            <StarIcon sx={{ color: teal[500], fontSize: 16 }} />
            <span className="text-gray-400 text-sm">
              ({selectedProduct.numRatings} Ratings)
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mt-4 sm:mt-6">
            <span className="text-2xl sm:text-3xl font-bold">
              Rs {selectedProduct.sellingPrice}
            </span>
            <span className="line-through text-gray-400 text-sm sm:text-base">
              Rs {selectedProduct.mrpPrice}
            </span>
            <span className="text-teal-600 font-bold text-sm sm:text-base">
              ({selectedProduct.discountPercent}% OFF)
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
            {warrantyLabel}
          </div>

          <div className="mt-6 sm:mt-8">
            <h3 className="font-bold mb-3">Select Size</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border text-sm sm:text-base ${
                    selectedSize === size
                      ? 'border-teal-600 bg-teal-50'
                      : selectedProduct.variants?.length &&
                          !(
                            Number(
                              selectedProduct.variants.find(
                                (variant) =>
                                  (variant.size || '').trim().toUpperCase() ===
                                  size.trim().toUpperCase(),
                              )?.warehouseStock || 0,
                            ) > 0
                          )
                        ? 'border-dashed border-gray-300 text-gray-400'
                        : 'border-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {selectedSize && hasVariantStock && (
              <p
                className={`mt-2 text-sm font-medium ${
                  isSelectedSizeAvailable ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isSelectedSizeAvailable
                  ? `${selectedSizeLabel} is available.`
                  : `${selectedSizeLabel} is currently unavailable.`}
              </p>
            )}
            {selectedSize && !hasVariantStock && (
              <p className="mt-2 text-sm text-slate-600">
                Size-wise stock is not configured for this product yet.
              </p>
            )}
          </div>

          <div className="mt-6 sm:mt-8">
            <h3 className="font-bold mb-3">Qty</h3>
            <div className="flex items-center border w-fit rounded-lg">
              <IconButton
                onClick={handleDecrement}
                disabled={quantity <= 1 || isOutOfStock}
              >
                <RemoveIcon />
              </IconButton>
              <span className="px-6 font-bold">{`Qty: ${quantity}`}</span>
              <IconButton
                onClick={handleIncrement}
                disabled={isOutOfStock || quantity >= warehouseStock}
              >
                <AddIcon />
              </IconButton>
            </div>
            {onlyLeftLabel && (
              <p className="mt-2 text-sm font-medium text-amber-700">
                {onlyLeftLabel}
              </p>
            )}
          </div>

          {isOutOfStock && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              Warehouse stock is currently unavailable.
            </div>
          )}

          <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:gap-4">
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddShoppingCart />}
              onClick={handleAddToCart}
              disabled={loading || isOutOfStock}
              sx={{
                py: { xs: '0.7rem', sm: '1.2rem' },
                bgcolor: teal[600],
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: { xs: '0.78rem', sm: '0.92rem' },
              }}
            >
              {isOutOfStock ? 'Out of Stock' : loading ? 'Adding...' : 'Add to Cart'}
            </Button>

            <Button
              fullWidth
              variant="contained"
              color="warning"
              startIcon={<FlashOn />}
              onClick={handleBuyNow}
              disabled={loading || isOutOfStock}
              sx={{
                py: { xs: '0.7rem', sm: '1.2rem' },
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: { xs: '0.78rem', sm: '0.92rem' },
              }}
            >
              {isOutOfStock ? 'Currently Unavailable' : 'Buy Now'}
            </Button>

            {isOutOfStock && (
              <Button
                fullWidth
                variant={notifyStatus === 'SUBSCRIBED' ? 'contained' : 'outlined'}
                color="info"
                onClick={handleNotifyMe}
                disabled={
                  notifyLoading ||
                  ['SUBSCRIBED', 'NOTIFIED', 'ALREADY_NOTIFIED', 'CONVERTED'].includes(
                    notifyStatus,
                  )
                }
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.78rem', sm: '0.92rem' },
                }}
              >
                {notifyLoading
                  ? 'Saving...'
                  : notifyStatus === 'SUBSCRIBED'
                    ? 'Subscribed for Restock'
                    : notifyStatus === 'NOTIFIED'
                      ? 'Already Notified'
                      : notifyStatus === 'ALREADY_NOTIFIED'
                        ? 'Already Notified'
                        : notifyStatus === 'CONVERTED'
                          ? 'Already Purchased'
                          : 'Notify Me'}
              </Button>
            )}

            <Button
              fullWidth
              variant={isWishlisted ? 'contained' : 'outlined'}
              color={isWishlisted ? 'error' : 'inherit'}
              startIcon={isWishlisted ? <Favorite /> : <FavoriteBorder />}
              onClick={handleToggleWishlist}
              disabled={wishlistUpdating}
              sx={{
                textTransform: 'none',
                fontSize: { xs: '0.78rem', sm: '0.92rem' },
              }}
            >
              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
            </Button>

            {notifyMessage && (
              <p className="text-sm text-slate-500">{notifyMessage}</p>
            )}
          </div>

          <div className="mt-8 sm:mt-10">
            <h3 className="font-bold mb-2">Product Description</h3>
            <p className="text-gray-600">
              {selectedProduct.description || 'No description available'}
            </p>
          </div>

          <Divider className="my-10" />
          <ReviewCard />
        </section>
      </div>

      <div className="mt-12 sm:mt-20">
        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
        <SimilarProduct />
      </div>
    </div>
  );
};

export default ProductDetailsPage;
