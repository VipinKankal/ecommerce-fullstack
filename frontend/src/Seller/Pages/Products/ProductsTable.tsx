import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import { useAppDispatch, useAppSelector } from "../../../State/Store";
import {
  deleteSellerProduct,
  fetchSellerProducts,
  updateSellerProduct,
} from "../../../State/Seller/sellerProductThunks";
import { Product } from "../../../State/Types/ProductTypes";

type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

const LOW_STOCK_THRESHOLD = 5;

const ProductsTable = () => {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector((state) => state.sellerProduct);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    sellingPrice: "",
    mrpPrice: "",
    quantity: "",
    color: "",
    sizes: "",
  });

  useEffect(() => {
    dispatch(fetchSellerProducts());
  }, [dispatch]);

  const productStats = useMemo(() => {
    const inStock = products.filter((product) => Number(product.quantity) > 0).length;
    const lowStock = products.filter(
      (product) => Number(product.quantity) > 0 && Number(product.quantity) <= LOW_STOCK_THRESHOLD,
    ).length;
    const outOfStock = products.filter((product) => Number(product.quantity) <= 0).length;
    const estimatedValue = products.reduce(
      (total, product) =>
        total + Number(product.quantity || 0) * Number(product.sellingPrice || 0),
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
      const title = (product.title || "").toLowerCase();
      const color = `${product.color || ""}`.toLowerCase();
      const category = (product.category?.name || product.category?.categoryId || "").toLowerCase();
      const quantity = Number(product.quantity || 0);

      const matchesQuery =
        !query ||
        title.includes(query) ||
        color.includes(query) ||
        category.includes(query) ||
        String(product.id || "").includes(query);

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "IN_STOCK" && quantity > LOW_STOCK_THRESHOLD) ||
        (stockFilter === "LOW_STOCK" && quantity > 0 && quantity <= LOW_STOCK_THRESHOLD) ||
        (stockFilter === "OUT_OF_STOCK" && quantity <= 0);

      return matchesQuery && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  const getSafeImage = (image?: string) => {
    if (!image || image.startsWith("blob:")) return "/no-image.png";
    return image;
  };

  const getColorLabel = (color: any) =>
    typeof color === "string" ? color : color?.name || "N/A";

  const getCategoryLabel = (product: Product) =>
    product.category?.name || product.category?.categoryId?.replace(/_/g, " ") || "N/A";

  const openEdit = (row: Product) => {
    setEditProduct(row);
    setEditForm({
      title: row.title || "",
      sellingPrice: String(row.sellingPrice ?? ""),
      mrpPrice: String(row.mrpPrice ?? ""),
      quantity: String(row.quantity ?? ""),
      color: getColorLabel(row.color),
      sizes: (row as any).size || row.sizes || "",
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
            size: (product as any).size ?? product.sizes ?? "",
            sellingPrice: product.sellingPrice,
            mrpPrice: product.mrpPrice,
            quantity: checked ? Math.max(Number(product.quantity || 0), 1) : 0,
          } as any,
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
      description: editProduct.description,
      images: editProduct.images ?? [],
      size: editForm.sizes.trim() || (editProduct as any).size || editProduct.sizes || "",
      sellingPrice: Number.isFinite(parsedSellingPrice)
        ? parsedSellingPrice
        : editProduct.sellingPrice,
      mrpPrice: Number.isFinite(parsedMrpPrice) ? parsedMrpPrice : editProduct.mrpPrice,
      quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : editProduct.quantity,
    };

    await dispatch(
      updateSellerProduct({
        productId: editProduct.id,
        product: updatePayload as any,
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
            title: "Total Products",
            value: productStats.total,
            tone: "bg-slate-50 text-slate-700 border-slate-100",
            icon: <Inventory2OutlinedIcon />,
          },
          {
            title: "In Stock",
            value: productStats.inStock,
            tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
            icon: <SellOutlinedIcon />,
          },
          {
            title: "Low Stock",
            value: productStats.lowStock,
            tone: "bg-amber-50 text-amber-700 border-amber-100",
            icon: <WarningAmberRoundedIcon />,
          },
          {
            title: "Inventory Value",
            value: `Rs ${productStats.estimatedValue}`,
            tone: "bg-violet-50 text-violet-700 border-violet-100",
            icon: <Inventory2OutlinedIcon />,
          },
        ].map((stat) => (
          <div key={stat.title} className={`rounded-3xl border p-5 shadow-sm ${stat.tone}`}>
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-2xl bg-white/80 p-3 shadow-sm">{stat.icon}</span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Inventory</p>
            </div>
            <p className="text-sm font-semibold opacity-80">{stat.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid #eef2f7", boxShadow: "none" }}>
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
              sx={{ minWidth: { xs: "100%", sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
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

        <TableContainer
          component={Paper}
          sx={{ borderRadius: "20px", boxShadow: "none", border: "1px solid #eef2f7" }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
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
                    No products match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((row) => {
                  const quantity = Number(row.quantity || 0);
                  const colorLabel = getColorLabel(row.color);
                  const isOutOfStock = quantity <= 0;
                  const isLowStock = quantity > 0 && quantity <= LOW_STOCK_THRESHOLD;

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Box display="flex" gap={2} alignItems="center">
                          <Avatar
                            src={getSafeImage(row.images?.[0])}
                            variant="rounded"
                            sx={{ width: 52, height: 52, border: "1px solid #f1f5f9" }}
                            onError={(e: any) => {
                              e.target.src = "/no-image.png";
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                              {row.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              ID: #{row.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Color: {colorLabel}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                          {getCategoryLabel(row)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Rs {row.sellingPrice}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ textDecoration: "line-through", color: "text.secondary", display: "block" }}
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
                          {isOutOfStock ? (
                            <Chip size="small" color="error" label="Out of Stock" />
                          ) : isLowStock ? (
                            <Chip size="small" color="warning" label="Low Stock" />
                          ) : (
                            <Chip size="small" color="success" label="In Stock" />
                          )}
                          <Switch
                            checked={!isOutOfStock}
                            color="success"
                            size="small"
                            disabled={togglingId === row.id}
                            onChange={(_, checked) => handleStockToggle(row, checked)}
                          />
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <IconButton color="primary" size="small" onClick={() => openEdit(row)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id}
                        >
                          {deletingId === row.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(editProduct)} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm((state) => ({ ...state, title: e.target.value }))}
              className="sm:col-span-2"
            />
            <TextField
              fullWidth
              label="Selling Price"
              type="number"
              value={editForm.sellingPrice}
              onChange={(e) => setEditForm((state) => ({ ...state, sellingPrice: e.target.value }))}
            />
            <TextField
              fullWidth
              label="MRP Price"
              type="number"
              value={editForm.mrpPrice}
              onChange={(e) => setEditForm((state) => ({ ...state, mrpPrice: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={editForm.quantity}
              onChange={(e) => setEditForm((state) => ({ ...state, quantity: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Color"
              value={editForm.color}
              onChange={(e) => setEditForm((state) => ({ ...state, color: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Sizes"
              value={editForm.sizes}
              onChange={(e) => setEditForm((state) => ({ ...state, sizes: e.target.value }))}
              className="sm:col-span-2"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProductsTable;
