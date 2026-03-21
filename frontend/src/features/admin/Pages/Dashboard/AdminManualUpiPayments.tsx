import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  manualUpiPaymentsList,
  verifyManualUpiPayment,
} from 'State/backend/MasterApiThunks';

type ManualUpiPaymentRow = {
  id: number;
  orderId?: number | string;
  paymentOrderId?: number | string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  transactionId?: string;
  paymentApp?: string;
  submittedAt?: string;
  amount?: number;
  status?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | string;
  paymentScreenshot?: string;
};

const getStatusChipColor = (
  status?: ManualUpiPaymentRow['status'],
): 'success' | 'error' | 'warning' => {
  if (status === 'VERIFIED') {
    return 'success';
  }
  if (status === 'REJECTED') {
    return 'error';
  }
  return 'warning';
};

const AdminManualUpiPayments = () => {
  const dispatch = useAppDispatch();
  const { loading, error, lastAction, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const [selected, setSelected] = useState<ManualUpiPaymentRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const rows = useMemo<ManualUpiPaymentRow[]>(
    () =>
      Array.isArray(responses.manualUpiPaymentsList)
        ? (responses.manualUpiPaymentsList as ManualUpiPaymentRow[])
        : [],
    [responses.manualUpiPaymentsList],
  );

  useEffect(() => {
    dispatch(manualUpiPaymentsList());
  }, [dispatch]);

  const pendingCount = useMemo(
    () => rows.filter((row) => row.status === 'PENDING_VERIFICATION').length,
    [rows],
  );

  const shouldShowError =
    Boolean(error) &&
    (lastAction === 'manualUpiPaymentsList' ||
      lastAction === 'verifyManualUpiPayment');

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selected?.id) return;
    await dispatch(
      verifyManualUpiPayment({
        manualPaymentId: selected.id,
        status,
        rejectionReason:
          status === 'REJECTED' ? rejectionReason.trim() : undefined,
      }),
    ).unwrap();
    setSelected(null);
    setRejectionReason('');
    dispatch(manualUpiPaymentsList());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Manual UPI Verification
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review customer-submitted UPI transactions and verify or reject
            them.
          </Typography>
        </div>
        <Chip color="warning" label={`${pendingCount} pending`} />
      </div>

      {shouldShowError && <Alert severity="error">{error}</Alert>}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <Table sx={{ minWidth: 960 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Transaction</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No manual UPI submissions found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={String(row.id)} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      #{row.orderId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Payment Order #{row.paymentOrderId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.customerName || 'N/A'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {row.customerEmail || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.customerPhone || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.transactionId || 'Pending submission'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {row.paymentApp || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleString()
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>Rs {row.amount || 0}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={getStatusChipColor(row.status)}
                      label={row.status}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" onClick={() => setSelected(row)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Review Manual UPI Payment</DialogTitle>
        <DialogContent className="space-y-4">
          {selected && (
            <div className="space-y-3 pt-2">
              <div>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Order #{selected.orderId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selected.customerName} | {selected.customerEmail}
                </Typography>
              </div>
              <div>
                <Typography variant="body2">
                  Transaction ID: {selected.transactionId || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Payment App: {selected.paymentApp || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Amount: Rs {selected.amount || 0}
                </Typography>
              </div>
              {selected.paymentScreenshot && (
                <a
                  href={selected.paymentScreenshot}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-teal-700 underline"
                >
                  View uploaded screenshot
                </a>
              )}
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Required only if you reject the submission"
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
          <Button
            color="error"
            variant="outlined"
            onClick={() => handleVerify('REJECTED')}
          >
            Reject
          </Button>
          <Button variant="contained" onClick={() => handleVerify('VERIFIED')}>
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminManualUpiPayments;
