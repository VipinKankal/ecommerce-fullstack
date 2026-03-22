import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { Product } from 'shared/types/product.types';

type ProductsInventoryTableProps = {
  loading: boolean;
  products: Product[];
  filteredProducts: Product[];
  transferringId: number | null;
  togglingId: number | null;
  lowStockThreshold: number;
  getDemandMeta: (
    productId?: number,
  ) => { waiting: number; notified: number; converted: number };
  getRecommendationMeta: (product: Product) => {
    recommendedQty: number;
    headline: string;
    detail: string;
    tone: 'success' | 'warning' | 'error' | 'info';
    variantHighlights: string[];
  };
  getSafeImage: (image?: string) => string;
  getColorLabel: (color: unknown) => string;
  getCategoryLabel: (product: Product) => string;
  onOpenEdit: (row: Product) => void;
  onOpenMovements: (product: Product) => void;
  onOpenTransfer: (product: Product) => void;
  onToggleActive: (product: Product) => void | Promise<void>;
};

const ProductsInventoryTable = ({
  loading,
  products,
  filteredProducts,
  transferringId,
  togglingId,
  lowStockThreshold,
  getDemandMeta,
  getRecommendationMeta,
  getSafeImage,
  getColorLabel,
  getCategoryLabel,
  onOpenEdit,
  onOpenMovements,
  onOpenTransfer,
  onToggleActive,
}: ProductsInventoryTableProps) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    product: Product,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuProduct(product);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuProduct(null);
  };

  const handleMenuEdit = () => {
    if (!menuProduct) return;
    onOpenEdit(menuProduct);
    handleCloseMenu();
  };

  const handleMenuTransfer = () => {
    if (!menuProduct) return;
    onOpenTransfer(menuProduct);
    handleCloseMenu();
  };

  const handleMenuMovements = () => {
    if (!menuProduct) return;
    onOpenMovements(menuProduct);
    handleCloseMenu();
  };

  const handleMenuToggleActive = () => {
    if (!menuProduct) return;
    onToggleActive(menuProduct);
    handleCloseMenu();
  };

  let tableRows: React.ReactNode;

  if (loading && products.length === 0) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
          <CircularProgress />
        </TableCell>
      </TableRow>
    );
  } else if (filteredProducts.length === 0) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
          No products match the current filters.
        </TableCell>
      </TableRow>
    );
  } else {
    tableRows = filteredProducts.map((row) => {
      const sellerStock = Number(row.sellerStock ?? 0);
      const warehouseStock = Number(row.warehouseStock ?? row.quantity ?? 0);
      const colorLabel = getColorLabel(row.color);
      const isInactive = row.active === false;
      const isOutOfStock = warehouseStock <= 0;
      const isLowStock =
        warehouseStock > 0 && warehouseStock <= lowStockThreshold;
      const demand = getDemandMeta(row.id);
      const recommendation = getRecommendationMeta(row);
      const variantHighlights = (row.variants || [])
        .map((variant) => {
          const label =
            variant.size ||
            variant.variantValue ||
            variant.sku ||
            `Variant ${variant.id}`;
          const variantSellerStock = Number(variant.sellerStock ?? 0);
          const variantWarehouseStock = Number(variant.warehouseStock ?? 0);

          if (variantWarehouseStock <= 0 && variantSellerStock > 0) {
            return {
              label: `${label}: transfer`,
              color: 'warning' as const,
            };
          }
          if (variantWarehouseStock <= 0) {
            return {
              label: `${label}: out`,
              color: 'error' as const,
            };
          }
          if (variantWarehouseStock <= lowStockThreshold) {
            return {
              label: `${label}: ${variantWarehouseStock} left`,
              color: 'warning' as const,
            };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 2) as Array<{ label: string; color: 'warning' | 'error' }>;
      let stockChip = (
        <Chip size="small" color="success" label="Warehouse Ready" />
      );
      if (isInactive) {
        stockChip = <Chip size="small" color="default" label="Inactive" />;
      } else if (isOutOfStock && sellerStock > 0) {
        stockChip = <Chip size="small" color="error" label="Awaiting Transfer" />;
      } else if (isOutOfStock) {
        stockChip = <Chip size="small" color="error" label="Out of Stock" />;
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
            {variantHighlights.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {variantHighlights.map((variantAlert) => (
                  <Chip
                    key={`${row.id}-${variantAlert.label}`}
                    size="small"
                    color={variantAlert.color}
                    variant="outlined"
                    label={variantAlert.label}
                  />
                ))}
              </div>
            )}
          </TableCell>

          <TableCell>
            {demand.waiting > 0 ? (
              <div className="flex flex-col gap-1">
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`${demand.waiting} waiting`}
                  sx={{ width: 'fit-content' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {demand.notified} notified | {demand.converted} converted
                </Typography>
              </div>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No active demand
              </Typography>
            )}
          </TableCell>

          <TableCell>{stockChip}</TableCell>

          <TableCell>
            <div className="flex flex-col gap-1">
              <Chip
                size="small"
                color={recommendation.tone}
                variant={recommendation.recommendedQty > 0 ? 'filled' : 'outlined'}
                label={
                  recommendation.recommendedQty > 0
                    ? `Send ${recommendation.recommendedQty} units`
                    : recommendation.headline
                }
                sx={{ width: 'fit-content' }}
              />
              <Typography variant="caption" color="text.secondary">
                {recommendation.detail}
              </Typography>
              {recommendation.variantHighlights.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {recommendation.variantHighlights.join(' | ')}
                </Typography>
              )}
            </div>
          </TableCell>

          <TableCell align="right">
            <div className="flex items-center justify-end gap-2">
              <IconButton
                size="small"
                onClick={(event) => handleOpenMenu(event, row)}
              >
                <MoreVertRoundedIcon fontSize="small" />
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
            <TableCell sx={{ fontWeight: 700 }}>Waitlist</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Recommendation</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{tableRows}</TableBody>
      </Table>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuEdit}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuMovements} disabled={!menuProduct}>
          <ListItemIcon>
            <HistoryRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Stock History</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleMenuTransfer}
          disabled={
            !menuProduct ||
            Number(menuProduct.sellerStock ?? 0) <= 0 ||
            menuProduct.active === false ||
            transferringId === menuProduct.id
          }
        >
          <ListItemIcon>
            {menuProduct && transferringId === menuProduct.id ? (
              <CircularProgress size={16} />
            ) : (
              <WarehouseOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>Create Transfer Request</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleMenuToggleActive}
          disabled={!menuProduct || togglingId === menuProduct.id}
        >
          <ListItemIcon>
            {menuProduct && togglingId === menuProduct.id ? (
              <CircularProgress size={16} />
            ) : menuProduct?.active === false ? (
              <VisibilityOutlinedIcon fontSize="small" />
            ) : (
              <VisibilityOffOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {menuProduct?.active === false ? 'Enable' : 'Disable'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default ProductsInventoryTable;
