import React from 'react'
import './ShopByCategory.css'

const ShopByCategoryCard = () => {
  return (
    <div className='flex gap-3 flex-col justify-center items-center group cursor-pointer'>
      
          <div className='custome-border w-[150px] h-[150px] lg:h-[249px] lg:w-[249px] rounded-full bg-primary-color'>
        <img className='rounded-full group-hover:scale-95 transition-transform transition-duration-700 object-cover object-top h-full w-full'
          src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70" alt='' />
          </div>
          <h1 className='font-semibold text-sm'>kitchen & Table</h1>
    </div>
  )
}

export default ShopByCategoryCard
