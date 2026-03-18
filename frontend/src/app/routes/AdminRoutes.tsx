import React from "react";
import { Route, Routes } from "react-router-dom";
import SellersTable from "../../admin/Pages/Sellers/SellersTable";
import Coupon from "../../admin/Coupon/Coupon";
import AddNewCouponFrom from "../../admin/Coupon/AddNewCouponFrom";
import GridTable from "../../admin/HomePage/GridTable";
import ElectronicTable from "../../admin/HomePage/ElectronicTable";
import ShopByCategoryTable from "../../admin/HomePage/ShopByCategoryTable";
import Deal from "../../admin/HomePage/Deal";
import AdminTransactions from "../../admin/Pages/Dashboard/AdminTransactions";
import AdminAccount from "../../admin/Pages/Dashboard/AdminAccount";
import AdminUsers from "../../admin/Pages/Dashboard/AdminUsers";
import AdminProducts from "../../admin/Pages/Dashboard/AdminProducts";
import AdminOrders from "../../admin/Pages/Dashboard/AdminOrders";
import AdminReports from "../../admin/Pages/Dashboard/AdminReports";
import AdminOverview from "../../admin/Pages/Dashboard/AdminOverview";
import AdminManualUpiPayments from "../../modules/admin/Pages/Dashboard/AdminManualUpiPayments";
import AdminCourierManagement from "../../modules/admin/Courier/AdminCourierManagement";
import AdminReturnRequests from "../../modules/adminReturns/AdminReturnRequests";
import AdminExchangeRequests from "../../modules/adminExchanges/AdminExchangeRequests";

const AdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/dashboard" element={<AdminOverview />} />
        <Route path="/sellers" element={<SellersTable />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/products" element={<AdminProducts />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/transactions" element={<AdminTransactions />} />
        <Route path="/manual-upi" element={<AdminManualUpiPayments />} />
        <Route path="/return-requests" element={<AdminReturnRequests />} />
        <Route path="/exchange-requests" element={<AdminExchangeRequests />} />
        <Route path="/couriers" element={<AdminCourierManagement />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/account" element={<AdminAccount />} />
        <Route path="/coupon" element={<Coupon />} />
        <Route path="/add-new-coupon-from" element={<AddNewCouponFrom />} />
        <Route path="/home-grid" element={<GridTable />} />
        <Route path="/electronic-category" element={<ElectronicTable />} />
        <Route path="/shop-by-category" element={<ShopByCategoryTable />} />
        <Route path="/deals" element={<Deal />} />
      </Routes>
    </div>
  );
};

export default AdminRoutes;

