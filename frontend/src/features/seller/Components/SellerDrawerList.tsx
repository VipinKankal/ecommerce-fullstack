import React from 'react';
import {
  DashboardOutlined,
  Dashboard,
  Inventory2Outlined,
  Inventory,
  ShoppingBagOutlined,
  ShoppingBag,
  AddBoxOutlined,
  AddBox,
  AccountBalanceWalletOutlined,
  AccountBalanceWallet,
  ReceiptLongOutlined,
  ReceiptLong,
  AccountCircleOutlined,
  AccountCircle,
  Logout,
  AutorenewOutlined,
  Autorenew,
} from '@mui/icons-material';
import { useAppDispatch } from 'State/features/store/Store';
import { useNavigate } from 'react-router-dom';
import DrawerList from 'shared/components/ui/DrawerList';
import { logout } from 'State/features/seller/auth/thunks';

const menu = [
  {
    name: 'Dashboard',
    path: '/seller/dashboard',
    icon: <DashboardOutlined />,
    activeIcon: <Dashboard />,
  },
  {
    name: 'Products',
    path: '/seller/products',
    icon: <Inventory2Outlined />,
    activeIcon: <Inventory />,
  },
  {
    name: 'Orders',
    path: '/seller/orders',
    icon: <ShoppingBagOutlined />,
    activeIcon: <ShoppingBag />,
  },
  {
    name: 'Returns',
    path: '/seller/returns',
    icon: <AutorenewOutlined />,
    activeIcon: <Autorenew />,
  },
  {
    name: 'Exchanges',
    path: '/seller/exchanges',
    icon: <AutorenewOutlined />,
    activeIcon: <Autorenew />,
  },
  {
    name: 'Add Product',
    path: '/seller/add-product',
    icon: <AddBoxOutlined />,
    activeIcon: <AddBox />,
  },
  {
    name: 'Payments',
    path: '/seller/payments',
    icon: <AccountBalanceWalletOutlined />,
    activeIcon: <AccountBalanceWallet />,
  },
  {
    name: 'Transactions',
    path: '/seller/transactions',
    icon: <ReceiptLongOutlined />,
    activeIcon: <ReceiptLong />,
  },
];

const SellerDrawerList = ({ toggleDrawer }: { toggleDrawer?: () => void }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout(navigate));
    if (toggleDrawer) toggleDrawer();
  };

  const menu2 = [
    {
      name: 'Account',
      path: '/seller/account',
      icon: <AccountCircleOutlined />,
      activeIcon: <AccountCircle />,
    },
    {
      name: 'Logout',
      path: '/',
      icon: <Logout />,
      activeIcon: <Logout />,
      onClick: handleLogout,
    },
  ];

  return <DrawerList menu={menu} menu2={menu2} toggleDrawer={toggleDrawer} />;
};

export default SellerDrawerList;
