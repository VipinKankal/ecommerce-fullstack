import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Paper,
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
  deleteSellerProduct,
  fetchSellerProducts,
  transferSellerProductToWarehouse,
  updateSellerProduct,
} from 'State/features/seller/products/thunks';
import { Product } from 'shared/types/product.types';
import ProductEditDialog from './productsTable/ProductEditDialog';
import ProductsInventoryTable from './productsTable/ProductsInventoryTable';
import { ProductEditFormState } from './productsTable/ProductsTable.types';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type ProductWithOptionalSize = Product & { size?: string };
type ProductUpdatePayload = Partial<Product> & {
  size?: string;
  sizes?: string;
};

const LOW_STOCK_THRESHOLD = 5;

const ProductsTable = () => {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector(
    (state) => state.sellerProduct,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [transferringId, setTransferringId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferQuantity, setTransferQuantity] = useState('1');
  const [editForm, setEditForm] = useState<ProductEditFormState>({
    title: '',
    description: '',
    sellingPrice: '',
    mrpPrice: '',
    quantity: '',
    color: '',
    sizes: '',
  });

  useEffect(() => {
    dispatch(fetchSellerProducts());
  }, [dispatch]);

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
    };
  }, [products]);

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

  const openEdit = (row: Product) => {
    setEditProduct(row);
    setEditForm({
      title: row.title || '',
      description: row.description || '',
      sellingPrice: String(row.sellingPrice ?? ''),
      mrpPrice: String(row.mrpPrice ?? ''),
      quantity: String(row.sellerStock ?? 0),
      color: getColorLabel(row.color),
      sizes: (row as ProductWithOptionalSize).size || row.sizes || '',
    });
  };

  const closeEdit = () => {
    setEditProduct(null);
  };

  const openTransfer = (product: Product) => {
    setTransferProduct(product);
    setTransferQuantity('1');
  };

  const closeTransfer = () => {
    setTransferProduct(null);
    setTransferQuantity('1');
  };

  const handleDelete = async (productId?: number) => {
    if (!productId) return;
    setDeletingId(productId);
    try {
      await dispatch(deleteSellerProduct({ productId })).unwrap();
      await dispatch(fetchSellerProducts()).unwrap();
    } finally {
      setDeletingId(null);
    }
  };

  const saveEdit = async () => {
    if (!editProduct?.id) return;

    const parsedSellingPrice = Number(editForm.sellingPrice);
    const parsedMrpPrice = Number(editForm.mrpPrice);
    const parsedQuantity = Number(editForm.quantity);

    const updatePayload = {
      title: editForm.title.trim() || editProduct.title,
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
      quantity: Number.isFinite(parsedQuantity)
        ? parsedQuantity
        : editProduct.sellerStock ?? 0,
    };

    await dispatch(
      updateSellerProduct({
        productId: editProduct.id,
        product: updatePayload as ProductUpdatePayload,
      }),
    ).unwrap();
    await dispatch(fetchSellerProducts()).unwrap();
    closeEdit();
  };

  const handleTransferSubmit = async () => {
    if (!transferProduct?.id) return;
    const quantity = Number(transferQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setTransferringId(transferProduct.id);
    try {
      await dispatch(
        transferSellerProductToWarehouse({
          productId: transferProduct.id,
          quantity,
        }),
      ).unwrap();
      await dispatch(fetchSellerProducts()).unwrap();
      closeTransfer();
    } finally {
      setTransferringId(null);
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
              Seller stock stays with you until you send units to the warehouse.
              Only warehouse stock is sellable to customers.
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

        <ProductsInventoryTable
          loading={loading}
          products={products}
          filteredProducts={filteredProducts}
          deletingId={deletingId}
          transferringId={transferringId}
          lowStockThreshold={LOW_STOCK_THRESHOLD}
          getSafeImage={getSafeImage}
          getColorLabel={getColorLabel}
          getCategoryLabel={getCategoryLabel}
          onOpenEdit={openEdit}
          onDelete={handleDelete}
          onOpenTransfer={openTransfer}
        />
      </Paper>

      <ProductEditDialog
        open={Boolean(editProduct)}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={closeEdit}
        onSave={saveEdit}
      />

      <Dialog open={Boolean(transferProduct)} onClose={closeTransfer} fullWidth maxWidth="xs">
        <DialogTitle>Send Stock to Warehouse</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Move seller-owned stock into warehouse stock for customer orders.
          </Typography>
          <TextField
            fullWidth
            label="Transfer Quantity"
            type="number"
            value={transferQuantity}
            onChange={(event) => setTransferQuantity(event.target.value)}
            inputProps={{ min: 1 }}
            helperText={`Available seller stock: ${transferProduct?.sellerStock ?? 0}`}
          />
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
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProductsTable;
