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
  IconButton,
  Chip,
  Box,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  adminAllCoupons,
  adminDeleteCoupon,
} from 'State/backend/MasterApiThunks';

type CouponRow = {
  id: number;
  code?: string;
  name?: string;
  startDate?: string;
  validFrom?: string;
  createdAt?: string;
  endDate?: string;
  validUntil?: string;
  minimumOrderValue?: number;
  minOrderValue?: number;
  discountPercentage?: number;
  discount?: number;
  active?: boolean;
  status?: string;
};

type CouponViewModel = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  minOrderValue: number;
  discount: number;
  status: string;
};

const Coupon = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const responses = useAppSelector((state) => state.masterApi.responses);
  const loading = useAppSelector((state) => state.masterApi.loading);
  const rawCoupons = responses.adminAllCoupons;

  useEffect(() => {
    dispatch(adminAllCoupons());
  }, [dispatch]);

  const coupons = useMemo(() => {
    if (!Array.isArray(rawCoupons)) return [];
    return (rawCoupons as CouponRow[]).map(
      (coupon): CouponViewModel => ({
        id: coupon.id,
        name: coupon.code || coupon.name || 'N/A',
        startDate:
          coupon.startDate || coupon.validFrom || coupon.createdAt || '',
        endDate: coupon.endDate || coupon.validUntil || '',
        minOrderValue: coupon.minimumOrderValue || coupon.minOrderValue || 0,
        discount: coupon.discountPercentage || coupon.discount || 0,
        status: coupon.active ? 'ACTIVE' : coupon.status || 'ACTIVE',
      }),
    );
  }, [rawCoupons]);

  const handleDelete = async (id: number) => {
    if (globalThis.confirm('Are you sure you want to delete this coupon?')) {
      await dispatch(adminDeleteCoupon(id));
      await dispatch(adminAllCoupons());
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'teal.800' }}>
          Coupon Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/add-new-coupon-from')}
          sx={{
            bgcolor: 'teal.600',
            '&:hover': { bgcolor: 'teal.700' },
            textTransform: 'none',
          }}
        >
          Create New Coupon
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid #e0e0e0', borderRadius: '12px' }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Coupon code</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Min Order Value</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Discount (%)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((coupon) => {
              const expired = isExpired(coupon.endDate);
              return (
                <TableRow key={coupon.id} hover>
                  <TableCell>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: 'teal.700', fontWeight: 'bold' }}
                    >
                      {coupon.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{coupon.startDate}</TableCell>
                  <TableCell>{coupon.endDate}</TableCell>
                  <TableCell>₹{coupon.minOrderValue}</TableCell>
                  <TableCell>{coupon.discount}%</TableCell>
                  <TableCell>
                    <Chip
                      label={expired ? 'EXPIRED' : coupon.status}
                      color={
                        expired || coupon.status === 'EXPIRED'
                          ? 'error'
                          : 'success'
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleDelete(coupon.id)}
                      color="error"
                      size="small"
                      sx={{ '&:hover': { bgcolor: '#fff1f2' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {!coupons.length && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {loading ? 'Loading coupons...' : 'No coupons found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Coupon;
