import { getApiError, getDisplayErrorMessage } from './apiError';

describe('api error normalizer', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('extracts code, reasonCode, traceId and retryable flags', () => {
    const error = {
      response: {
        status: 422,
        data: {
          message: 'Coupon expired',
          error: {
            code: 'VALIDATION_ERROR',
            details: {
              reasonCode: 'COUPON_EXPIRED',
              traceId: 'trace-123',
              retryable: false,
            },
          },
        },
      },
    };

    expect(getApiError(error, 'Fallback')).toEqual({
      message: 'Coupon expired',
      code: 'VALIDATION_ERROR',
      errorCode: 'VALIDATION_ERROR',
      reasonCode: 'COUPON_EXPIRED',
      status: 422,
      details: {
        reasonCode: 'COUPON_EXPIRED',
        traceId: 'trace-123',
        retryable: false,
      },
      traceId: 'trace-123',
      retryable: false,
    });
  });

  it('maps coupon reasonCode to user-friendly message', () => {
    const error = {
      response: {
        status: 422,
        data: {
          message: 'Coupon expired',
          error: {
            code: 'VALIDATION_ERROR',
            details: { reasonCode: 'COUPON_EXPIRED' },
          },
        },
      },
    };

    expect(getDisplayErrorMessage(error, 'Fallback')).toBe(
      'This coupon has expired.',
    );
  });

  it('maps network failures to NETWORK_ERROR / NO_INTERNET', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
      config: {},
    };

    expect(getApiError(error, 'Fallback')).toEqual({
      message: 'Network Error',
      code: 'ERR_NETWORK',
      errorCode: 'NETWORK_ERROR',
      reasonCode: 'NO_INTERNET',
      retryable: true,
    });

    expect(getDisplayErrorMessage(error, 'Fallback')).toBe(
      'No internet connection. Please check your network and try again.',
    );
  });

  it('maps AUTH_REQUIRED by role', () => {
    const error = {
      response: {
        status: 401,
        data: {
          message: 'Authentication required',
          error: { code: 'AUTH_REQUIRED', details: {} },
        },
      },
    };

    expect(getDisplayErrorMessage(error, 'Fallback', { role: 'admin' })).toBe(
      'Your admin session expired. Please log in again.',
    );
    expect(getDisplayErrorMessage(error, 'Fallback', { role: 'seller' })).toBe(
      'Your seller session expired. Please log in again.',
    );
  });

  it('infers role from current path when role is not provided', () => {
    window.history.replaceState({}, '', '/courier/login');
    const error = {
      response: {
        status: 401,
        data: {
          message: 'Authentication required',
          error: { code: 'AUTH_REQUIRED', details: {} },
        },
      },
    };

    expect(getDisplayErrorMessage(error, 'Fallback')).toBe(
      'Your courier session expired. Please log in again.',
    );
  });

  it('uses English-only registry messages', () => {
    const error = {
      response: {
        status: 401,
        data: {
          message: 'Authentication required',
          error: { code: 'AUTH_REQUIRED', details: {} },
        },
      },
    };

    expect(
      getDisplayErrorMessage(error, 'Fallback', { role: 'customer', locale: 'en' }),
    ).toBe(
      'Your session expired. Please log in again to continue.',
    );
  });

  it('shows generic system copy for unmapped server errors', () => {
    const error = {
      response: {
        status: 500,
        data: {
          message: 'Custom backend message',
          error: { code: 'UNKNOWN_CODE', details: {} },
        },
      },
    };

    expect(getDisplayErrorMessage(error, 'Fallback')).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
