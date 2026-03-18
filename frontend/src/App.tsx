import { ThemeProvider } from "@emotion/react";
import customTheme from "./shared/theme/customTheme";
import "./App.css";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";

import Home from "./modules/customer/pages/Home/Home";
import Product from "./modules/customer/pages/Product/Product";
import ProductDetails from "./modules/customer/pages/ProductDetails/ProductDetails";
import ReviewCard from "./modules/customer/pages/Review/ReviewCard";
import { Checkout, PaymentCancel, PaymentSuccess } from "./modules/customer/pages/Checkout";
import Navbar from "./modules/customer/components/Navbar/Navbar";
import Account from "./modules/customer/pages/Account/Account";
import Wishlist from "./modules/customer/pages/Account/Wishlist";
import SellerDashboard from "./modules/seller/Pages/SellerDashboard/SellerDashboard";
import BecomeSeller from "./modules/customer/pages/BecomeSeller/BecomeSeller";
import SellerVerifyEmail from "./modules/customer/pages/BecomeSeller/SellerVerifyEmail";
import AdminDashboard from "./modules/admin/Pages/Dashboard/AdminDashboard";
import AdminAuth from "./modules/admin/Pages/Dashboard/AdminAuth";
import CourierLogin from "./modules/courier/pages/CourierLogin";
import CourierDashboard from "./modules/courier/pages/CourierDashboard";

import Auth from "./modules/customer/pages/Auth/Auth";
import { useAppDispatch, useAppSelector } from "./app/store/Store";
import { useEffect, useRef } from "react";
import { getUserProfile } from "./State/CustomerLogin/CustomerLogin";
import { fetchSellerProfile } from "./State/Seller/SellerAuthThunks";
import { getAdminProfile } from "./State/AdminAuthThunks";
import { getAuthRole } from "./shared/api/Api";
import RouteApiDispatcher from "./app/providers/RouteApiDispatcher";

function App() {
  const dispatch = useAppDispatch();
  const didBootstrap = useRef(false);
  const location = useLocation();

  const seller = useAppSelector((s) => s.sellerAuth.profile);
  const customer = useAppSelector((s) => s.customerAuth.user);
  const admin = useAppSelector((s) => s.adminAuth.user);

  useEffect(() => {
    const runtimeToken =
      typeof window !== "undefined" ? sessionStorage.getItem("auth_jwt") : null;
    const authRole = getAuthRole();
    const shouldBootstrap = Boolean(runtimeToken || authRole);

    if (!shouldBootstrap) return;
    if (didBootstrap.current || seller || customer || admin) return;
    didBootstrap.current = true;

    const bootstrapProfile = async () => {
      if (authRole === "admin") {
        try {
          await dispatch(getAdminProfile()).unwrap();
        } catch {
          // No active admin session.
        }
        return;
      }

      if (authRole === "seller") {
        try {
          await dispatch(fetchSellerProfile(runtimeToken || undefined)).unwrap();
        } catch {
          // No active authenticated session.
        }
        return;
      }

      if (authRole === "customer") {
        try {
          await dispatch(getUserProfile(runtimeToken || undefined)).unwrap();
        } catch {
          // No active authenticated session.
        }
        return;
      }

      if (location.pathname.startsWith("/seller") || location.pathname.startsWith("/admin")) {
        if (location.pathname.startsWith("/admin")) {
          try {
            await dispatch(getAdminProfile()).unwrap();
          } catch {
            // No active admin session.
          }
        } else {
          try {
            await dispatch(fetchSellerProfile(runtimeToken || undefined)).unwrap();
          } catch {
            // No active seller session on seller route.
          }
        }
        return;
      }

      if (
        location.pathname.startsWith("/account") ||
        location.pathname.startsWith("/wishlist") ||
        location.pathname.startsWith("/cart") ||
        location.pathname.startsWith("/checkout")
      ) {
        try {
          await dispatch(getUserProfile(runtimeToken || undefined)).unwrap();
        } catch {
          // No active customer session on account/cart/checkout route.
        }
      }
    };

    bootstrapProfile();
  }, [admin, customer, dispatch, seller, location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = location.pathname;
    if (!path.startsWith("/checkout")) {
      sessionStorage.setItem("last_non_checkout_path", path);
    }
  }, [location.pathname]);

  return (
    <ThemeProvider theme={customTheme}>
      <div>
        <RouteApiDispatcher />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/products/:category" element={<Product />} />
          <Route path="/reviews/:productId" element={<ReviewCard />} />
          <Route
            path="/product-details/:categoryId/:name/:productId"
            element={<ProductDetails />}
          />
          <Route path="/cart" element={<Navigate to="/checkout/cart" replace />} />
          <Route path="/checkout" element={<Navigate to="/checkout/cart" replace />} />
          <Route path="/checkout/*" element={<Checkout />} />
          <Route path="/payment-success/:paymentOrderId" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/become-seller" element={<BecomeSeller />} />
          <Route path="/seller/verify-email" element={<SellerVerifyEmail />} />
          <Route path="/courier/login" element={<CourierLogin />} />
          <Route path="/courier/dashboard" element={<CourierDashboard />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/account/*" element={<Account />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/seller/*" element={<SellerDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;



