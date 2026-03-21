import React from 'react';

const CategoryGrid = () => {
  return (
    <div className="grid grid-cols-12 grid-rows-12 gap-4 px-5 lg:h-[600px] lg:px-20">
      <div className="col-span-3 row-span-12 text-white">
        <img
          className="w-full h-full object-cover rounded-md"
          src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70"
          alt="Category highlight 1"
        />
      </div>

      <div className="col-span-2 row-span-6 text-white">
        <img
          className="w-full h-full object-cover rounded-md"
          src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70"
          alt="Category highlight 2"
        />
      </div>

      <div className="col-span-4 row-span-6 text-white">
        <img
          className="w-full h-full object-cover rounded-md"
          src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70"
          alt="Category highlight 3"
        />
      </div>

      <div className="col-span-3 row-span-12 text-white">
        <img
          className="w-full h-full object-cover rounded-md"
          src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70"
          alt="Category highlight 4"
        />
      </div>

      <div className="col-span-4 row-span-6 text-white">
        <img
          className="w-full h-full object-cover rounded-md"
          src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70"
          alt="Category highlight 5"
        />
      </div>

      <div className="col-span-2 row-span-6 text-white">
        <img
          className="w-full h-full object-cover rounded-md"
          src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70"
          alt="Category highlight 6"
        />
      </div>
    </div>
  );
};

export default CategoryGrid;
