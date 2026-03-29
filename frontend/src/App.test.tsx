/* eslint-disable react/display-name */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { getUserProfile } from './State/features/customer/auth/thunks';
import { fetchSellerProfile } from './State/features/seller/auth/thunks';
import { getAdminProfile } from './State/features/admin/auth/thunks';
import { getAuthRole } from './shared/api/Api';
import { useAppDispatch } from './app/store/Store';

jest.mock('./features/customer/pages/Home/Home', () => () => <div>home</div>);
jest.mock('./features/customer/pages/Product/Product', () => () => (
  <div>product</div>
));
jest.mock(
  './features/customer/pages/ProductDetails/ProductDetails',
  () => () => <div>product details</div>,
);
jest.mock('./features/customer/pages/Review/ReviewCard', () => () => (
  <div>review</div>
));
jest.mock('./features/customer/pages/Checkout', () => ({
  Checkout: () => <div>checkout</div>,
  PaymentCancel: () => <div>payment cancel</div>,
  PaymentSuccess: () => <div>payment success</div>,
}));
jest.mock('./features/customer/components/Navbar/Navbar', () => () => (
  <div>navbar</div>
));
jest.mock('./features/customer/pages/Account/Account', () => () => (
  <div>account</div>
));
jest.mock('./features/customer/pages/Account/Wishlist', () => () => (
  <div>wishlist</div>
));
jest.mock('./features/seller/Pages/SellerDashboard/SellerDashboard', () => () => (
  <div>seller dashboard</div>
));
jest.mock('./features/customer/pages/BecomeSeller/BecomeSeller', () => () => (
  <div>become seller</div>
));
jest.mock(
  './features/customer/pages/BecomeSeller/SellerVerifyEmail',
  () => () => <div>seller verify email</div>,
);
jest.mock('./features/admin/Pages/Dashboard/AdminDashboard', () => () => (
  <div>admin dashboard</div>
));
jest.mock('./features/admin/Pages/Dashboard/AdminAuth', () => () => (
  <div>admin auth</div>
));
jest.mock('./features/courier/pages/CourierLogin', () => () => (
  <div>courier login</div>
));
jest.mock('./features/courier/pages/CourierDashboard', () => () => (
  <div>courier dashboard</div>
));
jest.mock('./features/customer/pages/Auth/Auth', () => () => (
  <div>auth page</div>
));
jest.mock('./app/providers/RouteApiDispatcher', () => () => null);
jest.mock('./app/components/ComplianceNoteShortcut', () => () => null);

jest.mock('./State/features/customer/auth/thunks', () => ({
  getUserProfile: jest.fn(() => ({ type: 'mock/getUserProfile' })),
}));
jest.mock('./State/features/seller/auth/thunks', () => ({
  fetchSellerProfile: jest.fn(() => ({ type: 'mock/fetchSellerProfile' })),
}));
jest.mock('./State/features/admin/auth/thunks', () => ({
  getAdminProfile: jest.fn(() => ({ type: 'mock/getAdminProfile' })),
}));
jest.mock('./shared/api/Api', () => ({
  getAuthRole: jest.fn(),
  registerUnauthorizedHandler: jest.fn(),
  setAuthToken: jest.fn(),
}));

const dispatchMock = jest.fn(() => ({
  unwrap: () => Promise.resolve({}),
}));

const baseState = {
  sellerAuth: { profile: null },
  customerAuth: { user: null },
  adminAuth: { user: null },
};

jest.mock('./app/store/Store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn((selector: (state: typeof baseState) => unknown) =>
    selector(baseState),
  ),
}));

const mockedGetAuthRole = getAuthRole as jest.MockedFunction<
  typeof getAuthRole
>;
const mockedGetUserProfile = getUserProfile as jest.MockedFunction<
  typeof getUserProfile
>;
const mockedFetchSellerProfile = fetchSellerProfile as jest.MockedFunction<
  typeof fetchSellerProfile
>;
const mockedGetAdminProfile = getAdminProfile as jest.MockedFunction<
  typeof getAdminProfile
>;
const mockedUseAppDispatch = useAppDispatch as jest.MockedFunction<
  typeof useAppDispatch
>;

describe('App refresh bootstrap', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    dispatchMock.mockClear();
    baseState.customerAuth.user = null;
    baseState.sellerAuth.profile = null;
    baseState.adminAuth.user = null;
    mockedGetAuthRole.mockReset();
    mockedGetUserProfile.mockClear();
    mockedFetchSellerProfile.mockClear();
    mockedGetAdminProfile.mockClear();
    mockedUseAppDispatch.mockReturnValue(
      dispatchMock as unknown as ReturnType<typeof useAppDispatch>,
    );
  });

  it('bootstraps customer profile on protected refresh without sessionStorage auth_role', async () => {
    mockedGetAuthRole.mockReturnValue(null);

    render(
      <MemoryRouter
        initialEntries={['/checkout/cart']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </MemoryRouter>,
    );

    expect(window.sessionStorage.getItem('auth_role')).toBeNull();
    expect(screen.getByText(/restoring your session/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);
    });

    expect(mockedFetchSellerProfile).not.toHaveBeenCalled();
    expect(mockedGetAdminProfile).not.toHaveBeenCalled();
  });

  it('bootstraps seller profile on protected refresh without sessionStorage auth_role', async () => {
    mockedGetAuthRole.mockReturnValue(null);

    render(
      <MemoryRouter
        initialEntries={['/seller/products']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </MemoryRouter>,
    );

    expect(window.sessionStorage.getItem('auth_role')).toBeNull();
    expect(screen.getByText(/checking seller session/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedFetchSellerProfile).toHaveBeenCalledTimes(1);
    });

    expect(mockedGetUserProfile).not.toHaveBeenCalled();
    expect(mockedGetAdminProfile).not.toHaveBeenCalled();
  });

});
