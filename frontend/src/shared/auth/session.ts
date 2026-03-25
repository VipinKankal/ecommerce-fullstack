export type AuthRole = 'customer' | 'seller' | 'admin';

const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';
const AUTH_NOTICE_KEY = 'auth_notice';

const canUseSessionStorage = () =>
  typeof globalThis !== 'undefined' && globalThis.sessionStorage !== undefined;

const normalizePath = (path: string) => {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
};

export const getCurrentAppPath = () => {
  if (typeof window === 'undefined') {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const setPostLoginRedirect = (path: string, notice?: string) => {
  if (!canUseSessionStorage()) return;

  globalThis.sessionStorage.setItem(
    POST_LOGIN_REDIRECT_KEY,
    normalizePath(path),
  );

  if (notice) {
    globalThis.sessionStorage.setItem(AUTH_NOTICE_KEY, notice);
  } else {
    globalThis.sessionStorage.removeItem(AUTH_NOTICE_KEY);
  }
};

export const consumePostLoginRedirect = (fallbackPath: string) => {
  if (!canUseSessionStorage()) {
    return { notice: null, redirectPath: fallbackPath };
  }

  const redirectPath =
    globalThis.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || fallbackPath;
  const notice = globalThis.sessionStorage.getItem(AUTH_NOTICE_KEY);

  globalThis.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  globalThis.sessionStorage.removeItem(AUTH_NOTICE_KEY);

  return {
    notice,
    redirectPath: normalizePath(redirectPath),
  };
};

export const getPendingAuthNotice = () => {
  if (!canUseSessionStorage()) return null;
  return globalThis.sessionStorage.getItem(AUTH_NOTICE_KEY);
};

export const clearPendingAuthNotice = () => {
  if (!canUseSessionStorage()) return;
  globalThis.sessionStorage.removeItem(AUTH_NOTICE_KEY);
};

export const getLoginPathForRole = (role: AuthRole) => {
  switch (role) {
    case 'seller':
      return '/become-seller?login=1';
    case 'admin':
      return '/admin/login';
    case 'customer':
    default:
      return '/login';
  }
};

export const getDefaultLandingPath = (role: AuthRole) => {
  switch (role) {
    case 'seller':
      return '/seller/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'customer':
    default:
      return '/';
  }
};

export const getRequiredRoleForPath = (pathname: string): AuthRole | null => {
  if (
    pathname.startsWith('/account') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout')
  ) {
    return 'customer';
  }

  if (pathname.startsWith('/seller/verify-email')) {
    return null;
  }

  if (pathname.startsWith('/seller')) {
    return 'seller';
  }

  if (pathname === '/admin/login') {
    return null;
  }

  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  return null;
};
