import React from 'react';
import ProductsTable from './ProductsTable';

const Products = () => {
  
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Products Portfolio</h1>
            </div>
            <ProductsTable />
        </div>
    );
};

export default Products;
