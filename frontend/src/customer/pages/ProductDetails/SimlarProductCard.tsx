import React from 'react';

const SimilarProductCard: React.FC = () => {
  return (
    <div className="group cursor-pointer">
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100">
        <img
          src="https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg"
          alt="Product"
          className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-bold text-gray-700 uppercase">Raam Clothing</h3>
        <p className="mt-1 text-sm text-gray-500">Premium Cotton Shirt</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-gray-900">₹450</span>
          <span className="text-xs text-gray-400 line-through">₹900</span>
        </div>
      </div>
    </div>
  );
};

export default SimilarProductCard;
