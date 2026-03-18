import React, { useState } from "react";
import { IconButton, Chip } from "@mui/material";
import { Add, Remove, DeleteOutline } from "@mui/icons-material";
import { useAppDispatch } from "app/store/Store";
import { deleteItem, fetchUserCart, updateItem } from "../../../State/Cart/cartSlice";

const CartItemCard = ({ item }: { item: any }) => {
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const productImage = item?.product?.images?.[0] || "/no-image.png";
  const productTitle = item?.product?.title || "Product";

  const handleUpdateQuantity = async (value: number) => {
    if (isDeleting) return;
    await dispatch(updateItem({
      cartItemId: item.id,
      cartItem: { quantity: item.quantity + value },
    }));
    dispatch(fetchUserCart());
  };

  const handleDeleteItem = async () => {
    setIsDeleting(true);
    await dispatch(deleteItem({ cartItemId: item.id })).unwrap();
    dispatch(fetchUserCart());
  };

  return (
    <div className="group flex flex-col sm:flex-row gap-6 p-4 border border-gray-100 rounded-2xl bg-white hover:border-teal-200 hover:shadow-lg transition-all">
      <div className="w-full sm:w-32 h-40 shrink-0 overflow-hidden rounded-xl">
        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
             src={productImage} alt={productTitle} />
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-gray-900 text-lg uppercase leading-tight">{productTitle}</h3>
            <p className="text-gray-400 text-xs font-bold mt-1">Size: <span className="text-gray-900">{item.size || 'OS'}</span></p>
          </div>
          <IconButton onClick={handleDeleteItem} sx={{ color: '#ff4d4d', bgcolor: '#fff5f5' }}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
            <IconButton size="small" onClick={() => handleUpdateQuantity(-1)} disabled={item.quantity <= 1}>
              <Remove fontSize="small" />
            </IconButton>
            <span className="px-4 font-black text-gray-800">{item.quantity}</span>
            <IconButton size="small" onClick={() => handleUpdateQuantity(1)}>
              <Add fontSize="small" />
            </IconButton>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black text-gray-900">₹{item.sellingPrice}</p>
            {item.mrpPrice > item.sellingPrice && (
               <p className="text-xs line-through text-gray-400 font-bold">₹{item.mrpPrice}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
