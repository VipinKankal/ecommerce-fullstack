import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  Menu,
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
} from "@mui/material";
import { MoreVert, SearchRounded, Visibility } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import {
  fetchSellerOrders,
  SellerOrder,
  SellerOrderStatus,
  updateSellerOrderStatus,
} from "../../../State/Seller/sellerOrderThunks";

type StatusFilter = "ALL" | SellerOrderStatus | "ACTIVE";

const orderStatusOptions: SellerOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const getNextStatusOptions = (status?: SellerOrderStatus): SellerOrderStatus[] => {
  switch ((status || "PENDING").toUpperCase() as SellerOrderStatus) {
    case "PENDING":
    case "PLACED":
      return ["CONFIRMED", "CANCELLED"];
    case "CONFIRMED":
      return ["SHIPPED", "CANCELLED"];
    case "SHIPPED":
      return ["OUT_FOR_DELIVERY"];
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED"];
    default:
      return [];
  }
};

const OrderTable = () => {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useAppSelector((state) => state.sellerOrder);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<SellerOrderStatus | null>(null);
  const [viewOrder, setViewOrder] = useState<SellerOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  const orderStats = useMemo(() => {
    const delivered = orders.filter((order) => order.orderStatus === "DELIVERED");
    return {
      total: orders.length,
      active: orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.orderStatus)).length,
      delivered: delivered.length,
      cancelled: orders.filter((order) => order.orderStatus === "CANCELLED").length,
      deliveredRevenue: delivered.reduce(
        (total, order) => total + Number(order.totalSellingPrice || 0),
        0,
      ),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const status = (order.orderStatus || "").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !["DELIVERED", "CANCELLED"].includes(status)) ||
        status === statusFilter;

      const items = order.orderItems || [];
      const searchableText = [
        String(order.id || ""),
        order.user?.fullName || "",
        order.user?.email || "",
        order.shippingAddress?.name || "",
        ...items.map((item) => item?.product?.title || ""),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [orders, searchQuery, statusFilter]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
    orderStatus: SellerOrderStatus,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
    setSelectedOrderStatus(orderStatus);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderId(null);
    setSelectedOrderStatus(null);
  };

  const handleStatusUpdate = async (orderStatus: SellerOrderStatus) => {
    if (!selectedOrderId) return;
    await dispatch(updateSellerOrderStatus({ orderId: selectedOrderId, orderStatus })).unwrap();
    await dispatch(fetchSellerOrders()).unwrap();
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED":
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "info";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getOrderDate = (order: SellerOrder) => {
    const raw = order.createdAt || order.orderDate;
    if (!raw) return "-";
    return new Date(raw).toLocaleDateString();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { title: "Total Orders", value: orderStats.total, tone: "bg-slate-50 text-slate-700 border-slate-100" },
          { title: "Active", value: orderStats.active, tone: "bg-blue-50 text-blue-700 border-blue-100" },
          { title: "Delivered", value: orderStats.delivered, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { title: "Cancelled", value: orderStats.cancelled, tone: "bg-rose-50 text-rose-700 border-rose-100" },
          {
            title: "Delivered Revenue",
            value: `Rs ${orderStats.deliveredRevenue}`,
            tone: "bg-violet-50 text-violet-700 border-violet-100",
          },
        ].map((stat) => (
          <div key={stat.title} className={`rounded-3xl border p-5 shadow-sm ${stat.tone}`}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Orders</p>
            <p className="mt-3 text-sm font-semibold opacity-80">{stat.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid #eef2f7", boxShadow: "none" }}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Order Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track fulfilment, review buyer details, and update shipment status.
            </Typography>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TextField
              size="small"
              placeholder="Search by order id, customer or product"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All Orders</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              {orderStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ borderRadius: "20px", boxShadow: "none", border: "1px solid #eef2f7" }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#2563eb" }}>
                        #{order.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Payment: {order.paymentStatus || "PENDING"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.user?.fullName || order.shippingAddress?.name || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.user?.email || order.user?.mobileNumber || order.shippingAddress?.mobileNumber || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.totalItems || order.orderItems?.length || 0} items
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(order.orderItems || [])
                          .slice(0, 2)
                          .map((item) => item?.product?.title || "Product")
                          .join(", ") || "No item details"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Rs {order.totalSellingPrice}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        MRP Rs {order.totalMrpPrice}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.orderStatus}
                        color={getStatusColor(order.orderStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getOrderDate(order)}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          variant="text"
                          onClick={() => setViewOrder(order)}
                        >
                          View
                        </Button>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, order.id, order.orderStatus)}
                          disabled={getNextStatusOptions(order.orderStatus).length === 0}
                        >
                          <MoreVert />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {getNextStatusOptions(selectedOrderStatus || undefined).map((status) => (
          <MenuItem key={status} onClick={() => handleStatusUpdate(status)}>
            Mark as {status}
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={Boolean(viewOrder)} onClose={() => setViewOrder(null)} fullWidth maxWidth="md">
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {viewOrder && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Paper sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #eef2f7" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                    Order Summary
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Order ID:</strong> #{viewOrder.id}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {viewOrder.orderStatus}</Typography>
                    <Typography variant="body2"><strong>Payment Status:</strong> {viewOrder.paymentStatus || "PENDING"}</Typography>
                    <Typography variant="body2"><strong>Total Items:</strong> {viewOrder.totalItems || viewOrder.orderItems?.length || 0}</Typography>
                    <Typography variant="body2"><strong>Total Selling:</strong> Rs {viewOrder.totalSellingPrice}</Typography>
                    <Typography variant="body2"><strong>Total MRP:</strong> Rs {viewOrder.totalMrpPrice}</Typography>
                    <Typography variant="body2"><strong>Created:</strong> {getOrderDate(viewOrder)}</Typography>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #eef2f7" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                    Shipping Details
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Name:</strong> {viewOrder.shippingAddress?.name || "N/A"}</Typography>
                    <Typography variant="body2"><strong>Mobile:</strong> {viewOrder.shippingAddress?.mobileNumber || "N/A"}</Typography>
                    <Typography variant="body2">
                      <strong>Address:</strong>{" "}
                      {[
                        viewOrder.shippingAddress?.address,
                        viewOrder.shippingAddress?.locality,
                        viewOrder.shippingAddress?.city,
                        viewOrder.shippingAddress?.state,
                        viewOrder.shippingAddress?.pinCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </Typography>
                  </Stack>
                </Paper>
              </div>

              <Paper sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #eef2f7" }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>
                  Order Items
                </Typography>

                {(viewOrder.orderItems || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No item details available.
                  </Typography>
                ) : (
                  <div className="space-y-3">
                    {(viewOrder.orderItems || []).map((item: any, index: number) => (
                      <div
                        key={item.id || index}
                        className="rounded-2xl border border-gray-100 p-4"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.product?.title || "Product"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.product?.description || "No description"}
                            </Typography>
                          </div>
                          <Chip size="small" label={`Qty ${item.quantity || 0}`} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                          <span>Size: {item.size || "-"}</span>
                          <span>Price: Rs {item.sellingPrice || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Paper>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrderTable;

