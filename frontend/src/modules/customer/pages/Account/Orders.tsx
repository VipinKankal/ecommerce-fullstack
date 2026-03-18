import React, { useEffect, useMemo, useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { useNavigate } from "react-router-dom";
import { userOrderHistory } from "../../../State/Backend/MasterApiThunks";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import OrderItem from "./OrderItem";

type ProductLite = {
  id: number;
  title?: string;
  description?: string;
  images?: string[];
};

type OrderItemLite = {
  id?: number;
  product?: ProductLite;
  size?: string;
};

type OrderLite = {
  id: number;
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  deliveryTaskStatus?: string;
  deliveryStatusReason?: string;
  orderDate?: string;
  cancelledAt?: string;
  cancelReasonText?: string;
  deliveryWindow?: string;
  orderItems?: OrderItemLite[];
};

const deriveDisplayStatus = (order: OrderLite) => {
  const shipmentStatus = (order.shipmentStatus || "").toUpperCase();
  const deliveryTaskStatus = (order.deliveryTaskStatus || "").toUpperCase();
  const orderStatus = (order.orderStatus || "PENDING").toUpperCase();
  const fulfillmentStatus = (order.fulfillmentStatus || "").toUpperCase();

  if (orderStatus === "CANCELLED") return "CANCELLED";
  if (shipmentStatus === "DELIVERED" || orderStatus === "DELIVERED") return "DELIVERED";
  if (deliveryTaskStatus === "CONFIRMATION_PENDING") return "CONFIRMATION_PENDING";
  if (deliveryTaskStatus === "ARRIVED") return "ARRIVED_AT_LOCATION";
  if (shipmentStatus === "OUT_FOR_DELIVERY" || deliveryTaskStatus === "OUT_FOR_DELIVERY") return "OUT_FOR_DELIVERY";
  if (["IN_TRANSIT", "HANDED_TO_COURIER"].includes(shipmentStatus)) return "SHIPPED";
  if (fulfillmentStatus === "FULFILLED") return "PACKED";
  if (orderStatus === "CONFIRMED") return "CONFIRMED";
  return orderStatus;
};

const isInProgressStatus = (status: string) => !["DELIVERED", "CANCELLED"].includes(status);

const Orders = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, responses } = useAppSelector((state) => state.masterApi);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DELIVERED" | "CANCELLED" | "IN_PROGRESS">("ALL");

  const orders = (responses.userOrderHistory || []) as OrderLite[];

  useEffect(() => {
    dispatch(userOrderHistory());
    const intervalId = window.setInterval(() => {
      dispatch(userOrderHistory());
    }, 30000);
    const handleFocus = () => dispatch(userOrderHistory());
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [dispatch]);

  const handleOpenOrder = (orderId: number, orderItemId?: number) => {
    if (orderItemId) {
      navigate(`/account/orders/${orderId}/${orderItemId}`);
      return;
    }
    navigate(`/account/orders/${orderId}`);
  };

  const formatStatusDate = (order: OrderLite) => {
    const raw = (order.orderStatus || "").toUpperCase() === "CANCELLED"
      ? order.cancelledAt || order.orderDate
      : order.orderDate;
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredOrders = useMemo(() => {
    return orders
      .map((order) => {
        const displayStatus = deriveDisplayStatus(order);
        return {
          ...order,
          displayStatus,
          orderItems: (order.orderItems || []).filter((item) => {
            const title = (item.product?.title || "").toLowerCase();
            const desc = (item.product?.description || "").toLowerCase();
            const textMatch =
              query.trim() === "" ||
              title.includes(query.toLowerCase()) ||
              desc.includes(query.toLowerCase());

            const statusMatch =
              statusFilter === "ALL" ||
              (statusFilter === "IN_PROGRESS" && isInProgressStatus(displayStatus)) ||
              displayStatus === statusFilter;

            return textMatch && statusMatch;
          }),
        };
      })
      .filter((order) => (order.orderItems || []).length > 0);
  }, [orders, query, statusFilter]);

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500">Live tracking updates now follow shipment and courier task milestones.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
          placeholder="Search in orders"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="relative">
          <TuneOutlinedIcon className="absolute left-2 top-2.5 text-gray-500" sx={{ fontSize: 18 }} />
          <select
            className="border border-gray-300 rounded pl-7 pr-2 py-2 text-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Filter</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading && orders.length === 0 && (
        <div className="py-10 flex justify-center">
          <CircularProgress />
        </div>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && filteredOrders.length === 0 && (
        <p className="text-gray-500">No orders found yet.</p>
      )}

      <div className="space-y-4">
        {filteredOrders.flatMap((order) =>
          (order.orderItems || []).map((item) => (
            <OrderItem
              key={item.id || `${order.id}-${item.product?.id || "product"}`}
              id={item.id}
              orderId={order.id}
              title={item.product?.title || "Product"}
              description={item.product?.description}
              size={item.size}
              image={item.product?.images?.[0]}
              orderStatus={order.displayStatus}
              statusDate={formatStatusDate(order)}
              cancelReasonText={order.cancelReasonText || order.deliveryStatusReason}
              onOpen={handleOpenOrder}
            />
          )),
        )}
      </div>
    </div>
  );
};

export default Orders;
