export type ErrorRole = 'customer' | 'seller' | 'admin' | 'courier';
export type ErrorLocale = 'en';

export type StandardErrorCode =
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'BUSINESS_ERROR'
  | 'SYSTEM_ERROR'
  | 'NETWORK_ERROR';

type MessageEntry = string | Partial<Record<ErrorRole, string>>;

const reasonMessages: Record<string, MessageEntry> = {
  SESSION_EXPIRED: {
    admin: 'Your admin session expired. Please log in again.',
    seller: 'Your seller session expired. Please log in again.',
    courier: 'Your courier session expired. Please log in again.',
    customer: 'Your session expired. Please log in again to continue.',
  },
  INVALID_CREDENTIALS: {
    admin: 'Invalid admin credentials. Please try again.',
    seller: 'Invalid seller credentials. Please try again.',
    courier: 'Invalid courier credentials. Please try again.',
    customer: 'Invalid credentials. Please try again.',
  },
  NO_INTERNET: 'No internet connection. Please check your network and try again.',
  COUPON_NOT_FOUND: 'This coupon could not be found.',
  COUPON_INACTIVE: 'This coupon is no longer active.',
  COUPON_EXPIRED: 'This coupon has expired.',
  COUPON_CODE_REQUIRED: 'Please enter a coupon code.',
  MIN_ORDER_NOT_MET: 'Your bag does not meet this coupon minimum order.',
  PER_USER_LIMIT_REACHED:
    'You have already used this coupon the maximum number of times.',
  USAGE_LIMIT_REACHED: 'This coupon has reached its usage limit.',
  FIRST_ORDER_ONLY: 'This coupon is only valid on your first order.',
  USER_NOT_ELIGIBLE: 'This coupon is not available for your account.',
  USER_INACTIVE: 'Only active users can use this coupon.',
  CART_EMPTY: 'Add items to your bag before applying a coupon.',
  NOT_APPLICABLE_TO_CART: 'This coupon does not apply to the items in your bag.',
  COUPON_NOT_APPLIED: 'No coupon is currently applied to your bag.',
};

const errorCodeMessages: Record<StandardErrorCode, MessageEntry> = {
  AUTH_ERROR: {
    admin: 'Your admin access requires fresh login.',
    seller: 'Your seller access requires fresh login.',
    courier: 'Your courier access requires fresh login.',
    customer: 'Please log in to continue.',
  },
  VALIDATION_ERROR: 'Please review your input and try again.',
  BUSINESS_ERROR: 'Unable to complete this action right now.',
  SYSTEM_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network issue detected. Please check internet and retry.',
};

const readMessage = (entry: MessageEntry | undefined, role: ErrorRole | null) => {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  if (!role) return null;
  return entry[role] || null;
};

type ResolveErrorMessageParams = {
  errorCode?: StandardErrorCode;
  reasonCode?: string;
  role?: ErrorRole | null;
  locale?: ErrorLocale;
  fallback: string;
};

export const resolveErrorMessage = ({
  errorCode,
  reasonCode,
  role,
  locale = 'en',
  fallback,
}: ResolveErrorMessageParams) => {
  void locale;
  const reasonMessage = readMessage(reasonMessages[reasonCode || ''], role || null);
  if (reasonMessage) return reasonMessage;

  if (errorCode) {
    const errorCodeMessage = readMessage(errorCodeMessages[errorCode], role || null);
    if (errorCodeMessage) return errorCodeMessage;
  }

  return fallback;
};
