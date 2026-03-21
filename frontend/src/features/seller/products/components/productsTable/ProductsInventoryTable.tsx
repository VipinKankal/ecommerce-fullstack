import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Product } from 'shared/types/product.types';

type ProductsInventoryTableProps = {
  loading: boolean;
  products: Product[];
  filteredProducts: Product[];
  togglingId: number | null;
  deletingId: number | null;
  lowStockThreshold: number;
  getSafeImage: (image?: string) => string;
  getColorLabel: (color: unknown) => string;
  getCategoryLabel: (product: Product) => string;
  onOpenEdit: (row: Product) => void;
  onDelete: (id?: number) => void | Promise<void>;
  onStockToggle: (product: Product, checked: boolean) => void | Promise<void>;
};

const ProductsInventoryTable = ({
  loading,
  products,
  filteredProducts,
  togglingId,
  deletingId,
  lowStockThreshold,
  getSafeImage,
  getColorLabel,
  getCategoryLabel,
  onOpenEdit,
  onDelete,
  onStockToggle,
}: ProductsInventoryTableProps) => {
  let tableRows: React.ReactNode;

  if (loading && products.length === 0) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
          <CircularProgress />
        </TableCell>
      </TableRow>
    );
  } else if (filteredProducts.length === 0) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
          No products match the current filters.
        </TableCell>
      </TableRow>
    );
  } else {
    tableRows = filteredProducts.map((row) => {
      const quantity = Number(row.quantity || 0);
      const colorLabel = getColorLabel(row.color);
      const isOutOfStock = quantity <= 0;
      const isLowStock = quantity > 0 && quantity <= lowStockThreshold;
      let stockChip = <Chip size="small" color="success" label="In Stock" />;
      if (isOutOfStock) {
        stockChip = <Chip size="small" color="error" label="Out of Stock" />;
      } else if (isLowStock) {
        stockChip = <Chip size="small" color="warning" label="Low Stock" />;
      }
      const actionIcon =
        deletingId === row.id ? (
          <CircularProgress size={16} />
        ) : (
          <DeleteOutlineRoundedIcon fontSize="small" />
        );

      return (
        <TableRow key={row.id} hover>
          <TableCell>
            <Box display="flex" gap={2} alignItems="center">
              <Avatar
                src={getSafeImage(row.images?.[0])}
                variant="rounded"
                sx={{ width: 52, height: 52, border: '1px solid #f1f5f9' }}
                onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                  event.currentTarget.src = '/no-image.png';
                }}
              />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                >
                  {row.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  ID: #{row.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Color: {colorLabel}
                </Typography>
              </Box>
            </Box>
          </TableCell>

          <TableCell>
            <Typography
              variant="body2"
              sx={{ textTransform: 'capitalize', fontWeight: 600 }}
            >
              {getCategoryLabel(row)}
            </Typography>
          </TableCell>

          <TableCell>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Rs {row.sellingPrice}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                textDecoration: 'line-through',
                color: 'text.secondary',
                display: 'block',
              }}
            >
              Rs {row.mrpPrice}
            </Typography>
          </TableCell>

          <TableCell>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {quantity}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              units available
            </Typography>
          </TableCell>

          <TableCell>
            <Stack direction="row" spacing={1} alignItems="center">
              {stockChip}
              <Switch
                checked={!isOutOfStock}
                color="success"
                size="small"
                disabled={togglingId === row.id}
                onChange={(_, checked) => onStockToggle(row, checked)}
              />
            </Stack>
          </TableCell>

          <TableCell align="right">
            <IconButton
              color="primary"
              size="small"
              onClick={() => onOpenEdit(row)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => onDelete(row.id)}
              disabled={deletingId === row.id}
            >
              {actionIcon}
            </IconButton>
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
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
            <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{tableRows}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductsInventoryTable;
