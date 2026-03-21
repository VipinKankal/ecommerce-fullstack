import React, { useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { ChipProps } from '@mui/material/Chip';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Optional: for a nice time icon
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { sellerTransactions } from 'State/backend/MasterApiThunks';

type RawTransaction = {
  id?: number | string;
  orderId?: number | string;
  transactionId?: number | string;
  date?: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  user?: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
  };
  amount?: number | string;
  totalSellingPrice?: number | string;
  status?: string;
  paymentStatus?: string;
};

type TransactionRow = {
  id: number | string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  status: string;
};

const Transaction = () => {
  const dispatch = useAppDispatch();
  const responses = useAppSelector((state) => state.masterApi.responses);
  const loading = useAppSelector((state) => state.masterApi.loading);
  const rawTransactions = responses.sellerTransactions;

  useEffect(() => {
    dispatch(sellerTransactions());
  }, [dispatch]);

  const transactions = useMemo(() => {
    if (!Array.isArray(rawTransactions)) return [];
    return (rawTransactions as RawTransaction[]).map(
      (row): TransactionRow => ({
        id: row.id || row.orderId || row.transactionId || 'N/A',
        date: row.date || row.createdAt || new Date().toISOString(),
        customer: {
          name: row.customerName || row.user?.fullName || 'N/A',
          email: row.customerEmail || row.user?.email || 'N/A',
          phone: row.customerPhone || row.user?.mobileNumber || 'N/A',
        },
        amount: Number(row.amount || row.totalSellingPrice || 0),
        status: String(
          row.status || row.paymentStatus || 'PENDING',
        ).toUpperCase(),
      }),
    );
  }, [rawTransactions]);

  const getStatusStyle = (
    status: string,
  ): { color: ChipProps['color']; label: string } => {
    switch (status) {
      case 'COMPLETED':
        return { color: 'success', label: 'COMPLETED' };
      case 'PENDING':
        return { color: 'warning', label: 'PENDING' };
      case 'FAILED':
        return { color: 'error', label: 'FAILED' };
      default:
        return { color: 'default', label: status };
    }
  };

  return (
    <div className="p-4">
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Recent Transactions
      </Typography>

      <TableContainer
        component={Paper}
        className="rounded-xl shadow-sm border border-gray-100"
      >
        <Table sx={{ minWidth: 900 }}>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell className="font-bold">Order ID</TableCell>
              <TableCell className="font-bold">Date & Time</TableCell>
              <TableCell className="font-bold">Customer Details</TableCell>
              <TableCell className="font-bold">Amount</TableCell>
              <TableCell className="font-bold">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((row) => {
              const statusStyle = getStatusStyle(row.status);
              const dateObj = new Date(row.date);

              return (
                <TableRow key={row.id} hover>
                  <TableCell className="font-medium text-blue-600">
                    {row.id}
                  </TableCell>

                  {/* --- DATE & TIME CELL --- */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: '500' }}>
                      {dateObj.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 12 }} />
                      {dateObj.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {row.customer.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: 'block' }}
                      >
                        {row.customer.email}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.customer.phone}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ?{row.amount.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={statusStyle.label}
                      color={statusStyle.color}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 'bold', fontSize: '11px' }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {!transactions.length && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {loading
                    ? 'Loading transactions...'
                    : 'No transactions found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Transaction;
