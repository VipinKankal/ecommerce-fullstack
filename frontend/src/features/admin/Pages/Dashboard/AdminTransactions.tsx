import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { allTransactions } from 'State/backend/MasterApiThunks';

type AdminTransactionRow = {
  id: number | string;
  date?: string;
  customerName?: string;
  customerEmail?: string;
  sellerName?: string;
  amount?: number | string;
  orderStatus?: string;
  paymentStatus?: string;
};

type AdminTransactionView = {
  id: number | string;
  date?: string;
  customerName: string;
  customerEmail: string;
  sellerName: string;
  amount: number;
  orderStatus: string;
  paymentStatus: string;
};

const AdminTransactions = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const rawTransactions = responses.allTransactions;

  useEffect(() => {
    dispatch(allTransactions());
  }, [dispatch]);

  const transactions = useMemo(() => {
    if (!Array.isArray(rawTransactions)) return [];
    return (rawTransactions as AdminTransactionRow[]).map(
      (row): AdminTransactionView => ({
        id: row.id,
        date: row.date,
        customerName: row.customerName || 'N/A',
        customerEmail: row.customerEmail || 'N/A',
        sellerName: row.sellerName || 'N/A',
        amount: Number(row.amount || 0),
        orderStatus: row.orderStatus || 'N/A',
        paymentStatus: row.paymentStatus || 'N/A',
      }),
    );
  }, [rawTransactions]);

  return (
    <div className="space-y-5">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Transactions Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Platform-wide payment-linked transaction visibility currently
          available to admin.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Transaction</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Order Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      #{row.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.date ? new Date(row.date).toLocaleString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.customerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.customerEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.sellerName}</TableCell>
                  <TableCell>Rs {row.amount}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={row.orderStatus}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={
                        row.paymentStatus === 'SUCCESS' ? 'success' : 'warning'
                      }
                      label={row.paymentStatus}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminTransactions;
