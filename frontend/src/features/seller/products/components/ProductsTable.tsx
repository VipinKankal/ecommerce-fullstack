import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  deleteSellerProduct,
  fetchSellerProducts,
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
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
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
    const inStock = products.filter(
      (product) => Number(product.quantity) > 0,
    ).length;
    const lowStock = products.filter(
      (product) =>
        Number(product.quantity) > 0 &&
        Number(product.quantity) <= LOW_STOCK_THRESHOLD,
    ).length;
    const outOfStock = products.filter(
      (product) => Number(product.quantity) <= 0,
    ).length;
    const estimatedValue = products.reduce(
      (total, product) =>
        total +
        Number(product.quantity || 0) * Number(product.sellingPrice || 0),
      0,
    );

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
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
      const quantity = Number(product.quantity || 0);

      const matchesQuery =
        !query ||
        title.includes(query) ||
        color.includes(query) ||
        category.includes(query) ||
        String(product.id || '').includes(query);

      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && quantity > LOW_STOCK_THRESHOLD) ||
        (stockFilter === 'LOW_STOCK' &&
          quantity > 0 &&
          quantity <= LOW_STOCK_THRESHOLD) ||
        (stockFilter === 'OUT_OF_STOCK' && quantity <= 0);

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
      quantity: String(row.quantity ?? ''),
      color: getColorLabel(row.color),
      sizes: (row as ProductWithOptionalSize).size || row.sizes || '',
    });
  };

  const closeEdit = () => {
    setEditProduct(null);
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

  const handleStockToggle = async (product: Product, checked: boolean) => {
    if (!product.id) return;
    setTogglingId(product.id);
    try {
      await dispatch(
        updateSellerProduct({
          productId: product.id,
          product: {
            title: product.title,
            color: getColorLabel(product.color),
            description: product.description,
            images: product.images ?? [],
            sizes:
              (product as ProductWithOptionalSize).size ?? product.sizes ?? '',
            sellingPrice: product.sellingPrice,
            mrpPrice: product.mrpPrice,
            quantity: checked ? Math.max(Number(product.quantity || 0), 1) : 0,
          } as ProductUpdatePayload,
        }),
      ).unwrap();
      await dispatch(fetchSellerProducts()).unwrap();
    } finally {
      setTogglingId(null);
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
        : editProduct.quantity,
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
            title: 'In Stock',
            value: productStats.inStock,
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            icon: <SellOutlinedIcon />,
          },
          {
            title: 'Low Stock',
            value: productStats.lowStock,
            tone: 'bg-amber-50 text-amber-700 border-amber-100',
            icon: <WarningAmberRoundedIcon />,
          },
          {
            title: 'Inventory Value',
            value: `Rs ${productStats.estimatedValue}`,
            tone: 'bg-violet-50 text-violet-700 border-violet-100',
            icon: <Inventory2OutlinedIcon />,
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
              Search products, track stock health, and maintain listing quality.
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
              label="Stock"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All Products</MenuItem>
              <MenuItem value="IN_STOCK">In Stock</MenuItem>
              <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
              <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
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
          togglingId={togglingId}
          deletingId={deletingId}
          lowStockThreshold={LOW_STOCK_THRESHOLD}
          getSafeImage={getSafeImage}
          getColorLabel={getColorLabel}
          getCategoryLabel={getCategoryLabel}
          onOpenEdit={openEdit}
          onDelete={handleDelete}
          onStockToggle={handleStockToggle}
        />
      </Paper>

      <ProductEditDialog
        open={Boolean(editProduct)}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={closeEdit}
        onSave={saveEdit}
      />
    </div>
  );
};

export default ProductsTable;
