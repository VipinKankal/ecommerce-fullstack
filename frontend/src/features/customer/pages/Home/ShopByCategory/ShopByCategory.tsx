import React from 'react';
import ShopByCategoryCard from './ShopByCategoryCard';

const ShopByCategory = () => {
  const categories = [
    {
      id: 'fashion',
      title: 'Modern Fashion',
      note: 'Shirts, layers, daily essentials',
      image:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#f6d6d8] to-[#fff5f6]',
    },
    {
      id: 'home',
      title: 'Home & Decor',
      note: 'Quiet corners and warm accents',
      image:
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#dcefd5] to-[#f7fcf5]',
    },
    {
      id: 'beauty',
      title: 'Beauty Shelf',
      note: 'Skincare, wellness, glow kits',
      image:
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#ead9ff] to-[#faf6ff]',
    },
    {
      id: 'gadgets',
      title: 'Smart Gadgets',
      note: 'Audio, wearables and desk tech',
      image:
        'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#d7e8ff] to-[#f5f9ff]',
    },
    {
      id: 'gifting',
      title: 'Gift Finds',
      note: 'Easy picks for quick gifting',
      image:
        'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#ffe4c8] to-[#fff8ef]',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {categories.map((item) => (
        <ShopByCategoryCard key={item.id} {...item} />
      ))}
    </div>
  );
};

export default ShopByCategory;
