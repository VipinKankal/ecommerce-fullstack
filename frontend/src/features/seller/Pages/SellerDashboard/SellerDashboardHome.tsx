import React, { useEffect, useMemo } from 'react';
import { Alert, Button, Chip, CircularProgress } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'State/features/store/Store';
import { fetchSellerProfile } from 'State/features/seller/auth/thunks';
import { fetchSellerProducts } from 'State/features/seller/products/thunks';
import { fetchSellerOrders } from 'State/features/seller/orders/thunks';

const SellerDashboardHome = () => {
  const dispatch = useAppDispatch();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useAppSelector((state) => state.sellerAuth);
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useAppSelector((state) => state.sellerProduct);
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
  } = useAppSelector((state) => state.sellerOrder);

  useEffect(() => {
    dispatch(fetchSellerProfile());
    dispatch(fetchSellerProducts());
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  const dashboardStats = useMemo(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const activeOrders = orders.filter(
      (order) =>
        !['DELIVERED', 'CANCELLED'].includes(
          (order.orderStatus || '').toUpperCase(),
        ),
    ).length;
    const deliveredOrders = orders.filter(
      (order) => (order.orderStatus || '').toUpperCase() === 'DELIVERED',
    );
    const deliveredRevenue = deliveredOrders.reduce(
      (total, order) => total + Number(order.totalSellingPrice || 0),
      0,
    );

    return {
      totalProducts,
      totalOrders,
      activeOrders,
      deliveredRevenue,
    };
  }, [orders, products]);

  const readinessItems = [
    {
      label: 'Basic seller profile',
      done: Boolean(
        profile?.sellerName && profile?.mobileNumber && profile?.email,
      ),
    },
    {
      label: 'Business information',
      done: Boolean(
        profile?.businessDetails?.businessName &&
        profile?.businessDetails?.businessType &&
        (profile?.businessDetails?.panNumber || profile?.GSTIN),
      ),
    },
    {
      label: 'Pickup address',
      done: Boolean(
        profile?.pickupAddress?.address &&
        profile?.pickupAddress?.city &&
        profile?.pickupAddress?.state &&
        profile?.pickupAddress?.pinCode,
      ),
    },
    {
      label: 'Bank details',
      done: Boolean(
        profile?.bankDetails?.accountHolderName &&
        profile?.bankDetails?.bankName &&
        profile?.bankDetails?.accountNumber &&
        profile?.bankDetails?.ifscCode,
      ),
    },
    {
      label: 'KYC references',
      done: Boolean(
        profile?.kycDetails?.panCardUrl &&
        profile?.kycDetails?.aadhaarCardUrl &&
        profile?.kycDetails?.gstCertificateUrl,
      ),
    },
  ];

  const completionCount = readinessItems.filter((item) => item.done).length;
  const isLoading = profileLoading || productsLoading || ordersLoading;
  const combinedError = profileError || productsError || ordersError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
            Seller Dashboard
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            {profile?.storeDetails?.storeName ||
              profile?.sellerName ||
              'Your Seller Panel'}
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Manage catalog, operational orders, payouts, and compliance data
            from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip
            icon={<VerifiedOutlinedIcon />}
            label={profile?.emailVerified ? 'Email Verified' : 'Email Pending'}
            color={profile?.emailVerified ? 'success' : 'warning'}
            variant="filled"
          />
          <Chip
            label={profile?.accountStatus || 'PENDING_VERIFICATION'}
            color={profile?.accountStatus === 'ACTIVE' ? 'success' : 'warning'}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.28)' }}
          />
        </div>
      </div>

      {combinedError && <Alert severity="error">{combinedError}</Alert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Products',
            value: dashboardStats.totalProducts,
            icon: <Inventory2OutlinedIcon />,
            tone: 'bg-blue-50 text-blue-700 border-blue-100',
          },
          {
            title: 'All Orders',
            value: dashboardStats.totalOrders,
            icon: <ShoppingBagOutlinedIcon />,
            tone: 'bg-orange-50 text-orange-700 border-orange-100',
          },
          {
            title: 'Active Orders',
            value: dashboardStats.activeOrders,
            icon: <StorefrontOutlinedIcon />,
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          },
          {
            title: 'Delivered Revenue',
            value: `Rs ${dashboardStats.deliveredRevenue}`,
            icon: <CurrencyRupeeOutlinedIcon />,
            tone: 'bg-violet-50 text-violet-700 border-violet-100',
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-2xl bg-white/80 p-3 shadow-sm">
                {card.icon}
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                Overview
              </p>
            </div>
            <p className="text-sm font-semibold opacity-80">{card.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {isLoading && !profile && !products.length && !orders.length && (
        <div className="flex justify-center py-12">
          <CircularProgress />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr,0.95fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                High-value seller operations you will use most often.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: 'Add Product',
                desc: 'Create a new catalog listing with price and inventory.',
                to: '/seller/add-product',
              },
              {
                title: 'Manage Orders',
                desc: 'Update shipment flow and review current order pipeline.',
                to: '/seller/orders',
              },
              {
                title: 'Complete Profile',
                desc: 'Update business, bank, KYC, and support information.',
                to: '/seller/account',
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-gray-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <ArrowForwardRoundedIcon className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900">
                Account Readiness
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Production seller setup should be complete before scale-up.
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
              {completionCount}/{readinessItems.length}
            </span>
          </div>

          <div className="space-y-3">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
                {item.done ? (
                  <Chip size="small" color="success" label="Done" />
                ) : (
                  <Chip
                    size="small"
                    color="warning"
                    icon={<WarningAmberRoundedIcon />}
                    label="Pending"
                  />
                )}
              </div>
            ))}
          </div>

          <Button
            component={Link}
            to="/seller/account"
            fullWidth
            variant="contained"
            sx={{
              mt: 4,
              borderRadius: '999px',
              py: 1.3,
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#020617' },
            }}
          >
            Review Seller Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardHome;
