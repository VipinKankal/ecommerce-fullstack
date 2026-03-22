import React from 'react';
import DealCard from './DealCard';

const Deal = () => {
  const deals = [
    {
      id: 'watch',
      title: 'Smart Watch',
      subtitle: 'Clean AMOLED styles',
      price: 'Up to 40% off',
      accent: 'bg-[#171717]',
      image:
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
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
      id: 'speaker',
      title: 'Desk Speakers',
      subtitle: 'Compact but punchy',
      price: 'Save Rs 1800',
      accent: 'bg-[#0f172a]',
      image:
        'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'skincare',
      title: 'Glow Set',
      subtitle: 'Fresh beauty bundle',
      price: 'Flat 30% off',
      accent: 'bg-[#9d174d]',
      image:
        'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80',
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
