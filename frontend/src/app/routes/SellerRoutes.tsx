import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Order from '../../features/seller/Pages/Orders/Order';
import Products from '../../features/seller/Pages/Products/Products';
import AddProducts from '../../features/seller/Pages/Products/AddProducts';
import Transaction from '../../features/seller/Pages/Transactions/Transaction';
import Payment from '../../features/seller/Pages/Transactions/Payment';
import Profile from '../../features/seller/Pages/Account/Profile';
import SellerDashboardHome from '../../features/seller/Pages/SellerDashboard/SellerDashboardHome';
import SellerReturnAdjustmentsPage from '../pages/seller/SellerReturnAdjustmentsPage';
import SellerExchangeAdjustmentsPage from '../pages/seller/SellerExchangeAdjustmentsPage';
import SellerTransfers from '../../features/seller/Pages/Transfers/SellerTransfers';
import SellerComplianceNotesPage from '../pages/seller/SellerComplianceNotesPage';
import SellerComplianceNoteDetailPage from '../pages/seller/SellerComplianceNoteDetailPage';

const SellerRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<SellerDashboardHome />} />
      <Route path="/products" element={<Products />} />
      <Route path="/add-product" element={<AddProducts />} />
      <Route path="/orders" element={<Order />} />
      <Route path="/transfers" element={<SellerTransfers />} />
      <Route path="/returns" element={<SellerReturnAdjustmentsPage />} />
      <Route path="/exchanges" element={<SellerExchangeAdjustmentsPage />} />
      <Route path="/payments" element={<Payment />} />
      <Route path="/transactions" element={<Transaction />} />
      <Route path="/account" element={<Profile />} />
      <Route path="/notes" element={<SellerComplianceNotesPage />} />
      <Route path="/notes/:noteId" element={<SellerComplianceNoteDetailPage />} />
    </Routes>
  );
};

export default SellerRoutes;
