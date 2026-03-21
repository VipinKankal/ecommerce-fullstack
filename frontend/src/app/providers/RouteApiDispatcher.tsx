import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../State/features/store/Store';
import { homePing } from '../../State/backend/MasterApiThunks';

const RouteApiDispatcher = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const lastDispatchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const pathname = location.pathname;
    const search = location.search;
    const dispatchKey = `${pathname}${search}`;

    // Prevent duplicate calls from React StrictMode double-invocation.
    if (lastDispatchKeyRef.current === dispatchKey) {
      return;
    }
    lastDispatchKeyRef.current = dispatchKey;

    // These pages already dispatch their own APIs inside page components.
    if (
      pathname.startsWith('/products/') ||
      pathname.startsWith('/product-details/') ||
      pathname.startsWith('/reviews/') ||
      pathname.startsWith('/cart') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/seller/') ||
      pathname.startsWith('/courier/')
    ) {
      return;
    }

    if (pathname === '/') {
      dispatch(homePing());
      return;
    }
  }, [dispatch, location.pathname, location.search]);

  return null;
};

export default RouteApiDispatcher;
