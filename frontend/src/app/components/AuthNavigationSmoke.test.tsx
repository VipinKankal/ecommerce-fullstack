import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SellerDrawerList from 'features/seller/Components/SellerDrawerList';
import AdminDrawerList from 'features/admin/components/AdminDrawerList';
import { logout } from 'State/features/seller/auth/thunks';
import { adminLogout } from 'State/features/admin/auth/thunks';

const mockDispatch = jest.fn();
const mockSellerLogout = logout as unknown as jest.Mock;
const mockAdminLogout = adminLogout as unknown as jest.Mock;

jest.mock('State/features/store/Store', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('app/store/Store', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('State/features/seller/auth/thunks', () => ({
  logout: jest.fn(() => ({ type: 'seller/logout' })),
}));

jest.mock('State/features/admin/auth/thunks', () => ({
  adminLogout: jest.fn(() => ({ type: 'admin/logout' })),
}));

const PathProbe = () => {
  const location = useLocation();
  return (
    <p data-testid="path">
      {location.pathname}
      {location.search}
    </p>
  );
};

const renderWithPath = (ui: React.ReactElement, initialPath: string) =>
  render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="*"
          element={
            <>
              <PathProbe />
              {ui}
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('auth navigation smoke', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockSellerLogout.mockReset();
    mockSellerLogout.mockImplementation(() => ({ type: 'seller/logout' }));
    mockAdminLogout.mockReset();
    mockAdminLogout.mockImplementation(() => ({ type: 'admin/logout' }));
  });

  it('covers seller dashboard drawer navigation and logout action', async () => {
    const toggleDrawer = jest.fn();

    renderWithPath(
      <SellerDrawerList toggleDrawer={toggleDrawer} />,
      '/seller/dashboard',
    );

    expect(screen.getByTestId('path')).toHaveTextContent('/seller/dashboard');

    await userEvent.click(screen.getByRole('link', { name: /products/i }));
    expect(screen.getByTestId('path')).toHaveTextContent('/seller/products');

    await userEvent.click(screen.getByRole('button', { name: /account/i }));
    expect(screen.getByTestId('path')).toHaveTextContent('/seller/account');

    toggleDrawer.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockSellerLogout).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'seller/logout' });
    expect(toggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('covers admin dashboard drawer navigation and logout action', async () => {
    const toggleDrawer = jest.fn();

    renderWithPath(
      <AdminDrawerList toggleDrawer={toggleDrawer} />,
      '/admin/dashboard',
    );

    expect(screen.getByTestId('path')).toHaveTextContent('/admin/dashboard');

    await userEvent.click(screen.getByRole('link', { name: /users/i }));
    expect(screen.getByTestId('path')).toHaveTextContent('/admin/users');

    await userEvent.click(screen.getByRole('button', { name: /account/i }));
    expect(screen.getByTestId('path')).toHaveTextContent('/admin/account');

    toggleDrawer.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockAdminLogout).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'admin/logout' });
    expect(toggleDrawer).toHaveBeenCalledTimes(1);
  });
});
