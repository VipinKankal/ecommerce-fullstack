import { ThemeProvider } from '@emotion/react';
import customTheme from './shared/theme/customTheme';
import './App.css';
import {
  Route,
  Routes,
  useLocation,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import Home from './features/customer/pages/Home/Home';
import Product from './features/customer/pages/Product/Product';
import ProductDetails from './features/customer/pages/ProductDetails/ProductDetails';
import ReviewCard from './features/customer/pages/Review/ReviewCard';
import {
  Checkout,
  PaymentCancel,
  PaymentSuccess,
} from './features/customer/pages/Checkout';
import Navbar from './features/customer/components/Navbar/Navbar';
import Account from './features/customer/pages/Account/Account';
import Wishlist from './features/customer/pages/Account/Wishlist';
import SellerDashboard from './features/seller/Pages/SellerDashboard/SellerDashboard';
import BecomeSeller from './features/customer/pages/BecomeSeller/BecomeSeller';
import SellerVerifyEmail from './features/customer/pages/BecomeSeller/SellerVerifyEmail';
import AdminDashboard from './features/admin/Pages/Dashboard/AdminDashboard';
import AdminAuth from './features/admin/Pages/Dashboard/AdminAuth';
import CourierLogin from './features/courier/pages/CourierLogin';
import CourierDashboard from './features/courier/pages/CourierDashboard';

import Auth from './features/customer/pages/Auth/Auth';
import { useAppDispatch, useAppSelector } from './app/store/Store';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getUserProfile } from './State/features/customer/auth/thunks';
import { fetchSellerProfile } from './State/features/seller/auth/thunks';
import { getAdminProfile } from './State/features/admin/auth/thunks';
import {
  getAuthRole,
  registerUnauthorizedHandler,
  setAuthToken,
} from './shared/api/Api';
import RouteApiDispatcher from './app/providers/RouteApiDispatcher';
import ProtectedRoute from './app/components/ProtectedRoute';
import ComplianceNoteShortcut from './app/components/ComplianceNoteShortcut';
import {
  getCurrentAppPath,
  getLoginPathForRole,
  getRequiredRoleForPath,
  setPostLoginRedirect,
  type AuthRole,
} from './shared/auth/session';
import { resetCustomerAuthState } from './State/features/customer/auth/slice';
import { resetSellerAuthState } from './State/features/seller/auth/slice';
import { resetAdminAuthState } from './State/features/admin/auth/slice';
import { resetCartState } from './State/features/customer/cart/slice';
import { resetWishlistState } from './State/features/customer/wishlist/slice';

