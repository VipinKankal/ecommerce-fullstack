import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import ProductCard from './ProductCard';

const products = [
  {
    id: 1,
    name: 'Classic White Shirt',
    description: 'Crisp cotton essential with a clean everyday fit.',
    price: 2899,
    originalPrice: 3999,
    discount: '40% OFF',
    image:
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
    count: '1 / 6',
  },
  {
    id: 2,
    name: 'Minimal Beige Overshirt',
    description: 'Soft neutral layering piece for smart casual looks.',
    price: 1299,
    originalPrice: 2099,
    discount: '38% OFF',
    image:
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80',
    count: '1 / 6',
  },
  {
    id: 3,
    name: 'Street Denim Jacket',
    description: 'Sharp silhouette with a relaxed, premium finish.',
    price: 3499,
    originalPrice: 4999,
    discount: '30% OFF',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    count: '1 / 6',
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto flex h-screen w-full max-w-[400px] flex-col overflow-hidden bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <Header />

        <main className="flex-1 overflow-y-auto pt-14 pb-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </main>

        <BottomNav active="product" />
      </div>
    </div>
  );
};

export default Home;
