import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
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
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { Product } from 'shared/types/product.types';

type ProductsInventoryTableProps = {
  loading: boolean;
  products: Product[];
  filteredProducts: Product[];
  deletingId: number | null;
  transferringId: number | null;
  lowStockThreshold: number;
  getSafeImage: (image?: string) => string;
  getColorLabel: (color: unknown) => string;
  getCategoryLabel: (product: Product) => string;
  onOpenEdit: (row: Product) => void;
  onDelete: (id?: number) => void | Promise<void>;
  onOpenTransfer: (product: Product) => void;
};

const ProductsInventoryTable = ({
  loading,
  products,
  filteredProducts,
  deletingId,
  transferringId,
  lowStockThreshold,
  getSafeImage,
  getColorLabel,
  getCategoryLabel,
  onOpenEdit,
  onDelete,
  onOpenTransfer,
}: ProductsInventoryTableProps) => {
  let tableRows: React.ReactNode;

  if (loading && products.length === 0) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
          <CircularProgress />
        </TableCell>
      </TableRow>
    );
  } else if (filteredProducts.length === 0) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
          No products match the current filters.
        </TableCell>
      </TableRow>
    );
  } else {
    tableRows = filteredProducts.map((row) => {
      const sellerStock = Number(row.sellerStock ?? 0);
      const warehouseStock = Number(row.warehouseStock ?? row.quantity ?? 0);
      const colorLabel = getColorLabel(row.color);
      const isOutOfStock = warehouseStock <= 0;
      const isLowStock =
        warehouseStock > 0 && warehouseStock <= lowStockThreshold;
      let stockChip = (
        <Chip size="small" color="success" label="Warehouse Ready" />
      );
      if (isOutOfStock) {
        stockChip = <Chip size="small" color="error" label="Awaiting Transfer" />;
      } else if (isLowStock) {
        stockChip = <Chip size="small" color="warning" label="Low Warehouse Stock" />;
      }

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

          <TableCell>{sellerStock}</TableCell>

          <TableCell>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {warehouseStock}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              sellable units
            </Typography>
          </TableCell>

          <TableCell>{stockChip}</TableCell>

          <TableCell align="right">
            <div className="flex items-center justify-end gap-2">
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  transferringId === row.id ? (
                    <CircularProgress size={14} />
                  ) : (
                    <WarehouseOutlinedIcon fontSize="small" />
                  )
                }
                onClick={() => onOpenTransfer(row)}
                disabled={sellerStock <= 0 || transferringId === row.id}
              >
                Send to Warehouse
              </Button>
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
                {deletingId === row.id ? (
                  <CircularProgress size={16} />
                ) : (
                  <DeleteOutlineRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </div>
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
            <TableCell sx={{ fontWeight: 700 }}>Seller Stock</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Warehouse Stock</TableCell>
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
