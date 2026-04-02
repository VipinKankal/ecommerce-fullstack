import React from 'react';
import DealCard from './DealCard';

const Deal = () => {
  const deals = [
    {
      id: 'footwear',
      title: 'Sneaker Drop',
      subtitle: 'Clean everyday pairs',
      price: 'Up to 40% off',
      accent: 'bg-[#171717]',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'shirt',
      title: 'Premium Shirts',
      subtitle: 'Everyday polished fits',
      price: 'From Rs 699',
      accent: 'bg-[#7c2d12]',
      image:
        'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'denim',
      title: 'Denim Rotation',
      subtitle: 'Straight fits and washed blues',
      price: 'Save Rs 1800',
      accent: 'bg-[#0f172a]',
      image:
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'ethnic',
      title: 'Festive Edit',
      subtitle: 'Fresh ethnic bundle',
      price: 'Flat 30% off',
      accent: 'bg-[#9d174d]',
      image:
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {deals.map((item) => (
          <DealCard key={item.id} {...item} />
        ))}
    </div>
  );
};

export default Deal;
