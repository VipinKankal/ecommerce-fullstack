import React from 'react';
import {
  ChatBubbleOutline,
  SendOutlined,
  ShoppingBagOutlined,
} from '@mui/icons-material';

const actionItems = [
  { label: 'Buy Now', icon: ShoppingBagOutlined },
  { label: 'Review', icon: ChatBubbleOutline },
  { label: 'Share', icon: SendOutlined },
];

const ProductCard = ({ product }) => {
  return (
    <article className="pb-5 last:pb-0">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="h-[330px] w-full object-cover"
        />
        <div className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white">
          {product.count}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={`${product.id}-dot-${index}`}
            className={`h-1.5 w-1.5 rounded-full ${
              index === 0 ? 'bg-gray-700' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="px-4 py-3">
        <div className="space-y-1.5 text-[12px] leading-5 text-gray-800">
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-gray-600">{product.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="font-semibold text-gray-900">Rs. {product.price}</span>
            <span className="text-gray-400 line-through">Rs. {product.originalPrice}</span>
            <span className="font-medium text-emerald-600">({product.discount})</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-6 text-[10px] text-gray-700">
          {actionItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={`${product.id}-${item.label}`}
                type="button"
                className="flex flex-col items-center gap-1 transition hover:text-black"
              >
                <Icon sx={{ fontSize: 18 }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
