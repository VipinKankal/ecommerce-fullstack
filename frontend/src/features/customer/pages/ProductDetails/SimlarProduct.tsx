import React from 'react';
import SimilarProductCard from './SimlarProductCard';

const SimilarProduct: React.FC = () => {
  const placeholderIds = [
    'slot-1',
    'slot-2',
    'slot-3',
    'slot-4',
    'slot-5',
    'slot-6',
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {placeholderIds.map((slotId) => (
        <SimilarProductCard key={slotId} />
      ))}
    </div>
  );
};

export default SimilarProduct;
