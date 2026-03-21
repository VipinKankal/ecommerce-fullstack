import React, { useEffect } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  fetchWishlist,
  removeWishlistProduct,
} from 'State/features/customer/wishlist/slice';
import { addToCart } from 'State/features/customer/cart/slice';

type WishlistItem = {
  id?: number;
  title?: string;
  categoryId?: string;
  categoryName?: string;
  sellingPrice?: number;
  mrpPrice?: number;
  sizes?: string | string[];
  images?: string[];
  category?: {
    name?: string;
    categoryId?: string;
  };
};

const Wishlist = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const customer = useAppSelector((state) => state.customerAuth.user);
  const { items, loading, actionLoading, error } = useAppSelector(
    (state) => state.wishlist,
  );
  const typedItems = items as WishlistItem[];

  useEffect(() => {
    if (!customer) return;
    dispatch(fetchWishlist());
  }, [customer, dispatch]);

  const getDefaultSize = (sizes: unknown): string => {
    if (Array.isArray(sizes) && sizes.length > 0) {
      return String(sizes[0]);
    }
    if (typeof sizes === 'string' && sizes.trim().length > 0) {
      const first = sizes.split(',')[0]?.trim();
      return first || 'M';
    }
    return 'M';
  };

  const handleRemove = async (productId?: number) => {
    if (!productId) return;
    await dispatch(removeWishlistProduct(productId));
  };

  const handleOpenProductDetails = (item: WishlistItem) => {
    if (!item?.id) return;
    const categoryId = item?.categoryId || item?.category?.categoryId || 'all';
    const name = item?.title || 'product';
    navigate(`/product-details/${categoryId}/${name}/${item.id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, item: WishlistItem) => {
    e.stopPropagation();
    if (!item?.id) return;
    try {
      await dispatch(
        addToCart({
          productId: item.id,
          quantity: 1,
          size: getDefaultSize(item.sizes),
        }),
      ).unwrap();
    } catch {
      // Keep UX simple for now and use existing app alert pattern.
      alert('Failed to add product to cart.');
    }
  };

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2">
        <FavoriteIcon className="text-red-500" />
        <h1 className="text-xl font-bold">Wishlist</h1>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {!typedItems.length ? (
        <div className="border rounded-lg p-5 sm:p-8 text-center">
          <p className="text-gray-600 font-medium">Your wishlist is empty.</p>
          <p className="text-sm text-gray-500 mt-1">
            Products you like will appear here.
          </p>
          <Button
            sx={{ mt: 2, textTransform: 'none' }}
            variant="contained"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {typedItems.map((item) => (
            <div
              key={
                item.id ??
                `${item?.title || 'wishlist'}-${item?.categoryId || 'all'}`
              }
              className="border rounded-xl p-3 sm:p-4 bg-white flex flex-col sm:flex-row gap-3 sm:gap-4 items-start cursor-pointer hover:shadow-sm transition"
              onClick={() => handleOpenProductDetails(item)}
            >
              <img
                src={item?.images?.[0] || '/no-image.png'}
                alt={item?.title || 'Product'}
                className="w-full sm:w-24 h-40 sm:h-24 rounded-lg object-cover border"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {item?.title || 'Untitled Product'}
                </h2>
                <p className="text-sm text-gray-500 truncate">
                  {item?.categoryName ||
                    item?.categoryId ||
                    item?.category?.name ||
                    item?.category?.categoryId ||
                    ''}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold">
                    Rs {item?.sellingPrice ?? 0}
                  </span>
                  <span className="line-through text-xs text-gray-400">
                    Rs {item?.mrpPrice ?? 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddShoppingCartIcon />}
                    onClick={(e) => handleAddToCart(e, item)}
                    sx={{ textTransform: 'none' }}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    disabled={actionLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
