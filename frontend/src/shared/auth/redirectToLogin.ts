import { type NavigateFunction } from 'react-router-dom';
import {
  getCurrentAppPath,
  getLoginPathForRole,
  setPostLoginRedirect,
  type AuthRole,
} from './session';

export const redirectToLogin = (
  navigate: NavigateFunction,
  role: AuthRole,
  notice: string,
) => {
  setPostLoginRedirect(getCurrentAppPath(), notice, role);
  navigate(getLoginPathForRole(role));
};
