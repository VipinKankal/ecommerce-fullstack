import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Order from '../../features/seller/Pages/Orders/Order';
import Products from '../../features/seller/Pages/Products/Products';
import AddProducts from '../../features/seller/Pages/Products/AddProducts';
import Transaction from '../../features/seller/Pages/Transactions/Transaction';
import Payment from '../../features/seller/Pages/Transactions/Payment';
import Profile from '../../features/seller/Pages/Account/Profile';
import SellerDashboardHome from '../../features/seller/Pages/SellerDashboard/SellerDashboardHome';
import SellerReturnRequests from '../../features/seller/Pages/Aftercare/SellerReturnRequests';
import SellerExchangeRequests from '../../features/seller/Pages/Aftercare/SellerExchangeRequests';

const SellerRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<SellerDashboardHome />} />
      <Route path="/products" element={<Products />} />
      <Route path="/add-product" element={<AddProducts />} />
      <Route path="/orders" element={<Order />} />
      <Route path="/returns" element={<SellerReturnRequests />} />
      <Route path="/exchanges" element={<SellerExchangeRequests />} />
      <Route path="/payments" element={<Payment />} />
      <Route path="/transactions" element={<Transaction />} />
      <Route path="/account" element={<Profile />} />
    </Routes>
  );
};

export default SellerRoutes;
