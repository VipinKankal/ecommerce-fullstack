import React from 'react'
import ShopByCategoryCard from './ShopByCategoryCard'

const ShopByCategory = () => {
  return (
      <div className="flex flex-wrap justify-between py-5 lg:px-20 border-b">
      {[1, 1, 1, 1, 1].map((item) => (
        <ShopByCategoryCard />
      ))}
    </div>
  )
}

export default ShopByCategory
