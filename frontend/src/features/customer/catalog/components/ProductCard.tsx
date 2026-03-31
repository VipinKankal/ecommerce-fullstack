import React, { useEffect, useState } from 'react';
import { Button, IconButton, useMediaQuery, useTheme } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { useNavigate } from 'react-router-dom';
import { Product } from 'shared/types/product.types';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { addToCart } from 'State/features/customer/cart/slice';
import { toggleWishlistProduct } from 'State/features/customer/wishlist/slice';
import { redirectToLogin } from 'shared/auth/redirectToLogin';

const ProductCard = ({ item }: { item: Product }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const customer = useAppSelector((state) => state.customerAuth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const images = item.images || [];
  const isWishlisted = Boolean(
    item.id &&
      wishlistItems.some(
        (wishlistItem: { id?: number } | null | undefined) =>
          wishlistItem?.id === item.id,
      ),
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovered, images.length]);

  const getDefaultSize = () => {
    const rawSize = item.sizes;
    if (typeof rawSize === 'string' && rawSize.trim().length > 0) {
      return rawSize.split(',')[0].trim();
    }
    return 'M';
  };

  const handleNavigate = () => {
    navigate(
      `/product-details/${item.category?.categoryId}/${item.title}/${item.id}`,
    );
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer) {
      redirectToLogin(
        navigate,
        'customer',
        'Please log in to save products to your wishlist.',
      );
      return;
    }
    if (!item.id) return;
    await dispatch(toggleWishlistProduct(item.id));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer) {
      redirectToLogin(
        navigate,
        'customer',
        'Please log in to add items to your cart.',
      );
      return;
    }
    if (!item.id) return;
    try {
      await dispatch(
        addToCart({
          productId: item.id,
          quantity: 1,
          size: getDefaultSize(),
        }),
      ).unwrap();
    } catch (error) {
      const message =
        typeof error === 'string' ? error : 'Failed to add item to cart';
      if (/login|auth|unauth|session/i.test(message)) {
        redirectToLogin(
          navigate,
          'customer',
          'Please log in again to continue with your cart.',
        );
      }
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer) {
      redirectToLogin(
        navigate,
        'customer',
        'Please log in to continue to checkout.',
      );
      return;
    }
    if (!item.id) return;
    try {
      await dispatch(
        addToCart({
          productId: item.id,
          quantity: 1,
          size: getDefaultSize(),
        }),
      ).unwrap();
      navigate('/checkout/cart');
    } catch (error) {
      const message =
        typeof error === 'string' ? error : 'Failed to process Buy Now';
      if (/login|auth|unauth|session/i.test(message)) {
        redirectToLogin(
          navigate,
          'customer',
          'Please log in again to continue to checkout.',
        );
        return;
      }
    }
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.id) return;
    navigate(`/reviews/${item.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/product-details/${item.category?.categoryId}/${item.title}/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: shareUrl,
        });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Ignore share cancellation on mobile browsers.
    }
  };

  const colorValue = item.color as unknown;
  const displayColor =
    typeof colorValue === 'string'
      ? colorValue
      : colorValue &&
          typeof colorValue === 'object' &&
          'name' in colorValue &&
          typeof (colorValue as { name?: unknown }).name === 'string'
        ? (colorValue as { name?: string }).name || 'N/A'
        : 'N/A';
  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop';
  const productImages = images.length > 0 ? images : [fallbackImage];
  const brandName = (item.brand || item.seller?.sellerName || 'BRAND NAME').toUpperCase();
  const shortDescription =
    item.description?.trim().length > 0
      ? item.description.trim().slice(0, 48)
      : displayColor;

  if (isMobile) {
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden border border-gray-300 bg-white shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wide text-gray-800">
          <span className="truncate">{brandName}</span>
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="rounded-full border-none bg-transparent p-0 text-gray-500"
          >
            {isWishlisted ? (
              <FavoriteIcon sx={{ fontSize: 28 }} className="text-[#ff3f6c]" />
            ) : (
              <AccountCircleOutlinedIcon sx={{ fontSize: 30 }} />
            )}
          </button>
        </div>

        <div className="border-t border-gray-300 px-3 py-2">
          <div className="flex items-start gap-5 text-[10px] text-gray-700">
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex flex-col items-center gap-1 border-none bg-transparent p-0 text-inherit"
            >
              <ShoppingBagOutlinedIcon sx={{ fontSize: 18 }} />
              <span>Buy Now</span>
            </button>
            <button
              type="button"
              onClick={handleReviewClick}
              className="flex flex-col items-center gap-1 border-none bg-transparent p-0 text-inherit"
            >
              <RateReviewOutlinedIcon sx={{ fontSize: 18 }} />
              <span>Review</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex flex-col items-center gap-1 border-none bg-transparent p-0 text-inherit"
            >
              <SendOutlinedIcon sx={{ fontSize: 18 }} />
              <span>Share</span>
            </button>
          </div>

          <div className="mt-3 space-y-1 text-[11px] leading-4 text-gray-800">
            <p>{item.title || 'Product Name'}</p>
            <p>{shortDescription || 'Product Description'}</p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Rs. {item.sellingPrice}</span>
              <span className="text-gray-500 line-through">Rs. {item.mrpPrice}</span>
              <span className="text-gray-700">({item.discountPercent}% OFF)</span>
            </div>
          </div>
        </div>

        <div
          onClick={handleNavigate}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleNavigate();
            }
          }}
          role="button"
          tabIndex={0}
          className="relative"
        >
          <img
            src={productImages[currentImage]}
            alt={item.title}
            className="h-[300px] w-full object-cover"
          />
          <div className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white">
            {currentImage + 1} / {productImages.length}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 py-3 text-gray-400">
          {productImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImage(index);
              }}
              className={`h-1.5 w-1.5 rounded-full ${
                currentImage === index ? 'bg-gray-700' : 'bg-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImage(0);
      }}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleNavigate();
        }
      }}
      role="button"
      tabIndex={0}
      className="group w-full relative cursor-pointer bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 z-0 hover:z-10"
    >
      <div className="relative h-[240px] sm:h-[300px] lg:h-[350px] overflow-hidden bg-gray-50">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentImage * 100}%)` }}
        >
          {productImages.map((img) => (
            <img
              key={`${item.id || item.title}-${img}`}
              src={img}
              alt={item.title}
              className="w-full h-full object-cover flex-shrink-0"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
        >
          {isWishlisted ? (
            <FavoriteIcon
              sx={{ fontSize: '1.2rem' }}
              className="text-[#ff3f6c]"
            />
          ) : (
            <FavoriteBorderIcon
              sx={{ fontSize: '1.2rem' }}
              className="text-gray-600"
            />
          )}
        </button>

        <div
          className={`absolute left-2 right-2 bottom-2 grid grid-cols-2 gap-1.5 p-1.5 rounded-lg bg-white/85 backdrop-blur-[1px] transition-all duration-300 ${
            isHovered
              ? 'opacity-100 translate-y-0'
              : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0'
          }`}
        >
          <Button
            variant="outlined"
            onClick={handleAddToCart}
            startIcon={<AddShoppingCartIcon sx={{ fontSize: 14 }} />}
            fullWidth
            sx={{
              textTransform: 'none',
              fontSize: '11px',
              py: 0.55,
              minWidth: 0,
              borderColor: '#d4d5d9',
              color: '#282c3f',
              fontWeight: 700,
              backgroundColor: 'rgba(255,255,255,0.92)',
              '&:hover': {
                borderColor: '#282c3f',
                backgroundColor: 'rgba(255,255,255,0.98)',
              },
            }}
          >
            Add
          </Button>
          <Button
            variant="contained"
            onClick={handleBuyNow}
            startIcon={<FlashOnIcon sx={{ fontSize: 14 }} />}
            fullWidth
            sx={{
              textTransform: 'none',
              fontSize: '11px',
              py: 0.55,
              minWidth: 0,
              backgroundColor: '#ff3f6c',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#e73961', boxShadow: 'none' },
            }}
          >
            Buy Now
          </Button>
        </div>
      </div>

      <div className="p-3 relative bg-white">
        <h3 className="font-bold text-sm text-gray-900 truncate uppercase tracking-tight">
          {item.title || 'Brand'}
        </h3>

        <p className="text-xs text-gray-500 truncate mt-1">{displayColor}</p>

        <div className="price flex items-center gap-1.5 mt-1">
          <span className="font-bold text-sm text-[#282c3f]">
            Rs. {item.sellingPrice}
          </span>
          <span className="text-gray-400 line-through text-[10px]">
            Rs. {item.mrpPrice}
          </span>
          <span className="text-[#ff905a] font-bold text-[10px]">
            {item.discountPercent}% OFF
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
