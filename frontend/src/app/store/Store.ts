import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import sellerProductReducer from '../../State/features/seller/products/slice';
import sellerOrderReducer from '../../State/features/seller/orders/slice';
import productSlice from '../../State/features/customer/catalog/slice';
import authCustomerReducer from '../../State/features/customer/auth/slice';
import authReducer from '../../State/features/seller/auth/slice';
import cartSlice from '../../State/features/customer/cart/slice';
import masterApiReducer from '../../State/features/backend/masterApi/slice';
import wishlistReducer from '../../State/features/customer/wishlist/slice';
import adminAuthReducer from '../../State/features/admin/auth/slice';
import returnExchangeReducer from '../../State/features/customer/returns/slice';
import exchangeReducer from '../../State/features/customer/exchange/slice';

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
