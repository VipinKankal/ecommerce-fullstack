import React from "react";
import { Route, Routes } from "react-router-dom";
import Order from "../../Seller/Pages/Orders/Order";
import Products from "../../Seller/Pages/Products/Products";
import AddProducts from "../../Seller/Pages/Products/AddProducts";
import Transaction from "../../Seller/Pages/Transactions/Transaction";
import Payment from "../../Seller/Pages/Transactions/Payment";
import Profile from "../../Seller/Pages/Account/Profile";
import SellerDashboardHome from "../../Seller/Pages/SellerDashboard/SellerDashboardHome";

const SellerRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<SellerDashboardHome />} />
      <Route path="/products" element={<Products />} />
      <Route path="/add-product" element={<AddProducts />} />
      <Route path="/orders" element={<Order />} />
      <Route path="/payments" element={<Payment />} />
      <Route path="/transactions" element={<Transaction />} />
      <Route path="/account" element={<Profile />} />
    </Routes>
  );
};

export default SellerRoutes;
