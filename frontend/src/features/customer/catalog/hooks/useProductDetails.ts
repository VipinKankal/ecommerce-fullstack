import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductById } from 'State/features/customer/catalog/thunks';
import { addToCart } from 'State/features/customer/cart/slice';
import {
  fetchWishlist,
  toggleWishlistProduct,
} from 'State/features/customer/wishlist/slice';

const sizes: string[] = ['S', 'M', 'L', 'XL', 'XXL'];

export const useProductDetails = () => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeImage, setActiveImage] = useState(0);

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

  const handleIncrement = () => setQuantity((prev) => prev + 1);

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

  return {
    activeImage: resolvedActiveImage,
    handleAddToCart,
    handleBuyNow,
    handleDecrement,
    handleIncrement,
    handleToggleWishlist,
    isWishlisted,
    loading,
    productImages,
    selectedProduct,
    selectedSize,
    setActiveImage,
    setSelectedSize,
    sizes,
    quantity,
    wishlistUpdating,
  };
};
