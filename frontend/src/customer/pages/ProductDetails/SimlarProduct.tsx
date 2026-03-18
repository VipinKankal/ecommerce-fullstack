import React from 'react';
import SimilarProductCard from './SimlarProductCard';
 
const SimilarProduct: React.FC = () => {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6'>
      {[...Array(6)].map((_, index) => (
        <SimilarProductCard key={index} />
      ))}
    </div>
  );
};

export default SimilarProduct;
