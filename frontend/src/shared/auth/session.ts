export type AuthRole = 'customer' | 'seller' | 'admin' | 'courier';

const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';
const POST_LOGIN_REDIRECT_ROLE_KEY = 'post_login_redirect_role';
const AUTH_NOTICE_KEY = 'auth_notice';
const AUTH_NOTICE_ROLE_KEY = 'auth_notice_role';

const canUseSessionStorage = () =>
  typeof globalThis !== 'undefined' && globalThis.sessionStorage !== undefined;

const inferLoginRoleFromPath = (): AuthRole | null => {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  if (pathname === '/admin/login') return 'admin';
  if (pathname === '/courier/login') return 'courier';
  if (pathname === '/become-seller') return 'seller';
  if (pathname === '/login') return 'customer';
  return null;
};

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

export const setPostLoginRedirect = (
  path: string,
  notice?: string,
  role?: AuthRole,
) => {
  if (!canUseSessionStorage()) return;

  globalThis.sessionStorage.setItem(
    POST_LOGIN_REDIRECT_KEY,
    normalizePath(path),
  );
  if (role) {
    globalThis.sessionStorage.setItem(POST_LOGIN_REDIRECT_ROLE_KEY, role);
  } else {
    globalThis.sessionStorage.removeItem(POST_LOGIN_REDIRECT_ROLE_KEY);
  }

  if (notice) {
    globalThis.sessionStorage.setItem(AUTH_NOTICE_KEY, notice);
    if (role) {
      globalThis.sessionStorage.setItem(AUTH_NOTICE_ROLE_KEY, role);
    } else {
      globalThis.sessionStorage.removeItem(AUTH_NOTICE_ROLE_KEY);
    }
  } else {
    globalThis.sessionStorage.removeItem(AUTH_NOTICE_KEY);
    globalThis.sessionStorage.removeItem(AUTH_NOTICE_ROLE_KEY);
  }
};

export const consumePostLoginRedirect = (
  fallbackPath: string,
  role?: AuthRole,
) => {
  if (!canUseSessionStorage()) {
    return { notice: null, redirectPath: fallbackPath };
  }

  const expectedRole = role || inferLoginRoleFromPath();

  if (expectedRole) {
    const redirectRole = globalThis.sessionStorage.getItem(
      POST_LOGIN_REDIRECT_ROLE_KEY,
    );
    const notice = globalThis.sessionStorage.getItem(AUTH_NOTICE_KEY);
    const noticeRole = globalThis.sessionStorage.getItem(AUTH_NOTICE_ROLE_KEY);
    const roleMismatch =
      redirectRole !== expectedRole ||
      (notice !== null && noticeRole !== expectedRole);

    if (roleMismatch) {
      return { notice: null, redirectPath: fallbackPath };
    }
  }

  const redirectPath =
    globalThis.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || fallbackPath;
  const notice = globalThis.sessionStorage.getItem(AUTH_NOTICE_KEY);

  globalThis.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  globalThis.sessionStorage.removeItem(POST_LOGIN_REDIRECT_ROLE_KEY);
  globalThis.sessionStorage.removeItem(AUTH_NOTICE_KEY);
  globalThis.sessionStorage.removeItem(AUTH_NOTICE_ROLE_KEY);

  return {
    notice,
    redirectPath: normalizePath(redirectPath),
  };
};

export const getPendingAuthNotice = (role?: AuthRole) => {
  if (!canUseSessionStorage()) return null;

  const notice = globalThis.sessionStorage.getItem(AUTH_NOTICE_KEY);
  if (!notice) return null;
  const expectedRole = role || inferLoginRoleFromPath();
  if (!expectedRole) return notice;

  const noticeRole = globalThis.sessionStorage.getItem(AUTH_NOTICE_ROLE_KEY);
  if (noticeRole !== expectedRole) return null;

  return notice;
};

export const clearPendingAuthNotice = (role?: AuthRole) => {
  if (!canUseSessionStorage()) return;

  if (role) {
    const noticeRole = globalThis.sessionStorage.getItem(AUTH_NOTICE_ROLE_KEY);
    if (noticeRole !== role) return;
  }

  globalThis.sessionStorage.removeItem(AUTH_NOTICE_KEY);
  globalThis.sessionStorage.removeItem(AUTH_NOTICE_ROLE_KEY);
};

export const getLoginPathForRole = (role: AuthRole) => {
  switch (role) {
    case 'seller':
      return '/become-seller?login=1';
    case 'admin':
      return '/admin/login';
    case 'courier':
      return '/courier/login';
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
    case 'courier':
      return '/courier/dashboard';
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
