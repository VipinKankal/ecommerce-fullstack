import React from 'react'
import OrderTable from './OrderTable'

const Order = () => {
  return (
    <div className='space-y-5'>
        <h1 className='text-2xl font-bold text-gray-800'>All Orders</h1>
        <OrderTable />
    </div>
  )
}

export default Order