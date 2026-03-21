import React from 'react';
import ElectricCategoryCard from './ElectricCategoryCard';

const ElectricCategory = () => {
  const categories = [
    'electronics-1',
    'electronics-2',
    'electronics-3',
    'electronics-4',
    'electronics-5',
  ];

  return (
    <div className="flex flex-wrap justify-between py-5 lg:px-20 border-b">
      {categories.map((item) => (
        <ElectricCategoryCard key={item} />
      ))}
    </div>
  );
};

export default ElectricCategory;
