import {
  consumePostLoginRedirect,
  getDefaultLandingPath,
  getLoginPathForRole,
  getPendingAuthNotice,
  getRequiredRoleForPath,
  setPostLoginRedirect,
} from './session';

describe('auth session helpers', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('stores and consumes redirect path plus notice', () => {
    setPostLoginRedirect('/checkout/cart', 'Please log in');

    expect(getPendingAuthNotice()).toBe('Please log in');

    const result = consumePostLoginRedirect('/');

    expect(result).toEqual({
      notice: 'Please log in',
      redirectPath: '/checkout/cart',
    });
    expect(getPendingAuthNotice()).toBeNull();
  });

  it('scopes notices and redirects to the matching login role', () => {
    setPostLoginRedirect(
      '/seller/dashboard',
      'Your seller session expired. Please log in again.',
      'seller',
    );

    window.history.replaceState({}, '', '/admin/login');
    expect(getPendingAuthNotice()).toBeNull();
    expect(consumePostLoginRedirect('/admin/dashboard')).toEqual({
      notice: null,
      redirectPath: '/admin/dashboard',
    });

    window.history.replaceState({}, '', '/become-seller?login=1');
    expect(getPendingAuthNotice()).toBe(
      'Your seller session expired. Please log in again.',
    );
    expect(consumePostLoginRedirect('/seller/dashboard')).toEqual({
      notice: 'Your seller session expired. Please log in again.',
      redirectPath: '/seller/dashboard',
    });
  });

  it('returns role-specific login and landing paths', () => {
    expect(getLoginPathForRole('customer')).toBe('/login');
    expect(getLoginPathForRole('seller')).toBe('/become-seller?login=1');
    expect(getLoginPathForRole('admin')).toBe('/admin/login');

    expect(getDefaultLandingPath('customer')).toBe('/');
    expect(getDefaultLandingPath('seller')).toBe('/seller/dashboard');
    expect(getDefaultLandingPath('admin')).toBe('/admin/dashboard');
  });

  it('maps protected paths to the correct required role', () => {
    expect(getRequiredRoleForPath('/checkout/cart')).toBe('customer');
    expect(getRequiredRoleForPath('/account/orders')).toBe('customer');
    expect(getRequiredRoleForPath('/seller/products')).toBe('seller');
    expect(getRequiredRoleForPath('/seller/verify-email')).toBeNull();
    expect(getRequiredRoleForPath('/admin/dashboard')).toBe('admin');
    expect(getRequiredRoleForPath('/admin/login')).toBeNull();
    expect(getRequiredRoleForPath('/')).toBeNull();
  });
});
