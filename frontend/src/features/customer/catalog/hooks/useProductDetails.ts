import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { ProductVariant } from 'shared/types/product.types';
import { fetchProductById } from 'State/features/customer/catalog/thunks';
import { addToCart } from 'State/features/customer/cart/slice';
import {
  fetchWishlist,
  toggleWishlistProduct,
} from 'State/features/customer/wishlist/slice';

export const useProductDetails = () => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState('NONE');
  const [notifyMessage, setNotifyMessage] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { productId } = useParams();
  const { selectedProduct } = useAppSelector((state) => state.product);
  const { loading } = useAppSelector((state) => state.cart);
  const customer = useAppSelector((state) => state.customerAuth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const wishlistUpdating = useAppSelector(
    (state) => state.wishlist.actionLoading,
  );

  const isWishlisted = Boolean(
    selectedProduct?.id &&
    wishlistItems.some(
      (item: { id?: number } | null | undefined) =>
        item?.id === selectedProduct.id,
    ),
  );
  const productImages =
    selectedProduct?.images && selectedProduct.images.length > 0
      ? selectedProduct.images
      : ['/no-image.png'];
  const resolvedActiveImage =
    activeImage >= productImages.length ? 0 : activeImage;
  const warehouseStock = Number(
    selectedProduct?.warehouseStock ?? selectedProduct?.quantity ?? 0,
  );
  const variantMap = useMemo(() => {
    const map = new Map<string, ProductVariant>();
    (selectedProduct?.variants || []).forEach((variant) => {
      const key = (variant.size || '').trim().toUpperCase();
      if (key) {
        map.set(key, variant);
      }
    });
    return map;
  }, [selectedProduct?.variants]);
  const sizes = useMemo(() => {
    if (variantMap.size > 0) {
      return Array.from(variantMap.values())
        .map((variant) => (variant.size || '').trim())
        .filter(Boolean);
    }
    const rawSizes = selectedProduct?.sizes;
    if (typeof rawSizes === 'string' && rawSizes.trim().length > 0) {
      return rawSizes
        .split(',')
        .map((size) => size.trim())
        .filter(Boolean);
    }
    return ['M'];
  }, [selectedProduct?.sizes, variantMap]);
  const selectedVariant = selectedSize
    ? variantMap.get(selectedSize.trim().toUpperCase()) || null
    : null;
  const hasVariantStock = variantMap.size > 0;
  const selectedWarehouseStock =
    selectedVariant?.warehouseStock != null
      ? Number(selectedVariant.warehouseStock)
      : warehouseStock;
  const isOutOfStock = selectedWarehouseStock <= 0;
  const onlyLeftLabel =
    selectedWarehouseStock > 0 && selectedWarehouseStock <= 3
      ? `Only ${selectedWarehouseStock} left`
      : '';
  const isSelectedSizeAvailable = selectedWarehouseStock > 0;

  const handleIncrement = () => {
    if (selectedWarehouseStock <= 0) return;
    setQuantity((prev) => Math.min(prev + 1, selectedWarehouseStock));
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    if (!customer) {
      navigate('/login');
      return;
    }

    try {
      await dispatch(
        addToCart({
          productId: selectedProduct.id,
          quantity,
          size: selectedSize,
        }),
      ).unwrap();

      alert('Product added to cart successfully!');
    } catch {
      alert('Failed to add product to cart.');
    }
  };

  const handleBuyNow = async () => {
    if (!selectedProduct) return;
    if (!customer) {
      navigate('/login');
      return;
    }

    try {
      await dispatch(
        addToCart({
          productId: selectedProduct.id,
          quantity,
          size: selectedSize,
        }),
      ).unwrap();
      navigate('/checkout/cart');
    } catch {
      alert('Failed to process Buy Now.');
    }
  };

  const handleToggleWishlist = async () => {
    if (!selectedProduct?.id) return;
    if (!customer) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(toggleWishlistProduct(selectedProduct.id)).unwrap();
    } catch {
      alert('Failed to update wishlist.');
    }
  };

  const handleNotifyMe = async () => {
    if (!selectedProduct?.id) return;

    if (!customer) {
      navigate('/login');
      return;
    }

    setNotifyLoading(true);
    try {
      const response = await api.post(API_ROUTES.products.notifyMe(selectedProduct.id));
      setNotifyStatus(String(response.data?.status || 'SUBSCRIBED'));
      setNotifyMessage(
        String(
          response.data?.message || 'You will be notified when stock is back.',
        ),
      );
    } catch (error) {
      setNotifyMessage(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to save notification request.',
      );
    } finally {
      setNotifyLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(Number(productId)));
    }
  }, [productId, dispatch]);

  useEffect(() => {
    if (customer) {
      dispatch(fetchWishlist());
    }
  }, [customer, dispatch]);

  useEffect(() => {
    if (!sizes.length) return;
    setSelectedSize((current) => {
      if (current && sizes.includes(current)) {
        return current;
      }
      const firstAvailable = sizes.find((size) => {
        const variant = variantMap.get(size.trim().toUpperCase());
        return variant ? Number(variant.warehouseStock || 0) > 0 : true;
      });
      return firstAvailable || sizes[0];
    });
  }, [sizes, variantMap]);

  useEffect(() => {
    if (selectedWarehouseStock <= 0) {
      setQuantity(1);
      return;
    }
    setQuantity((current) =>
      Math.min(Math.max(current, 1), selectedWarehouseStock),
    );
  }, [selectedWarehouseStock, selectedSize]);

  useEffect(() => {
    const loadNotifyStatus = async () => {
      if (!customer || !selectedProduct?.id || !isOutOfStock) {
        setNotifyStatus('NONE');
        setNotifyMessage('');
        return;
      }

      try {
        const response = await api.get(
          API_ROUTES.products.notifyMeStatus(selectedProduct.id),
        );
        setNotifyStatus(String(response.data?.status || 'NONE'));
      } catch {
        setNotifyStatus('NONE');
      }
    };

    loadNotifyStatus();
  }, [customer, isOutOfStock, selectedProduct?.id]);

  return {
    activeImage: resolvedActiveImage,
    handleAddToCart,
    handleBuyNow,
    handleDecrement,
    handleIncrement,
    handleNotifyMe,
    handleToggleWishlist,
    isWishlisted,
    isOutOfStock,
    loading,
    notifyLoading,
    notifyMessage,
    notifyStatus,
    hasVariantStock,
    isSelectedSizeAvailable,
    onlyLeftLabel,
    productImages,
    selectedProduct,
    selectedVariant,
    selectedSize,
    setActiveImage,
    setSelectedSize,
    sizes,
    quantity,
    warehouseStock: selectedWarehouseStock,
    wishlistUpdating,
  };
};
