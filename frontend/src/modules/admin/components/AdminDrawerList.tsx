import React from "react";
import DrawerList from "shared/components/DrawerList";
import {
  AccountCircle,
  AccountCircleOutlined,
  GroupOutlined,
  Group,
  ConfirmationNumber,
  ConfirmationNumberOutlined,
  Home,
  HomeOutlined,
  Category,
  CategoryOutlined,
  ElectricBolt,
  ElectricBoltOutlined,
  LocalOffer,
  LocalOfferOutlined,
  GridView,
  GridViewOutlined,
  AccountBoxOutlined,
  LogoutOutlined,
  AccountBox,
  Logout,
  ReceiptLongOutlined,
  ReceiptLong,
  QrCode2Outlined,
  QrCode2,
  DashboardOutlined,
  Dashboard,
  Inventory2Outlined,
  Inventory2,
  ShoppingBagOutlined,
  ShoppingBag,
  InsightsOutlined,
  Insights,
  LocalShippingOutlined,
  LocalShipping,
  AutorenewOutlined,
  Autorenew,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "app/store/Store";
import { adminLogout } from "../../State/AdminAuthThunks";

const menu = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: <DashboardOutlined />,
    activeIcon: <Dashboard />,
  },
  {
    name: "Sellers",
    path: "/admin/sellers",
    icon: <AccountCircleOutlined />,
    activeIcon: <AccountCircle />,
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: <GroupOutlined />,
    activeIcon: <Group />,
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: <Inventory2Outlined />,
    activeIcon: <Inventory2 />,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: <ShoppingBagOutlined />,
    activeIcon: <ShoppingBag />,
  },
  {
    name: "Transactions",
    path: "/admin/transactions",
    icon: <ReceiptLongOutlined />,
    activeIcon: <ReceiptLong />,
  },
  {
    name: "Manual UPI",
    path: "/admin/manual-upi",
    icon: <QrCode2Outlined />,
    activeIcon: <QrCode2 />,
  },
  {
    name: "Return Requests",
    path: "/admin/return-requests",
    icon: <AutorenewOutlined />,
    activeIcon: <Autorenew />,
  },
  {
    name: "Exchange Requests",
    path: "/admin/exchange-requests",
    icon: <AutorenewOutlined />,
    activeIcon: <Autorenew />,
  },
  {
    name: "Reports",
    path: "/admin/reports",
    icon: <InsightsOutlined />,
    activeIcon: <Insights />,
  },
  {
    name: "Couriers",
    path: "/admin/couriers",
    icon: <LocalShippingOutlined />,
    activeIcon: <LocalShipping />,
  },
  {
    name: "Coupons",
    path: "/admin/coupon",
    icon: <ConfirmationNumberOutlined />,
    activeIcon: <ConfirmationNumber />,
  },
  {
    name: "Add Coupon",
    path: "/admin/add-new-coupon-from",
    icon: <LocalOfferOutlined />,
    activeIcon: <LocalOffer />,
  },
  {
    name: "Home Grid",
    path: "/admin/home-grid",
    icon: <GridViewOutlined />,
    activeIcon: <GridView />,
  },
  {
    name: "Electronics Category",
    path: "/admin/electronic-category",
    icon: <ElectricBoltOutlined />,
    activeIcon: <ElectricBolt />,
  },
  {
    name: "Shop By Category",
    path: "/admin/shop-by-category",
    icon: <CategoryOutlined />,
    activeIcon: <Category />,
  },
  {
    name: "Deals",
    path: "/admin/deals",
    icon: <HomeOutlined />,
    activeIcon: <Home />,
  },
];

const menu2 = [
  {
    name: "Account",
    path: "/admin/account",
    icon: <AccountBoxOutlined />,
    activeIcon: <AccountBox />,
  },
  {
    name: "Logout",
    path: "/",
    icon: <LogoutOutlined />,
    activeIcon: <Logout />,
  },
];

const AdminDrawerList = ({ toggleDrawer }: { toggleDrawer?: () => void }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    dispatch(adminLogout(navigate));
    if (toggleDrawer) toggleDrawer();
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <DrawerList
        menu={menu}
        menu2={menu2}
        toggleDrawer={toggleDrawer}
        onLogout={handleAdminLogout}
      />
    </div>
  );
};

export default AdminDrawerList;


