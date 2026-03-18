import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import sellerProductReducer from "../../State/Seller/SellerProductSlice";
import sellerOrderReducer from "../../State/Seller/SellerOrderSlice";
import productSlice from "../../State/Customer/ProductSlice";
import authCustomerReducer from "../../State/CustomerLogin/CustomerAuthSlice";
import authReducer from "../../State/Seller/SellerAuthSlice";
import cartSlice from "../../State/Cart/cartSlice";
import masterApiReducer from "../../State/Backend/MasterApiSlice";
import wishlistReducer from "../../State/Wishlist/wishlistSlice";
import adminAuthReducer from "../../State/AdminAuthSlice";
import returnExchangeReducer from "../../State/Returns/returnExchangeSlice";
import exchangeReducer from "../../State/Exchange/exchangeSlice";

const rootReducer = combineReducers({
  sellerAuth: authReducer,
  customerAuth: authCustomerReducer,
  sellerProduct: sellerProductReducer,
  sellerOrder: sellerOrderReducer,
  product: productSlice,
  cart: cartSlice,
  masterApi: masterApiReducer,
  wishlist: wishlistReducer,
  adminAuth: adminAuthReducer,
  returnExchange: returnExchangeReducer,
  exchange: exchangeReducer,
});

const Store = configureStore({
  reducer: rootReducer,
});

export default Store;

export type AppDispatch = typeof Store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
