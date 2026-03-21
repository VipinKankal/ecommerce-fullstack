import React, { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import { teal } from '@mui/material/colors';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from 'app/store/Store';
import {
  paymentById,
  paymentStatusByOrder,
} from 'State/backend/MasterApiThunks';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};

const PaymentSuccess = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { paymentOrderId } = useParams();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('Validating payment...');
  const [orderId, setOrderId] = useState<number | string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const provider = (searchParams.get('provider') || '').toUpperCase();
      const paymentId =
        searchParams.get('razorpay_payment_id') ||
        searchParams.get('payment_id') ||
        searchParams.get('paymentId');
      const paymentLinkId =
        searchParams.get('razorpay_payment_link_id') ||
        searchParams.get('payment_link_id') ||
        searchParams.get('paymentLinkId');
      const shouldUseOrderStatus =
        provider === 'PHONEPE' ||
        Boolean(searchParams.get('merchantTransactionId')) ||
        (!paymentId && !paymentLinkId && Boolean(paymentOrderId));

      try {
        if (shouldUseOrderStatus && paymentOrderId) {
          let latestResponse: Record<string, unknown> | null = null;
          for (let attempt = 0; attempt < 4; attempt += 1) {
            latestResponse = (await dispatch(
              paymentStatusByOrder(paymentOrderId),
            ).unwrap()) as Record<string, unknown>;

            const status = String(latestResponse?.paymentStatus || '').toUpperCase();
            if (status === 'SUCCESS' || status === 'FAILED') {
              break;
            }
            if (attempt < 3) {
              await new Promise((resolve) => globalThis.setTimeout(resolve, 1500));
            }
          }

          setOrderId(
            (latestResponse?.orderId as number | string | null | undefined) ||
              null,
          );
          const normalizedStatus = String(
            latestResponse?.paymentStatus || '',
          ).toUpperCase();
          if (normalizedStatus === 'SUCCESS') {
            setSuccess(true);
            setMessage(
              String(latestResponse?.message || 'Payment successful. Your order has been confirmed.'),
            );
          } else if (normalizedStatus === 'FAILED') {
            setSuccess(false);
            setMessage(
              String(latestResponse?.message || 'Payment failed. Please retry.'),
            );
          } else {
            setSuccess(false);
            setMessage(
              String(
                latestResponse?.message ||
                  'Payment is still pending. Please wait a moment and refresh.',
              ),
            );
          }
          return;
        }

        if (!paymentId || !paymentLinkId) {
          setMessage('Payment callback is missing required parameters.');
          return;
        }

        const response = (await dispatch(
          paymentById({
            paymentId,
            paymentLinkId,
          }),
        ).unwrap()) as Record<string, unknown>;
        setOrderId((response?.orderId as number | string | null | undefined) || null);
        const normalizedStatus = String(response?.paymentStatus || '').toUpperCase();
        setSuccess(normalizedStatus === '' || normalizedStatus === 'SUCCESS');
        setMessage(
          String(response?.message || 'Payment successful. Your order has been confirmed.'),
        );
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, 'Payment verification failed.'));
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [dispatch, paymentOrderId, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border rounded-xl shadow-sm p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Payment Status</h1>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <CircularProgress />
          </div>
        ) : (
          <Alert severity={success ? 'success' : 'error'}>{message}</Alert>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ borderColor: teal[600], color: teal[700] }}
          >
            Go Home
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (orderId) {
                navigate(`/account/orders/${orderId}`, {
                  state: {
                    successMessage:
                      'Payment successful. Your order has been confirmed.',
                  },
                });
                return;
              }
              navigate('/account/orders', {
                state: {
                  successMessage:
                    'Payment successful. Your order has been confirmed.',
                },
              });
            }}
            sx={{ bgcolor: teal[600], '&:hover': { bgcolor: teal[800] } }}
          >
            View Order Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
