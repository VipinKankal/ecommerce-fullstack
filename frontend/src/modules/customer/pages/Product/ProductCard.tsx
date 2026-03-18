import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import { useNavigate } from "react-router-dom";
import { Product } from "../../../State/Types/ProductTypes";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { addToCart } from "../../../State/Cart/cartSlice";
import { toggleWishlistProduct } from "../../../State/Wishlist/wishlistSlice";

const ProductCard = ({ item }: { item: Product }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const customer = useAppSelector((state) => state.customerAuth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const images = item.images || [];
  const isWishlisted = Boolean(
    item.id && wishlistItems.some((wishlistItem: any) => wishlistItem?.id === item.id),
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
      }, 1000);
    } else {
      setCurrentImage(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovered, images.length]);

  const getDefaultSize = () => {
    const rawSize = (item as any).size || (item as any).sizes;
    if (typeof rawSize === "string" && rawSize.trim().length > 0) {
      return rawSize.split(",")[0].trim();
    }
    return "M";
  };

  const handleNavigate = () => {
    navigate(`/product-details/${item.category?.categoryId}/${item.title}/${item.id}`);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer) {
      navigate("/login");
      return;
    }
    if (!item.id) return;
    await dispatch(toggleWishlistProduct(item.id));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer) {
      navigate("/login");
      return;
    }
    if (!item.id) return;
    await dispatch(
      addToCart({
        productId: item.id,
        quantity: 1,
        size: getDefaultSize(),
      }),
    );
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer) {
      navigate("/login");
      return;
    }
    if (!item.id) return;
    await dispatch(
      addToCart({
        productId: item.id,
        quantity: 1,
        size: getDefaultSize(),
      }),
    );
    navigate("/checkout/cart");
  };

  const displayColor =
    typeof item.color === "string"
      ? item.color
      : (item.color as any)?.name || "N/A";
  const fallbackImage =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleNavigate}
      // Clean Grid: No rounded corners, subtle border
      className="group w-full relative cursor-pointer bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 z-0 hover:z-10"
    >
      {/* Image Section */}
      <div className="relative h-[240px] sm:h-[300px] lg:h-[350px] overflow-hidden bg-gray-50">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentImage * 100}%)` }}
        >
          {(images.length > 0 ? images : [fallbackImage]).map((img, index) => (
            <img
              key={index}
              src={img}
              alt={item.title}
              className="w-full h-full object-cover flex-shrink-0"
            />
          ))}
        </div>

        {/* Wishlist Icon Overlay */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
        >
          {isWishlisted ? (
            <FavoriteIcon sx={{ fontSize: "1.2rem" }} className="text-[#ff3f6c]" />
          ) : (
            <FavoriteBorderIcon sx={{ fontSize: "1.2rem" }} className="text-gray-600" />
          )}
        </button>

        {/* Image Bottom CTA */}
        <div
          className={`absolute left-2 right-2 bottom-2 grid grid-cols-2 gap-1.5 p-1.5 rounded-lg bg-white/85 backdrop-blur-[1px] transition-all duration-300 ${
            isHovered
              ? "opacity-100 translate-y-0"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
          }`}
        >
          <Button
            variant="outlined"
            onClick={handleAddToCart}
            startIcon={<AddShoppingCartIcon sx={{ fontSize: 14 }} />}
            fullWidth
            sx={{
              textTransform: "none",
              fontSize: "11px",
              py: 0.55,
              minWidth: 0,
              borderColor: "#d4d5d9",
              color: "#282c3f",
              fontWeight: 700,
              backgroundColor: "rgba(255,255,255,0.92)",
              "&:hover": { borderColor: "#282c3f", backgroundColor: "rgba(255,255,255,0.98)" },
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
              textTransform: "none",
              fontSize: "11px",
              py: 0.55,
              minWidth: 0,
              backgroundColor: "#ff3f6c",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#e73961", boxShadow: "none" },
            }}
          >
            Buy Now
          </Button>
        </div>
      </div>

      {/* Info Section with Hover Overlay */}
      <div className="p-3 relative bg-white">
        {/* Brand - Always Visible */}
        <h3 className="font-bold text-sm text-gray-900 truncate uppercase tracking-tight">
            {item.title || "Brand"}
        </h3>

        <p className="text-xs text-gray-500 truncate mt-1">{displayColor}</p>

        {/* Price Section - Always Visible */}
        <div className="price flex items-center gap-1.5 mt-1">
          <span className="font-bold text-sm text-[#282c3f]">Rs. {item.sellingPrice}</span>
          <span className="text-gray-400 line-through text-[10px]">Rs. {item.mrpPrice}</span>
          <span className="text-[#ff905a] font-bold text-[10px]">{item.discountPercent}% OFF</span>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;


