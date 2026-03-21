import React from 'react';
import DealCard from './DealCard';

const Deal = () => {
  const deals = Array.from({ length: 6 }, (_, index) => ({
    id: `deal-${index}`,
  }));

  return (
    <div className="py-5 lg:px-20">
      <div className="flex items-center justify-between">
        {deals.map((item) => (
          <DealCard key={item.id} />
        ))}
      </div>
    </div>
  );
};

export default Deal;