function App() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const lastBootstrapKey = useRef<string | null>(null);
  const [isAuthBootstrapLoading, setIsAuthBootstrapLoading] = useState(false);

  const seller = useAppSelector((s) => s.sellerAuth.profile);
  const customer = useAppSelector((s) => s.customerAuth.user);
  const admin = useAppSelector((s) => s.adminAuth.user);

  const authRole = getAuthRole() as AuthRole | null;
  const requiredRole = useMemo(
    () => getRequiredRoleForPath(location.pathname),
    [location.pathname],
  );
  const bootstrapRole = authRole || requiredRole;
  const hasBootstrapProfile =
    (bootstrapRole === 'customer' && Boolean(customer)) ||
    (bootstrapRole === 'seller' && Boolean(seller)) ||
    (bootstrapRole === 'admin' && Boolean(admin));
  const bootstrapKey = bootstrapRole ? `${bootstrapRole}:${location.pathname}` : null;
  const shouldHoldProtectedRouteForBootstrap =
    Boolean(bootstrapKey) &&
    !hasBootstrapProfile &&
    (isAuthBootstrapLoading || lastBootstrapKey.current !== bootstrapKey);

  useEffect(() => {
    const resetSessionState = () => {
      dispatch(resetCustomerAuthState());
      dispatch(resetSellerAuthState());
      dispatch(resetAdminAuthState());
      dispatch(resetCartState());
      dispatch(resetWishlistState());
    };

    const getUnauthorizedMessage = (role: AuthRole, requestPath: string) => {
      if (
        requestPath.includes('/api/cart') ||
        requestPath.includes('/api/wishlist')
      ) {
        return 'Your session expired. Please log in again to continue with your cart.';
      }

      if (role === 'seller') {
        return 'Your seller session expired. Please log in again.';
      }

      if (role === 'admin') {
        return 'Your admin session expired. Please log in again.';
      }

      return 'Your session expired. Please log in again to continue.';
    };

    registerUnauthorizedHandler(({ path }) => {
      const fallbackRole = path.includes('/api/admin')
        ? 'admin'
        : path.includes('/api/seller') || path.includes('/sellers/')
          ? 'seller'
          : 'customer';
      const targetRole = requiredRole || authRole || fallbackRole;

      resetSessionState();
      setPostLoginRedirect(
        getCurrentAppPath(),
        getUnauthorizedMessage(targetRole, path),
      );
      navigate(getLoginPathForRole(targetRole), { replace: true });
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [authRole, dispatch, navigate, requiredRole]);

  useEffect(() => {
    if (!bootstrapRole || hasBootstrapProfile) {
      setIsAuthBootstrapLoading(false);
      return;
    }

    if (!bootstrapKey || lastBootstrapKey.current === bootstrapKey) {
      return;
    }
    lastBootstrapKey.current = bootstrapKey;
    setIsAuthBootstrapLoading(true);

    const bootstrapProfile = async () => {
      try {
        if (bootstrapRole === 'admin') {
          await dispatch(getAdminProfile()).unwrap();
          setAuthToken(null, 'admin');
          return;
        }

        if (bootstrapRole === 'seller') {
          await dispatch(fetchSellerProfile()).unwrap();
          setAuthToken(null, 'seller');
          return;
        }

        await dispatch(getUserProfile()).unwrap();
        setAuthToken(null, 'customer');
      } catch {
        // ProtectedRoute will handle the redirect after bootstrap finishes.
      } finally {
        setIsAuthBootstrapLoading(false);
      }
    };

    bootstrapProfile();
  }, [
    admin,
    authRole,
    bootstrapKey,
    bootstrapRole,
    customer,
    dispatch,
    hasBootstrapProfile,
    location.pathname,
    requiredRole,
    seller,
  ]);

  useEffect(() => {
    if (globalThis.sessionStorage === undefined) return;
    const path = location.pathname;
    if (!path.startsWith('/checkout')) {
      globalThis.sessionStorage.setItem('last_non_checkout_path', path);
    }
  }, [location.pathname]);

  return (
    <ThemeProvider theme={customTheme}>
      <div>
        <RouteApiDispatcher />
        <Navbar />
        <ComplianceNoteShortcut />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/products/:category" element={<Product />} />
          <Route path="/reviews/:productId" element={<ReviewCard />} />
          <Route
            path="/product-details/:categoryId/:name/:productId"
            element={<ProductDetails />}
          />
          <Route
            path="/cart"
            element={<Navigate to="/checkout/cart" replace />}
          />
          <Route
            path="/checkout"
            element={<Navigate to="/checkout/cart" replace />}
          />
          <Route
            path="/checkout/*"
            element={
              <ProtectedRoute
                requiredRole="customer"
                isAllowed={Boolean(customer)}
                isLoading={
                  shouldHoldProtectedRouteForBootstrap &&
                  requiredRole === 'customer'
                }
              >
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success/:paymentOrderId"
            element={<PaymentSuccess />}
          />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/become-seller" element={<BecomeSeller />} />
          <Route path="/seller/verify-email" element={<SellerVerifyEmail />} />
          <Route path="/courier/login" element={<CourierLogin />} />
          <Route path="/courier/dashboard" element={<CourierDashboard />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route
            path="/account/*"
            element={
              <ProtectedRoute
                requiredRole="customer"
                isAllowed={Boolean(customer)}
                isLoading={
                  shouldHoldProtectedRouteForBootstrap &&
                  requiredRole === 'customer'
                }
              >
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute
                requiredRole="customer"
                isAllowed={Boolean(customer)}
                isLoading={shouldHoldProtectedRouteForBootstrap && requiredRole === 'customer'}
              >
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/*"
            element={
              <ProtectedRoute
                requiredRole="seller"
                isAllowed={Boolean(seller)}
                isLoading={shouldHoldProtectedRouteForBootstrap && requiredRole === 'seller'}
              >
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute
                requiredRole="admin"
                isAllowed={Boolean(admin)}
                isLoading={shouldHoldProtectedRouteForBootstrap && requiredRole === 'admin'}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
