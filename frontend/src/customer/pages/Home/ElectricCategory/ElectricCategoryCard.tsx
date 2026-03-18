import React from 'react'

const ElectricCategoryCard = () => {
  const imageSrc = null;

  return (
      <div>
          {imageSrc ? <img className='object-contain h-10' src={imageSrc} alt="Electronics" /> : null}
            <h1 className='font-semibold text-sm'>Electronics</h1>
    </div>
  )
}

export default ElectricCategoryCard
