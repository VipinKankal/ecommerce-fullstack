import React, { useEffect } from 'react';
import {
  Alert,
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
import { adminProductsList } from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';

type AdminProductRow = {
  id: number;
  title?: string;
  categoryName?: string;
  sellerName?: string;
  quantity?: number;
  sellingPrice?: number;
  mrpPrice?: number;
};

const AdminProducts = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const products = Array.isArray(responses.adminProductsList)
    ? (responses.adminProductsList as AdminProductRow[])
    : [];

  useEffect(() => {
    dispatch(adminProductsList());
  }, [dispatch]);

  return (
    <div className="space-y-5">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Product Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Admin visibility over seller-listed catalog items.
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
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {product.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{product.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {product.categoryName || 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    {product.sellerName || 'Unassigned Seller'}
                  </TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Rs {product.sellingPrice}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      MRP Rs {product.mrpPrice}
                    </Typography>
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

export default AdminProducts;
