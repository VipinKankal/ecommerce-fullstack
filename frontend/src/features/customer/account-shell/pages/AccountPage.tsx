import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { deactivateAccount, logout } from 'State/features/customer/auth/thunks';
import Address from '../../pages/Account/Address';
import OrderDetails from '../../pages/Account/OrderDetails';
import Orders from '../../pages/Account/Orders';
import UserDetails from '../../pages/Account/UserDetails';

const accountLinks = [
  {
    id: 'orders',
    name: 'Orders',
    icon: <Inventory2OutlinedIcon fontSize="small" />,
    link: '/account/orders',
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: <PersonOutlineOutlinedIcon fontSize="small" />,
    link: '/account/profile',
  },
  {
    id: 'addresses',
    name: 'Addresses',
    icon: <LocationOnOutlinedIcon fontSize="small" />,
    link: '/account/addresses',
  },
  {
    id: 'delete-account',
    name: 'Delete Account',
    icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
    link: '/account/delete-account',
  },
];

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.customerAuth);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // --- 1. SYNCED ACTIVE TAB LOGIC ---
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path === '/account' || path === '/account/') {
      return null;
    }
    if (path.includes('/account/orders')) {
      return (
        accountLinks.find((item) => item.id === 'orders') || accountLinks[0]
      );
    }
    if (path.includes('/account/addresses')) {
      return (
        accountLinks.find((item) => item.id === 'addresses') || accountLinks[0]
      );
    }
    if (path.includes('/account/delete-account')) {
      return (
        accountLinks.find((item) => item.id === 'delete-account') ||
        accountLinks[0]
      );
    }
    return (
      accountLinks.find((item) => item.id === 'profile') || accountLinks[0]
    );
  }, [location.pathname]);
  const contentTab =
    activeTab ||
    accountLinks.find((item) => item.id === 'profile') ||
    accountLinks[0];

  const isAccountHome =
    location.pathname === '/account' || location.pathname === '/account/';
  const isOrderDetails =
    location.pathname.startsWith('/account/orders/') &&
    location.pathname !== '/account/orders';

  const handleLogout = () => dispatch(logout(navigate));
  const handleDeactivateAccount = async () => {
    setDeactivateError(null);
    setDeactivating(true);
    try {
      await dispatch(deactivateAccount()).unwrap();
      setDeactivateOpen(false);
      await dispatch(logout(navigate)).unwrap();
    } catch (error: unknown) {
      setDeactivateError(
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message ||
              'Failed to deactivate account',
      );
    } finally {
      setDeactivating(false);
    }
  };

  const handleMobileBack = () => {
    if (isOrderDetails) {
      navigate('/account/orders');
    } else {
      navigate('/account');
    }
  };

  const renderContent = () => {
    if (isOrderDetails) return <OrderDetails />;
    if (contentTab.id === 'orders') return <Orders />;
    if (contentTab.id === 'addresses')
      return <Address title="Saved Addresses" />;
    if (contentTab.id === 'delete-account') {
      return (
        <div className="max-w-md py-4">
          <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">
            Security
          </h2>
          <p className="text-sm text-gray-400 mb-8 font-medium">
            Manage your privacy and account status.
          </p>
          <div className="p-8 border border-red-100 bg-red-50/30 rounded-[2rem]">
            <p className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-widest">
              Deactivate Account
            </p>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              This will temporarily disable your account. Your data will stay
              safe and you can login again later.
            </p>
            {deactivateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {deactivateError}
              </Alert>
            )}
            <Button
              variant="contained"
              fullWidth
              onClick={() => setDeactivateOpen(true)}
              sx={{
                bgcolor: '#000',
                color: '#fff',
                borderRadius: '12px',
                fontWeight: 900,
                py: 1.5,
                '&:hover': { bgcolor: '#333' },
              }}
            >
              Deactivate Account
            </Button>
          </div>
        </div>
      );
    }
    return <UserDetails mode="full" />;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#2d3436] pb-10">
      <div className="max-w-[1200px] mx-auto lg:mt-12 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
          {/* --- SIDEBAR --- */}
          <aside className={`${isAccountHome ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-50 sticky top-28">
              {/* User Card */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative p-1 rounded-full border-2 border-dashed border-gray-200 mb-4">
                  <Avatar
                    sx={{
                      width: 85,
                      height: 85,
                      bgcolor: '#000',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span className="text-2xl font-black">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </Avatar>
                </div>
                <h3 className="font-black text-lg tracking-tight uppercase leading-none">
                  {user?.fullName || 'Guest User'}
                </h3>
                <div className="w-10 h-[2px] bg-gray-100 mt-4 rounded-full" />
              </div>

              {/* TAB LINKS */}
              <nav className="space-y-3">
                {accountLinks.map((item) => {
                  const isActive = activeTab?.id === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => navigate(item.link)}
                      className={`group flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 border
                        ${
                          isActive
                            ? 'bg-black border-black text-white shadow-2xl shadow-black/20 scale-[1.02]'
                            : 'bg-white border-transparent text-gray-400 hover:border-gray-100 hover:text-black hover:bg-gray-50/50'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-black'}`}
                        >
                          {item.icon}
                        </span>
                        <span
                          className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-black'}`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <ArrowForwardIosIcon
                        sx={{ fontSize: 10 }}
                        className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      />
                    </button>
                  );
                })}

                <div className="pt-8 mt-6 border-t border-gray-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl text-red-500 font-black text-[10px] tracking-widest uppercase hover:bg-red-50 transition-all"
                  >
                    <LogoutIcon sx={{ fontSize: 16 }} />
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* --- MAIN CONTENT AREA --- */}
          <main className={`${isAccountHome ? 'hidden lg:block' : 'block'}`}>
            {/* MOBILE BACK HEADER */}
            {!isAccountHome && (
              <div className="lg:hidden flex items-center p-6 bg-white border-b border-gray-100 sticky top-0 z-50">
                <button
                  onClick={handleMobileBack}
                  className="p-3 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-2xl"
                >
                  <KeyboardBackspaceIcon fontSize="small" />
                </button>
                <h2 className="flex-1 text-center font-black text-[11px] uppercase tracking-[4px] mr-10 text-gray-900">
                  {isOrderDetails ? 'Order Review' : contentTab.name}
                </h2>
              </div>
            )}

            {/* Content Glass-Card */}
            <div className="bg-white lg:rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.02)] border border-gray-50 min-h-[75vh] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-black via-gray-400 to-black/10" />
              <div className="p-6 sm:p-12 lg:p-16">{renderContent()}</div>
            </div>
          </main>
        </div>
      </div>

      <Dialog
        open={deactivateOpen}
        onClose={() => !deactivating && setDeactivateOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Deactivate Account?</DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-600">
            Your account will be disabled, but your data will not be deleted.
            You can login again later to reactivate it.
          </p>
          {deactivateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deactivateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeactivateOpen(false)}
            disabled={deactivating}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeactivateAccount}
            variant="contained"
            color="error"
            disabled={deactivating}
          >
            {deactivating ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Account;
