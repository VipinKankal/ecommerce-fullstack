import { CircularProgress } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  getCurrentAppPath,
  getLoginPathForRole,
  type AuthRole,
  setPostLoginRedirect,
} from 'shared/auth/session';

type ProtectedRouteProps = {
  children: ReactNode;
  isAllowed: boolean;
  isLoading: boolean;
  requiredRole: AuthRole;
};

const loadingCopyByRole: Record<AuthRole, string> = {
  admin: 'Checking admin session...',
  customer: 'Restoring your session...',
  seller: 'Checking seller session...',
};

const ProtectedRoute = ({
  children,
  isAllowed,
  isLoading,
  requiredRole,
}: ProtectedRouteProps) => {
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <CircularProgress />
        <p className="text-sm text-gray-500">
          {loadingCopyByRole[requiredRole]}
        </p>
      </div>
    );
  }

  if (!isAllowed) {
    setPostLoginRedirect(
      getCurrentAppPath(),
      'Please log in to continue with your session.',
    );

    return (
      <Navigate
        to={getLoginPathForRole(requiredRole)}
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
