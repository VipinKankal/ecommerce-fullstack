import React from 'react';
import { Route, Routes } from 'react-router-dom';
import SellersTable from '../../features/admin/Pages/Sellers/SellersTable';
import Coupon from '../../features/admin/Coupon/Coupon';
import AddNewCouponFrom from '../../features/admin/Coupon/AddNewCouponFrom';
import GridTable from '../../features/admin/HomePage/GridTable';
import ElectronicTable from '../../features/admin/HomePage/ElectronicTable';
import ShopByCategoryTable from '../../features/admin/HomePage/ShopByCategoryTable';
import Deal from '../../features/admin/HomePage/Deal';
import AdminTransactions from '../../features/admin/Pages/Dashboard/AdminTransactions';
import AdminAccount from '../../features/admin/Pages/Dashboard/AdminAccount';
import AdminUsers from '../../features/admin/Pages/Dashboard/AdminUsers';
import AdminProducts from '../../features/admin/Pages/Dashboard/AdminProducts';
import AdminWarehouseStock from '../../features/admin/Pages/Dashboard/AdminWarehouseStock';
import AdminOrders from '../../features/admin/Pages/Dashboard/AdminOrders';
import AdminReports from '../../features/admin/Pages/Dashboard/AdminReports';
import AdminOverview from '../../features/admin/Pages/Dashboard/AdminOverview';
import AdminManualUpiPayments from '../../features/admin/Pages/Dashboard/AdminManualUpiPayments';
import AdminCourierManagement from '../../features/admin/Courier/AdminCourierManagement';
import AdminReturnRequests from '../../features/admin/returns/AdminReturnRequests';
import AdminExchangeRequests from '../../features/admin/exchanges/AdminExchangeRequests';

const AdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/dashboard" element={<AdminOverview />} />
        <Route path="/sellers" element={<SellersTable />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/products" element={<AdminProducts />} />
        <Route path="/warehouse-stock" element={<AdminWarehouseStock />} />
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
