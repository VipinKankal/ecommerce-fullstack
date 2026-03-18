import React from 'react'

const DealCard = () => {
  return (
      <div className='w-[13rem] cursor-pointer'>
          <img className='border-x-[7px] border-t-[7px] border-pink-600 w-full h-[12rem] object-cover object-top' src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg?q=70" alt="" />
          <div className='border-4 border-black bg-black text-white p-2 text-center'>
               <p className='text-lg font-semibold'>Smart Watch</p>
          <p className='text-2xl text-bold'>$99.00 OFF</p>
          <p className='text-balance text-lg'>Shop now</p>
          </div>
    </div>
  )
}

export default DealCard
