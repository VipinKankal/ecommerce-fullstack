import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { teal } from "@mui/material/colors";
import { Button, Divider, IconButton } from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Star as StarIcon,
  AddShoppingCart,
  FlashOn,
  Favorite,
  FavoriteBorder,
} from "@mui/icons-material";
import SimilarProduct from "./SimlarProduct";
import ReviewCard from "../Review/ReviewCard";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { fetchProductById } from "../../../State/Customer/productThunks";
import { addToCart } from "../../../State/Cart/cartSlice";
import {
  fetchWishlist,
  toggleWishlistProduct,
} from "../../../State/Wishlist/wishlistSlice";

const sizes: string[] = ["S", "M", "L", "XL", "XXL"];

const ProductDetails = () => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [activeImage, setActiveImage] = useState(0);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { productId } = useParams();
  const { selectedProduct } = useAppSelector((state) => state.product);
  const { loading } = useAppSelector((state) => state.cart);
  const customer = useAppSelector((state) => state.customerAuth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const wishlistUpdating = useAppSelector((state) => state.wishlist.actionLoading);

  const isWishlisted = Boolean(
    selectedProduct?.id &&
      wishlistItems.some((item: any) => item?.id === selectedProduct.id),
  );
  const productImages =
    selectedProduct?.images && selectedProduct.images.length > 0
      ? selectedProduct.images
      : ["/no-image.png"];

  useEffect(() => {
    setActiveImage(0);
  }, [selectedProduct?.id]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    if (!customer) {
      navigate("/login");
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

      alert("Product added to cart successfully!");
    } catch (error) {
      alert("Failed to add product to cart.");
    }
  };

  const handleBuyNow = async () => {
    if (!selectedProduct) return;
    if (!customer) {
      navigate("/login");
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
      navigate("/checkout/cart");
    } catch (error) {
      alert("Failed to process Buy Now.");
    }
  };

  const handleToggleWishlist = async () => {
    if (!selectedProduct?.id) return;
    if (!customer) {
      navigate("/login");
      return;
    }
    try {
      await dispatch(toggleWishlistProduct(selectedProduct.id)).unwrap();
    } catch (error) {
      alert("Failed to update wishlist.");
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

  if (!selectedProduct) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="px-3 sm:px-5 lg:px-20 pt-6 sm:pt-10 font-sans pb-20 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
        <section className="flex flex-col lg:flex-row gap-3 sm:gap-5">
          <div className="w-full lg:w-[15%] flex lg:flex-col gap-2 sm:gap-3 order-2 lg:order-1 overflow-x-auto pb-1">
            {productImages.map((item: string, index: number) => (
              <div
                key={index}
                onClick={() => setActiveImage(index)}
                className={`min-w-[72px] w-[72px] sm:w-20 lg:w-full h-20 sm:h-24 bg-gray-100 rounded-md overflow-hidden cursor-pointer border ${
                  activeImage === index ? "border-teal-500" : "border-gray-200"
                }`}
              >
                <img className="w-full h-full object-cover" src={item} alt="thumbnail" />
              </div>
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
          <h1 className="font-bold text-xl sm:text-3xl uppercase">{selectedProduct.title}</h1>

          <p className="text-gray-500 mt-1">
            {selectedProduct.category?.categoryId?.replace("-", " ")}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-teal-600 font-bold">{selectedProduct.ratings || 0}</span>
            <StarIcon sx={{ color: teal[500], fontSize: 16 }} />
            <span className="text-gray-400 text-sm">({selectedProduct.numRatings} Ratings)</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mt-4 sm:mt-6">
            <span className="text-2xl sm:text-3xl font-bold">Rs {selectedProduct.sellingPrice}</span>
            <span className="line-through text-gray-400 text-sm sm:text-base">Rs {selectedProduct.mrpPrice}</span>
            <span className="text-teal-600 font-bold text-sm sm:text-base">({selectedProduct.discountPercent}% OFF)</span>
          </div>

          <div className="mt-6 sm:mt-8">
            <h3 className="font-bold mb-3">Select Size</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border text-sm sm:text-base ${
                    selectedSize === size ? "border-teal-600 bg-teal-50" : "border-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <h3 className="font-bold mb-3">Quantity</h3>
            <div className="flex items-center border w-fit rounded-lg">
              <IconButton onClick={handleDecrement} disabled={quantity <= 1}>
                <RemoveIcon />
              </IconButton>
              <span className="px-6 font-bold">{quantity}</span>
              <IconButton onClick={handleIncrement}>
                <AddIcon />
              </IconButton>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:gap-4">
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddShoppingCart />}
              onClick={handleAddToCart}
              disabled={loading}
              sx={{
                py: { xs: "0.7rem", sm: "1.2rem" },
                bgcolor: teal[600],
                fontWeight: "bold",
                textTransform: "none",
                fontSize: { xs: "0.78rem", sm: "0.92rem" },
              }}
            >
              {loading ? "Adding..." : "Add to Cart"}
            </Button>

            <Button
              fullWidth
              variant="contained"
              color="warning"
              startIcon={<FlashOn />}
              onClick={handleBuyNow}
              disabled={loading}
              sx={{
                py: { xs: "0.7rem", sm: "1.2rem" },
                fontWeight: "bold",
                textTransform: "none",
                fontSize: { xs: "0.78rem", sm: "0.92rem" },
              }}
            >
              Buy Now
            </Button>

            <Button
              fullWidth
              variant={isWishlisted ? "contained" : "outlined"}
              color={isWishlisted ? "error" : "inherit"}
              startIcon={isWishlisted ? <Favorite /> : <FavoriteBorder />}
              onClick={handleToggleWishlist}
              disabled={wishlistUpdating}
              sx={{ textTransform: "none", fontSize: { xs: "0.78rem", sm: "0.92rem" } }}
            >
              {isWishlisted ? "Wishlisted" : "Wishlist"}
            </Button>
          </div>

          <div className="mt-8 sm:mt-10">
            <h3 className="font-bold mb-2">Product Description</h3>
            <p className="text-gray-600">{selectedProduct.description || "No description available"}</p>
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

export default ProductDetails;


