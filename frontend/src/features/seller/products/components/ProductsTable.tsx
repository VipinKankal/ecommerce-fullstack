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
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  fetchSellerProducts,
  toggleSellerProductActive,
  transferSellerProductToWarehouse,
  updateSellerProduct,
} from 'State/features/seller/products/thunks';
import { Product } from 'shared/types/product.types';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import ProductEditDialog from './productsTable/ProductEditDialog';
import ProductsInventoryTable from './productsTable/ProductsInventoryTable';
import { ProductEditFormState } from './productsTable/ProductsTable.types';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type ProductWithOptionalSize = Product & { size?: string };
type ProductUpdatePayload = Partial<Product> & {
  size?: string;
  sizes?: string;
};
type PickupMode = 'SELLER_DROP' | 'WAREHOUSE_PICKUP';
type SellerDemandProductRow = {
  productId?: number;
  subscribedCount?: number;
  notifiedCount?: number;
  convertedCount?: number;
};
type SellerDemandInsights = {
  pendingSubscribers?: number;
  notifiedSubscribers?: number;
  convertedSubscribers?: number;
  demandProducts?: SellerDemandProductRow[];
};
type SellerMovementRow = {
  id: number;
  action?: string;
  from?: string;
  to?: string;
  quantity?: number;
  movementType?: string;
  requestType?: string;
  addedBy?: string;
  updatedBy?: string;
  note?: string;
  createdAt?: string;
};
type SellerRecommendationMeta = {
  recommendedQty: number;
  headline: string;
  detail: string;
  tone: 'success' | 'warning' | 'error' | 'info';
  variantHighlights: string[];
};

const LOW_STOCK_THRESHOLD = 5;
const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};
const prettify = (value?: string | null) => (value || '-').replaceAll('_', ' ');

