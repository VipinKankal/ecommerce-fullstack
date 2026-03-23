import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  adminAllCoupons,
  adminCouponMetrics,
  adminCouponMonitoring,
  adminDeleteCoupon,
} from 'State/backend/MasterApiThunks';
import AddNewCouponFrom from './AddNewCouponFrom';

type CouponRow = {
  id: number;
  code?: string;
  discountType?: string;
  discountValue?: number;
  discountPercentage?: number;
  minimumOrderValue?: number;
  validityStartDate?: string;
  validityEndDate?: string;
  usageLimit?: number | null;
  usedCount?: number | null;
  active?: boolean;
};

type CouponViewModel = {
  id: number;
  code: string;
  discountLabel: string;
  startDate: string;
  endDate: string;
  minOrderValue: number;
  usageSummary: string;
  status: string;
};

type CouponMetrics = {
  applied?: number;
  rejected?: number;
  consumed?: number;
  restored?: number;
  conversionRatePercent?: number;
  rejectionRatePercent?: number;
  totalDiscountGiven?: number;
  days?: number;
};

type CouponMonitoring = {
  applies?: number;
  rejects?: number;
  recommended?: number;
  rejectRatePercent?: number;
  alert?: boolean;
  cacheHits?: number;
  cacheMisses?: number;
  cacheHitRatePercent?: number;
  cacheSize?: number;
  windowMinutes?: number;
};

const Coupon = () => {
  const dispatch = useAppDispatch();
  const responses = useAppSelector((state) => state.masterApi.responses);
  const loading = useAppSelector((state) => state.masterApi.loading);
  const rawCoupons = responses.adminAllCoupons;
  const metrics = (responses.adminCouponMetrics as CouponMetrics | undefined) || {};
  const monitoring =
    (responses.adminCouponMonitoring as CouponMonitoring | undefined) || {};
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    dispatch(adminAllCoupons());
    dispatch(adminCouponMetrics(30));
    dispatch(adminCouponMonitoring(30));
  }, [dispatch]);

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      dispatch(adminCouponMonitoring(30));
    }, 30000);
    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [dispatch]);

  const coupons = useMemo(() => {
    if (!Array.isArray(rawCoupons)) return [];
    return (rawCoupons as CouponRow[]).map(
      (coupon): CouponViewModel => ({
        id: coupon.id,
        code: coupon.code || 'N/A',
        discountLabel:
          coupon.discountType === 'FLAT'
            ? `Rs ${coupon.discountValue || 0}`
            : `${coupon.discountValue || coupon.discountPercentage || 0}%`,
        startDate: coupon.validityStartDate || '',
        endDate: coupon.validityEndDate || '',
        minOrderValue: coupon.minimumOrderValue || 0,
        usageSummary: `${coupon.usedCount || 0}/${coupon.usageLimit || 'inf'}`,
        status: coupon.active ? 'ACTIVE' : 'DISABLED',
      }),
    );
  }, [rawCoupons]);

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    await dispatch(adminAllCoupons());
    await dispatch(adminCouponMetrics(30));
    await dispatch(adminCouponMonitoring(30));
  };

  const handleDelete = async (id: number) => {
    if (globalThis.confirm('Are you sure you want to disable this coupon?')) {
      await dispatch(adminDeleteCoupon(id));
      await dispatch(adminAllCoupons());
      await dispatch(adminCouponMetrics(30));
      await dispatch(adminCouponMonitoring(30));
    }
  };

  const handleRefreshInsights = async () => {
    await dispatch(adminCouponMetrics(30));
    await dispatch(adminCouponMonitoring(30));
  };

  const isExpired = (endDate: string) => Boolean(endDate) && new Date(endDate) < new Date();

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
          onClick={() => setShowCreateForm((previous) => !previous)}
          sx={{
            bgcolor: 'teal.600',
            '&:hover': { bgcolor: 'teal.700' },
            textTransform: 'none',
          }}
        >
          {showCreateForm ? 'Hide Form' : 'Create New Coupon'}
        </Button>
      </Box>

      <Collapse in={showCreateForm} unmountOnExit>
        <Box sx={{ mb: 3 }}>
          <AddNewCouponFrom
            embedded
            onCreated={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </Box>
      </Collapse>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Coupon Insights (Last {metrics.days || 30} days)
        </Typography>
        <Button variant="outlined" onClick={handleRefreshInsights}>
          Refresh Insights
        </Button>
      </Stack>

      {Boolean(monitoring.alert) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          High coupon rejection rate detected in the last{' '}
          {monitoring.windowMinutes || 30} minutes. Review validation/fraud rules.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline">Conversion</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {metrics.conversionRatePercent || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applied: {metrics.applied || 0} | Consumed: {metrics.consumed || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline">Rejection Rate</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {metrics.rejectionRatePercent || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected: {metrics.rejected || 0} | Restored: {metrics.restored || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline">Discount Impact</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Rs {metrics.totalDiscountGiven || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applies (window): {monitoring.applies || 0} | Rejects: {monitoring.rejects || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Cache Health
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Hit rate: {monitoring.cacheHitRatePercent || 0}% | Hits:{' '}
            {monitoring.cacheHits || 0} | Misses: {monitoring.cacheMisses || 0} | Cache
            size: {monitoring.cacheSize || 0}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.max(
              0,
              Math.min(100, Number(monitoring.cacheHitRatePercent || 0)),
            )}
            sx={{ height: 8, borderRadius: 999 }}
          />
        </CardContent>
      </Card>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid #e0e0e0', borderRadius: '12px' }}
      >
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Coupon code</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Discount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Min Order Value</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Usage</TableCell>
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
                      {coupon.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{coupon.discountLabel}</TableCell>
                  <TableCell>{coupon.startDate}</TableCell>
                  <TableCell>{coupon.endDate}</TableCell>
                  <TableCell>Rs {coupon.minOrderValue}</TableCell>
                  <TableCell>{coupon.usageSummary}</TableCell>
                  <TableCell>
                    <Chip
                      label={expired ? 'EXPIRED' : coupon.status}
                      color={
                        expired || coupon.status === 'DISABLED'
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
                <TableCell colSpan={8} align="center">
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
