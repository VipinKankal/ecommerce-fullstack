import React from 'react';
import ShopByCategoryCard from './ShopByCategoryCard';

const ShopByCategory = () => {
  const categories = [
    {
      id: 'menswear',
      title: 'Menswear',
      note: 'Shirts, trousers, tees and layers',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#f6d6d8] to-[#fff5f6]',
    },
    {
      id: 'womenswear',
      title: 'Womenswear',
      note: 'Kurtis, tops, denim and dresses',
      image:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#fbe0ea] to-[#fff6f8]',
    },
    {
      id: 'ethnic',
      title: 'Ethnic Edit',
      note: 'Fusion wear, festive sets and daily classics',
      image:
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#f6dfc8] to-[#fff7ef]',
    },
    {
      id: 'footwear',
      title: 'Footwear',
      note: 'Sneakers, sandals and everyday pairs',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#d7e8ff] to-[#f5f9ff]',
    },
    {
      id: 'basics',
      title: 'Daily Basics',
      note: 'Innerwear, sleepwear and easy repeat buys',
      image:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      accent: 'from-[#e7f0db] to-[#f8fcf2]',
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
