import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('renders a bootstrap loading state while auth is being restored', () => {
    window.history.replaceState({}, '', '/checkout/cart');

    render(
      <MemoryRouter initialEntries={['/checkout/cart']} future={routerFuture}>
        <ProtectedRoute requiredRole="customer" isAllowed={false} isLoading>
          <div>private content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText(/restoring your session/i)).toBeInTheDocument();
    expect(screen.queryByText(/private content/i)).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users and preserves the return path', () => {
    window.history.replaceState({}, '', '/checkout/cart');

    render(
      <MemoryRouter initialEntries={['/checkout/cart']} future={routerFuture}>
        <Routes>
          <Route
            path="/checkout/cart"
            element={
              <ProtectedRoute
                requiredRole="customer"
                isAllowed={false}
                isLoading={false}
              >
                <div>private content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem('post_login_redirect')).toBe(
      '/checkout/cart',
    );
    expect(window.sessionStorage.getItem('auth_notice')).toBe(
      'Please log in to continue with your session.',
    );
  });

  it('renders children when the route is allowed', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <ProtectedRoute requiredRole="customer" isAllowed isLoading={false}>
          <div>private content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText(/private content/i)).toBeInTheDocument();
  });
});