const ProductsTable = () => {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector(
    (state) => state.sellerProduct,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [transferringId, setTransferringId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferQuantity, setTransferQuantity] = useState('1');
  const [transferPickupMode, setTransferPickupMode] =
    useState<PickupMode>('WAREHOUSE_PICKUP');
  const [transferSellerNote, setTransferSellerNote] = useState('');
  const [transferFeedback, setTransferFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [demandInsights, setDemandInsights] = useState<SellerDemandInsights | null>(
    null,
  );
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementRows, setMovementRows] = useState<SellerMovementRow[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementError, setMovementError] = useState('');
  const [editForm, setEditForm] = useState<ProductEditFormState>({
    title: '',
    brand: '',
    description: '',
    sellingPrice: '',
    mrpPrice: '',
    quantity: '',
    color: '',
    sizes: '',
    warrantyType: 'NONE',
    warrantyDays: '0',
  });

  useEffect(() => {
    dispatch(fetchSellerProducts());
  }, [dispatch]);

  useEffect(() => {
    const loadDemandInsights = async () => {
      try {
        const response = await api.get(API_ROUTES.sellerProducts.demand);
        setDemandInsights((response.data || {}) as SellerDemandInsights);
      } catch {
        setDemandInsights(null);
      }
    };

    loadDemandInsights();
  }, []);

  const demandByProductId = useMemo(() => {
    return new Map(
      (demandInsights?.demandProducts || []).map((item) => [
        Number(item.productId),
        {
          waiting: Number(item.subscribedCount ?? 0),
          notified: Number(item.notifiedCount ?? 0),
          converted: Number(item.convertedCount ?? 0),
        },
      ]),
    );
  }, [demandInsights?.demandProducts]);

  const productStats = useMemo(() => {
    const warehouseValues = products.map((product) =>
      Number(product.warehouseStock ?? product.quantity ?? 0),
    );
    const sellerValues = products.map((product) =>
      Number(product.sellerStock ?? 0),
    );
    const inStock = warehouseValues.filter((value) => value > 0).length;
    const lowStock = warehouseValues.filter(
      (value) => value > 0 && value <= LOW_STOCK_THRESHOLD,
    ).length;
    const estimatedValue = products.reduce(
      (total, product) =>
        total +
        Number(product.warehouseStock ?? product.quantity ?? 0) *
          Number(product.sellingPrice || 0),
      0,
    );

    return {
      total: products.length,
      sellerStock: sellerValues.reduce((sum, value) => sum + value, 0),
      inStock,
      lowStock,
      estimatedValue,
      waitingUsers: Number(demandInsights?.pendingSubscribers ?? 0),
    };
  }, [demandInsights?.pendingSubscribers, products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const title = (product.title || '').toLowerCase();
      const color = `${product.color || ''}`.toLowerCase();
      const category = (
        product.category?.name ||
        product.category?.categoryId ||
        ''
      ).toLowerCase();
      const warehouseStock = Number(
        product.warehouseStock ?? product.quantity ?? 0,
      );

      const matchesQuery =
        !query ||
        title.includes(query) ||
        color.includes(query) ||
        category.includes(query) ||
        String(product.id || '').includes(query);

      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && warehouseStock > LOW_STOCK_THRESHOLD) ||
        (stockFilter === 'LOW_STOCK' &&
          warehouseStock > 0 &&
          warehouseStock <= LOW_STOCK_THRESHOLD) ||
        (stockFilter === 'OUT_OF_STOCK' && warehouseStock <= 0);

      return matchesQuery && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  const getSafeImage = (image?: string) => {
    if (!image || image.startsWith('blob:')) return '/no-image.png';
    return image;
  };

  const getColorLabel = (color: unknown) =>
    typeof color === 'string'
      ? color
      : color && typeof color === 'object' && 'name' in color
        ? String((color as { name?: unknown }).name || 'N/A')
        : 'N/A';

  const getCategoryLabel = (product: Product) =>
    product.category?.name ||
    product.category?.categoryId?.replace(/_/g, ' ') ||
    'N/A';

  const getRecommendationMeta = (product: Product): SellerRecommendationMeta => {
    const sellerStock = Number(product.sellerStock ?? 0);
    const warehouseStock = Number(product.warehouseStock ?? product.quantity ?? 0);
    const demand = demandByProductId.get(Number(product.id)) || {
      waiting: 0,
      notified: 0,
      converted: 0,
    };
    const targetWarehouseStock = Math.max(LOW_STOCK_THRESHOLD, demand.waiting);
    const recommendedQty = Math.max(
      0,
      Math.min(sellerStock, targetWarehouseStock - warehouseStock),
    );
    const variantHighlights = (product.variants || [])
      .map((variant) => {
        const label =
          variant.size || variant.variantValue || variant.sku || `Variant ${variant.id}`;
        const variantSellerStock = Number(variant.sellerStock ?? 0);
        const variantWarehouseStock = Number(variant.warehouseStock ?? 0);

        if (variantWarehouseStock <= 0 && variantSellerStock > 0) {
          return `${label}: send soon`;
        }
        if (variantWarehouseStock <= 0) {
          return `${label}: empty`;
        }
        if (variantWarehouseStock <= LOW_STOCK_THRESHOLD) {
          return `${label}: ${variantWarehouseStock} left`;
        }
        return '';
      })
      .filter(Boolean)
      .slice(0, 2);

    if (sellerStock <= 0) {
      return {
        recommendedQty: 0,
        headline: 'Seller stock unavailable',
        detail: demand.waiting > 0
          ? `${demand.waiting} users are waiting but seller stock is empty.`
          : 'No units available to send right now.',
        tone: 'error',
        variantHighlights,
      };
    }

    if (recommendedQty > 0) {
      return {
        recommendedQty,
        headline:
          warehouseStock <= 0 ? 'Send to warehouse now' : 'Top up warehouse stock',
        detail:
          demand.waiting > 0
            ? `${demand.waiting} users are waiting. Recommended transfer ${recommendedQty} units.`
            : `Threshold top-up recommended: ${recommendedQty} units.`,
        tone: warehouseStock <= 0 ? 'warning' : 'info',
        variantHighlights,
      };
    }

    return {
      recommendedQty: 0,
      headline: 'Warehouse stock healthy',
      detail:
        demand.waiting > 0
          ? `${demand.waiting} users waiting, but warehouse can still cover demand.`
          : 'No transfer recommendation right now.',
      tone: 'success',
      variantHighlights,
    };
  };

  const openEdit = (row: Product) => {
    setEditProduct(row);
    setEditForm({
      title: row.title || '',
      brand: row.brand || '',
      description: row.description || '',
      sellingPrice: String(row.sellingPrice ?? ''),
      mrpPrice: String(row.mrpPrice ?? ''),
      quantity: String(row.sellerStock ?? 0),
      color: getColorLabel(row.color),
      sizes: (row as ProductWithOptionalSize).size || row.sizes || '',
      warrantyType: row.warrantyType || 'NONE',
      warrantyDays: String(row.warrantyDays ?? 0),
    });
  };

  const closeEdit = () => {
    setEditProduct(null);
  };

  const openTransfer = (product: Product) => {
    setTransferProduct(product);
    setTransferQuantity('1');
    setTransferPickupMode('WAREHOUSE_PICKUP');
    setTransferSellerNote('');
    setTransferFeedback(null);
  };

  const closeTransfer = () => {
    setTransferProduct(null);
    setTransferQuantity('1');
    setTransferPickupMode('WAREHOUSE_PICKUP');
    setTransferSellerNote('');
  };

  const handleToggleActive = async (product: Product) => {
    if (!product.id) return;
    setTogglingId(product.id);
    try {
      await dispatch(
        toggleSellerProductActive({
          productId: product.id,
          active: product.active === false,
        }),
      ).unwrap();
      await Promise.all([
        dispatch(fetchSellerProducts()).unwrap(),
        api.get(API_ROUTES.sellerProducts.demand).then((response) => {
          setDemandInsights((response.data || {}) as SellerDemandInsights);
        }),
      ]);
    } catch {
      // Slice error state already captures the backend rejection message.
    } finally {
      setTogglingId(null);
    }
  };

  const saveEdit = async () => {
    if (!editProduct?.id) return;

    const parsedSellingPrice = Number(editForm.sellingPrice);
    const parsedMrpPrice = Number(editForm.mrpPrice);
    const parsedQuantity = Number(editForm.quantity);
    const parsedWarrantyDays = Number(editForm.warrantyDays);

    const updatePayload = {
      title: editForm.title.trim() || editProduct.title,
      brand: editForm.brand.trim() || editProduct.brand,
      color: editForm.color.trim() || getColorLabel(editProduct.color),
      description: editForm.description.trim() || editProduct.description,
      images: editProduct.images ?? [],
      sizes:
        editForm.sizes.trim() ||
        (editProduct as ProductWithOptionalSize).size ||
        editProduct.sizes ||
        '',
      sellingPrice: Number.isFinite(parsedSellingPrice)
        ? parsedSellingPrice
        : editProduct.sellingPrice,
      mrpPrice: Number.isFinite(parsedMrpPrice)
        ? parsedMrpPrice
        : editProduct.mrpPrice,
      warrantyType: editForm.warrantyType || editProduct.warrantyType || 'NONE',
      warrantyDays: Number.isFinite(parsedWarrantyDays)
        ? parsedWarrantyDays
        : editProduct.warrantyDays ?? 0,
      quantity: Number.isFinite(parsedQuantity)
        ? parsedQuantity
        : editProduct.sellerStock ?? 0,
      size:
        editForm.sizes.trim() ||
        (editProduct as ProductWithOptionalSize).size ||
        editProduct.sizes ||
        '',
    };

    try {
      await dispatch(
        updateSellerProduct({
          productId: editProduct.id,
          product: updatePayload as ProductUpdatePayload,
        }),
      ).unwrap();
      await Promise.all([
        dispatch(fetchSellerProducts()).unwrap(),
        api.get(API_ROUTES.sellerProducts.demand).then((response) => {
          setDemandInsights((response.data || {}) as SellerDemandInsights);
        }),
      ]);
      closeEdit();
    } catch {
      // Slice error state already captures the backend rejection message.
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferProduct?.id) return;
    const quantity = Number(transferQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setTransferFeedback({
        type: 'error',
        message: 'Please enter a valid transfer quantity.',
      });
      return;
    }
    if (quantity > Number(transferProduct.sellerStock ?? 0)) {
      setTransferFeedback({
        type: 'error',
        message: `Requested quantity is higher than seller stock (${transferProduct.sellerStock ?? 0}).`,
      });
      return;
    }

    setTransferringId(transferProduct.id);
    try {
      await dispatch(
        transferSellerProductToWarehouse({
          productId: transferProduct.id,
          quantity,
          pickupMode: transferPickupMode,
          sellerNote: transferSellerNote.trim() || undefined,
        }),
      ).unwrap();
      await Promise.all([
        dispatch(fetchSellerProducts()).unwrap(),
        api.get(API_ROUTES.sellerProducts.demand).then((response) => {
          setDemandInsights((response.data || {}) as SellerDemandInsights);
        }),
      ]);
      setTransferFeedback({
        type: 'success',
        message:
          'Transfer request created successfully. It is now pending admin approval.',
      });
      closeTransfer();
    } catch (requestError: unknown) {
      const fallback = 'Transfer request failed. Please try again.';
      const message =
        typeof requestError === 'string'
          ? requestError
          : requestError &&
              typeof requestError === 'object' &&
              'message' in requestError &&
              typeof (requestError as { message?: unknown }).message === 'string'
            ? ((requestError as { message?: string }).message as string)
            : fallback;
      setTransferFeedback({
        type: 'error',
        message,
      });
    } finally {
      setTransferringId(null);
    }
  };

  const openMovementHistory = async (product: Product) => {
    if (!product.id) return;
    setMovementProduct(product);
    setMovementRows([]);
    setMovementError('');
    setMovementLoading(true);
    try {
      const response = await api.get(API_ROUTES.sellerProducts.movements(product.id));
      setMovementRows(
        Array.isArray(response.data) ? (response.data as SellerMovementRow[]) : [],
      );
    } catch {
      setMovementError('Failed to load stock movement history.');
    } finally {
      setMovementLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Products',
            value: productStats.total,
            tone: 'bg-slate-50 text-slate-700 border-slate-100',
            icon: <Inventory2OutlinedIcon />,
          },
          {
            title: 'Seller Stock Units',
            value: productStats.sellerStock,
            tone: 'bg-cyan-50 text-cyan-700 border-cyan-100',
            icon: <SellOutlinedIcon />,
          },
          {
            title: 'Low Warehouse Stock',
            value: productStats.lowStock,
            tone: 'bg-amber-50 text-amber-700 border-amber-100',
            icon: <WarningAmberRoundedIcon />,
          },
          {
            title: 'Warehouse Value',
            value: `Rs ${productStats.estimatedValue}`,
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            icon: <WarehouseOutlinedIcon />,
          },
          {
            title: 'Waiting Users',
            value: productStats.waitingUsers,
            tone: 'bg-orange-50 text-orange-700 border-orange-100',
            icon: <WarningAmberRoundedIcon />,
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className={`rounded-3xl border p-5 shadow-sm ${stat.tone}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-2xl bg-white/80 p-3 shadow-sm">
                {stat.icon}
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                Inventory
              </p>
            </div>
            <p className="text-sm font-semibold opacity-80">{stat.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          border: '1px solid #eef2f7',
          boxShadow: 'none',
        }}
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Product Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Seller stock stays with you until warehouse receives an approved
              transfer request. Only warehouse stock is sellable to customers.
            </Typography>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TextField
              size="small"
              placeholder="Search by title, category, color or id"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              label="Warehouse Stock"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">All Products</MenuItem>
              <MenuItem value="IN_STOCK">In Stock</MenuItem>
              <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
              <MenuItem value="OUT_OF_STOCK">Awaiting Transfer</MenuItem>
            </TextField>
          </div>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {transferFeedback && (
          <Alert severity={transferFeedback.type} sx={{ mb: 2 }}>
            {transferFeedback.message}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          Sellers can update their own catalog and seller stock. Use Disable to
          hide a product from customers without removing order history. Send to
          Warehouse now creates a transfer request for admin review. Waitlist is
          read-only and shows how many users are waiting for warehouse stock.
        </Alert>

        <ProductsInventoryTable
          loading={loading}
          products={products}
          filteredProducts={filteredProducts}
          transferringId={transferringId}
          togglingId={togglingId}
          lowStockThreshold={LOW_STOCK_THRESHOLD}
          getRecommendationMeta={getRecommendationMeta}
          getDemandMeta={(productId) =>
            demandByProductId.get(Number(productId)) || {
              waiting: 0,
              notified: 0,
              converted: 0,
            }
          }
          getSafeImage={getSafeImage}
          getColorLabel={getColorLabel}
          getCategoryLabel={getCategoryLabel}
          onOpenEdit={openEdit}
          onOpenMovements={openMovementHistory}
          onOpenTransfer={openTransfer}
          onToggleActive={handleToggleActive}
        />
      </Paper>

      <ProductEditDialog
        open={Boolean(editProduct)}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={closeEdit}
        onSave={saveEdit}
      />

      <Dialog open={Boolean(transferProduct)} onClose={closeTransfer} fullWidth maxWidth="sm">
        <DialogTitle>Create Warehouse Transfer Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Seller transfer request banayega. Stock deduction tabhi hoga jab
            warehouse receive mark karega.
          </Typography>
          <Stack spacing={2}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                fullWidth
                label="Transfer Quantity"
                type="number"
                value={transferQuantity}
                onChange={(event) => setTransferQuantity(event.target.value)}
                inputProps={{
                  min: 1,
                  max: Number(transferProduct?.sellerStock ?? 0),
                }}
              />
              <TextField
                select
                fullWidth
                label="Pickup Mode"
                value={transferPickupMode}
                onChange={(event) =>
                  setTransferPickupMode(event.target.value as PickupMode)
                }
              >
                <MenuItem value="WAREHOUSE_PICKUP">Warehouse Pickup</MenuItem>
                <MenuItem value="SELLER_DROP">Seller Drop</MenuItem>
              </TextField>
            </div>

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Transfer Note (optional)"
              value={transferSellerNote}
              onChange={(event) => setTransferSellerNote(event.target.value)}
              placeholder="Example: pickup address landmark, ready timing, contact person"
            />

            <Alert severity="info">
              {transferProduct
                ? `Available seller stock: ${transferProduct.sellerStock ?? 0}`
                : 'Choose quantity'}
            </Alert>
            {transferPickupMode === 'SELLER_DROP' ? (
              <Alert severity="success">
                Seller drop mode: courier assign nahi hoga. Admin approval ke baad
                seller stock warehouse par drop karega.
              </Alert>
            ) : (
              <Alert severity="warning">
                Warehouse pickup mode: admin approve ke baad manager logistics plan
                karega, courier/transport assign karega, phir pickup hoga.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTransfer}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTransferSubmit}
            disabled={
              !transferProduct ||
              transferringId === transferProduct.id ||
              Number(transferQuantity) <= 0
            }
          >
            Create Request
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(movementProduct)}
        onClose={() => setMovementProduct(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Stock Movement History</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Typography variant="body2" color="text.secondary">
                  {movementProduct?.title} | Product #{movementProduct?.id}
                </Typography>
                {movementProduct && (
                  <Typography variant="caption" color="text.secondary">
                    {getRecommendationMeta(movementProduct).detail}
                  </Typography>
                )}
              </div>
              {movementProduct && (
                <Chip
                  size="small"
                  color={getRecommendationMeta(movementProduct).tone}
                  label={getRecommendationMeta(movementProduct).headline}
                />
              )}
            </div>
            {movementError && <Alert severity="error">{movementError}</Alert>}
            <TableContainer
              component={Paper}
              sx={{ borderRadius: '20px', boxShadow: 'none', border: '1px solid #eef2f7' }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>When</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Movement</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Flow</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actors</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movementLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : movementRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        No stock history found yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movementRows.map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                        <TableCell>{prettify(movement.action)}</TableCell>
                        <TableCell>{prettify(movement.movementType)}</TableCell>
                        <TableCell>
                          {movement.from || '-'} to {movement.to || '-'}
                        </TableCell>
                        <TableCell>{movement.quantity ?? 0}</TableCell>
                        <TableCell>
                          {movement.addedBy || '-'} / {movement.updatedBy || '-'}
                        </TableCell>
                        <TableCell>{movement.note || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementProduct(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProductsTable;
