import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
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
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { adminProductsList } from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';

type AdminWarehouseRow = {
  id: number;
  title?: string;
  categoryName?: string;
  sellerName?: string;
  quantity?: number;
  sellerStock?: number;
  warehouseStock?: number;
  sellingPrice?: number;
};

type StockFilter =
  | 'ALL'
  | 'READY'
  | 'LOW'
  | 'AWAITING_TRANSFER'
  | 'OUT_OF_STOCK';

const LOW_STOCK_THRESHOLD = 10;

const AdminWarehouseStock = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const products = useMemo(() => {
    const rows = Array.isArray(responses.adminProductsList)
      ? (responses.adminProductsList as AdminWarehouseRow[])
      : [];

    return rows.map((row) => {
      const sellerStock = Number(row.sellerStock ?? 0);
      const warehouseStock = Number(row.warehouseStock ?? row.quantity ?? 0);

      return {
        ...row,
        sellerStock,
        warehouseStock,
      };
    });
  }, [responses.adminProductsList]);

  useEffect(() => {
    dispatch(adminProductsList());
  }, [dispatch]);

  const warehouseStats = useMemo(() => {
    const totalWarehouseUnits = products.reduce(
      (sum, product) => sum + product.warehouseStock,
      0,
    );
    const sellerHeldUnits = products.reduce(
      (sum, product) => sum + product.sellerStock,
      0,
    );
    const lowStockCount = products.filter(
      (product) =>
        product.warehouseStock > 0 &&
        product.warehouseStock <= LOW_STOCK_THRESHOLD,
    ).length;
    const awaitingTransferCount = products.filter(
      (product) => product.warehouseStock <= 0 && product.sellerStock > 0,
    ).length;
    const outOfStockCount = products.filter(
      (product) => product.warehouseStock <= 0 && product.sellerStock <= 0,
    ).length;

    return {
      totalWarehouseUnits,
      sellerHeldUnits,
      lowStockCount,
      awaitingTransferCount,
      outOfStockCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = deferredSearchQuery.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !search ||
          product.title?.toLowerCase().includes(search) ||
          product.categoryName?.toLowerCase().includes(search) ||
          product.sellerName?.toLowerCase().includes(search) ||
          String(product.id).includes(search);

        if (!matchesSearch) return false;

        if (stockFilter === 'READY') {
          return product.warehouseStock > LOW_STOCK_THRESHOLD;
        }

        if (stockFilter === 'LOW') {
          return (
            product.warehouseStock > 0 &&
            product.warehouseStock <= LOW_STOCK_THRESHOLD
          );
        }

        if (stockFilter === 'AWAITING_TRANSFER') {
          return product.warehouseStock <= 0 && product.sellerStock > 0;
        }

        if (stockFilter === 'OUT_OF_STOCK') {
          return product.warehouseStock <= 0 && product.sellerStock <= 0;
        }

        return true;
      })
      .sort((left, right) => left.warehouseStock - right.warehouseStock);
  }, [deferredSearchQuery, products, stockFilter]);

  const getStockLabel = (product: (typeof products)[number]) => {
    if (product.warehouseStock <= 0 && product.sellerStock > 0) {
      return {
        label: 'Awaiting Transfer',
        color: 'warning' as const,
        note: 'Ask seller to send stock',
      };
    }

    if (product.warehouseStock <= 0) {
      return {
        label: 'Out of Stock',
        color: 'error' as const,
        note: 'No units available',
      };
    }

    if (product.warehouseStock <= LOW_STOCK_THRESHOLD) {
      return {
        label: 'Low Stock',
        color: 'warning' as const,
        note: 'Refill warehouse soon',
      };
    }

    return {
      label: 'Ready to Sell',
      color: 'success' as const,
      note: 'Warehouse can fulfill orders',
    };
  };

  return (
    <div className="space-y-5">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Warehouse Stock
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Admin-controlled warehouse inventory for sellable customer stock.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Warehouse Units
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.totalWarehouseUnits}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Units currently sellable to customers
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Seller-Held Units
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.sellerHeldUnits}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stock still waiting outside warehouse
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #fcd34d', bgcolor: '#fffbeb' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Low Stock SKUs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.lowStockCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Products below the refill threshold of {LOW_STOCK_THRESHOLD}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #fdba74', bgcolor: '#fff7ed' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Transfer Needed
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.awaitingTransferCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SKUs with zero warehouse stock but seller stock available
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Warehouse Availability Board
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer orders should ship only from warehouse stock. Seller stock
              is visible here only for transfer planning.
            </Typography>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TextField
              size="small"
              placeholder="Search by product, seller, category or id"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 320 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              size="small"
              select
              label="Warehouse Health"
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value as StockFilter)
              }
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="ALL">All Products</MenuItem>
              <MenuItem value="READY">Ready to Sell</MenuItem>
              <MenuItem value="LOW">Low Stock</MenuItem>
              <MenuItem value="AWAITING_TRANSFER">Awaiting Transfer</MenuItem>
              <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
            </TextField>
          </div>
        </div>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '20px',
            boxShadow: 'none',
            border: '1px solid #eef2f7',
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seller Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Warehouse Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sellable Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No warehouse stock records found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockLabel(product);
                  const sellableValue =
                    product.warehouseStock * Number(product.sellingPrice ?? 0);

                  return (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {product.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{product.id} • {product.categoryName || 'Uncategorized'}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.sellerName || 'Unassigned Seller'}</TableCell>
                      <TableCell>{product.sellerStock}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {product.warehouseStock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Chip
                            size="small"
                            label={stockStatus.label}
                            color={stockStatus.color}
                            sx={{ width: 'fit-content' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {stockStatus.note}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Rs {sellableValue}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Selling price Rs {product.sellingPrice ?? 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {warehouseStats.outOfStockCount > 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            {warehouseStats.outOfStockCount} products currently have no seller
            stock and no warehouse stock, so they cannot be fulfilled until new
            inventory is added.
          </Alert>
        )}
      </Paper>
    </div>
  );
};

export default AdminWarehouseStock;
