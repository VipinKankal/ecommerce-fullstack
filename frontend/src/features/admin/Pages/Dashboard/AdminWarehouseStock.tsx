import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
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
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { adminProductsList } from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'shared/errors/apiError';

type AdminVariantRow = {
  id?: number;
  variantType?: string;
  variantValue?: string;
  size?: string;
  color?: string;
  sku?: string;
  price?: number;
  sellerStock?: number;
  warehouseStock?: number;
};

type AdminWarehouseRow = {
  id: number;
  title?: string;
  categoryName?: string;
  sellerName?: string;
  quantity?: number;
  sellerStock?: number;
  warehouseStock?: number;
  lowStockThreshold?: number;
  sellingPrice?: number;
  mrpPrice?: number;
  variants?: AdminVariantRow[];
};

type AdminTransferRow = {
  id: number;
  productId?: number;
  productTitle?: string;
  categoryName?: string;
  sellerId?: number;
  sellerName?: string;
  quantity?: number;
  status?: string;
  sellerNote?: string;
  adminNote?: string;
  rejectionReason?: string;
  pickupProofUrl?: string;
  receiveProofUrl?: string;
  sellerStock?: number;
  warehouseStock?: number;
  requestedAt?: string;
  approvedAt?: string;
  pickedUpAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
  pickupMode?: string;
  estimatedWeightKg?: number;
  packageCount?: number;
  preferredVehicle?: string;
  suggestedVehicle?: string;
  estimatedPickupHours?: number;
  estimatedLogisticsCharge?: number;
  packageType?: string;
  pickupReadyAt?: string;
  pickupAddressVerified?: boolean;
  transportMode?: string;
  assignedCourierName?: string;
  transporterName?: string;
  invoiceNumber?: string;
  challanNumber?: string;
};

type AdminDemandProductRow = {
  productId?: number;
  productTitle?: string;
  warehouseStock?: number;
  sellerStock?: number;
  subscribedCount?: number;
  notifiedCount?: number;
  convertedCount?: number;
  latestSubscribedAt?: string;
  latestNotifiedAt?: string;
};

type AdminDemandNotificationRow = {
  id: number;
  productId?: number;
  productTitle?: string;
  userId?: number;
  status?: string;
  note?: string;
  createdAt?: string;
};

type AdminDemandInsights = {
  pendingSubscribers?: number;
  notifiedSubscribers?: number;
  convertedSubscribers?: number;
  demandProducts?: AdminDemandProductRow[];
  recentNotifications?: AdminDemandNotificationRow[];
};

type AdminMovementRow = {
  id: number;
  action?: string;
  from?: string;
  to?: string;
  quantity?: number;
  movementType?: string;
  orderStatus?: string;
  requestId?: number;
  requestType?: string;
  addedBy?: string;
  updatedBy?: string;
  note?: string;
  createdAt?: string;
};

type StockFilter =
  | 'ALL'
  | 'READY'
  | 'LOW'
  | 'AWAITING_TRANSFER'
  | 'OUT_OF_STOCK';

type ProductDialogMode = 'adjust' | 'movements' | 'notify' | null;
type TransferActionMode = 'approve' | 'reject' | 'plan' | 'pickup' | 'receive' | null;

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const prettify = (value?: string | null) => (value || '-').replaceAll('_', ' ');

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const offset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
};



const variantLabel = (variant: AdminVariantRow) => {
  if (variant.size) return variant.size;
  if (variant.variantValue) return variant.variantValue;
  if (variant.sku) return variant.sku;
  return `Variant #${variant.id ?? '-'}`;
};

const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const AdminWarehouseStock = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [transfers, setTransfers] = useState<AdminTransferRow[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<AdminTransferRow | null>(
    null,
  );
  const [transferActionMode, setTransferActionMode] =
    useState<TransferActionMode>(null);
  const [transferActionId, setTransferActionId] = useState<number | null>(null);
  const [transferActionNote, setTransferActionNote] = useState('');
  const [transferPlanWeightKg, setTransferPlanWeightKg] = useState('');
  const [transferPlanPackageCount, setTransferPlanPackageCount] = useState('');
  const [transferPlanPackageType, setTransferPlanPackageType] = useState('');
  const [transferPlanReadyAt, setTransferPlanReadyAt] = useState('');
  const [transferPlanAddressVerified, setTransferPlanAddressVerified] = useState<'YES' | 'NO'>('YES');
  const [transferPlanTransportMode, setTransferPlanTransportMode] = useState<'INTERNAL_COURIER' | 'EXTERNAL_TRANSPORT'>('INTERNAL_COURIER');
  const [transferPlanCourierName, setTransferPlanCourierName] = useState('');
  const [transferPlanTransporterName, setTransferPlanTransporterName] = useState('');
  const [transferPlanInvoiceNumber, setTransferPlanInvoiceNumber] = useState('');
  const [transferPlanChallanNumber, setTransferPlanChallanNumber] = useState('');

  const [demandInsights, setDemandInsights] = useState<AdminDemandInsights | null>(
    null,
  );
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<AdminWarehouseRow | null>(
    null,
  );
  const [productDialogMode, setProductDialogMode] =
    useState<ProductDialogMode>(null);
  const [inventoryActionLoading, setInventoryActionLoading] = useState(false);
  const [inventoryActionError, setInventoryActionError] = useState('');
  const [inventoryActionSuccess, setInventoryActionSuccess] = useState('');
  const [adjustVariantId, setAdjustVariantId] = useState('');
  const [adjustSellerStock, setAdjustSellerStock] = useState('');
  const [adjustWarehouseStock, setAdjustWarehouseStock] = useState('');
  const [adjustThreshold, setAdjustThreshold] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [notifyNote, setNotifyNote] = useState('');
  const [movements, setMovements] = useState<AdminMovementRow[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementError, setMovementError] = useState('');
  const [movementSearchQuery, setMovementSearchQuery] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');
  const [movementRequestTypeFilter, setMovementRequestTypeFilter] = useState('ALL');
  const [movementActorFilter, setMovementActorFilter] = useState('');
  const [movementDateFrom, setMovementDateFrom] = useState('');
  const [movementDateTo, setMovementDateTo] = useState('');

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const products = useMemo(() => {
    const rows = Array.isArray(responses.adminProductsList)
      ? (responses.adminProductsList as AdminWarehouseRow[])
      : [];

    return rows.map((row) => ({
      ...row,
      sellerStock: safeNumber(row.sellerStock),
      warehouseStock: safeNumber(row.warehouseStock ?? row.quantity),
      lowStockThreshold: safeNumber(
        row.lowStockThreshold,
        DEFAULT_LOW_STOCK_THRESHOLD,
      ),
      variants: Array.isArray(row.variants)
        ? row.variants.map((variant) => ({
            ...variant,
            sellerStock: safeNumber(variant.sellerStock),
            warehouseStock: safeNumber(variant.warehouseStock),
          }))
        : [],
    }));
  }, [responses.adminProductsList]);

  useEffect(() => {
    dispatch(adminProductsList());
  }, [dispatch]);

  const loadTransfers = async () => {
    setTransferLoading(true);
    setTransferError('');
    try {
      const response = await api.get(API_ROUTES.admin.transfers.base);
      setTransfers(
        Array.isArray(response.data) ? (response.data as AdminTransferRow[]) : [],
      );
    } catch (requestError) {
      setTransferError(
        getErrorMessage(requestError, 'Failed to load transfer requests.'),
      );
    } finally {
      setTransferLoading(false);
    }
  };

  const loadDemandInsights = async () => {
    setDemandLoading(true);
    setDemandError('');
    try {
      const response = await api.get(API_ROUTES.admin.notifyDemand);
      setDemandInsights((response.data || {}) as AdminDemandInsights);
    } catch (requestError) {
      setDemandError(
        getErrorMessage(requestError, 'Failed to load demand insights.'),
      );
    } finally {
      setDemandLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
    loadDemandInsights();
  }, []);

  const demandByProductId = useMemo(() => {
    return new Map(
      (demandInsights?.demandProducts || []).map((item) => [
        String(item.productId ?? ''),
        item,
      ]),
    );
  }, [demandInsights?.demandProducts]);

  const warehouseStats = useMemo(() => {
    const totalWarehouseUnits = products.reduce(
      (sum, product) => sum + safeNumber(product.warehouseStock),
      0,
    );
    const sellerHeldUnits = products.reduce(
      (sum, product) => sum + safeNumber(product.sellerStock),
      0,
    );
    const lowStockCount = products.filter((product) => {
      const warehouseStock = safeNumber(product.warehouseStock);
      const threshold = safeNumber(
        product.lowStockThreshold,
        DEFAULT_LOW_STOCK_THRESHOLD,
      );
      return warehouseStock > 0 && warehouseStock <= threshold;
    }).length;
    const awaitingTransferCount = products.filter(
      (product) =>
        safeNumber(product.warehouseStock) <= 0 &&
        safeNumber(product.sellerStock) > 0,
    ).length;
    const outOfStockCount = products.filter(
      (product) =>
        safeNumber(product.warehouseStock) <= 0 &&
        safeNumber(product.sellerStock) <= 0,
    ).length;
    const variantTrackedCount = products.filter(
      (product) => (product.variants || []).length > 0,
    ).length;
    const variantLowStockCount = products.reduce((sum, product) => {
      const threshold = safeNumber(
        product.lowStockThreshold,
        DEFAULT_LOW_STOCK_THRESHOLD,
      );
      return (
        sum +
        (product.variants || []).filter((variant) => {
          const warehouseStock = safeNumber(variant.warehouseStock);
          return warehouseStock <= threshold;
        }).length
      );
    }, 0);

    return {
      totalWarehouseUnits,
      sellerHeldUnits,
      lowStockCount,
      awaitingTransferCount,
      outOfStockCount,
      variantTrackedCount,
      variantLowStockCount,
      demandActiveCount: (demandInsights?.demandProducts || []).filter(
        (item) => safeNumber(item.subscribedCount) > 0,
      ).length,
    };
  }, [demandInsights?.demandProducts, products]);

  const filteredProducts = useMemo(() => {
    const search = deferredSearchQuery.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !search ||
          product.title?.toLowerCase().includes(search) ||
          product.categoryName?.toLowerCase().includes(search) ||
          product.sellerName?.toLowerCase().includes(search) ||
          String(product.id).includes(search) ||
          (product.variants || []).some((variant) =>
            variantLabel(variant).toLowerCase().includes(search),
          );

        if (!matchesSearch) return false;

        const warehouseStock = safeNumber(product.warehouseStock);
        const sellerStock = safeNumber(product.sellerStock);
        const threshold = safeNumber(
          product.lowStockThreshold,
          DEFAULT_LOW_STOCK_THRESHOLD,
        );

        if (stockFilter === 'READY') {
          return warehouseStock > threshold;
        }
        if (stockFilter === 'LOW') {
          return warehouseStock > 0 && warehouseStock <= threshold;
        }
        if (stockFilter === 'AWAITING_TRANSFER') {
          return warehouseStock <= 0 && sellerStock > 0;
        }
        if (stockFilter === 'OUT_OF_STOCK') {
          return warehouseStock <= 0 && sellerStock <= 0;
        }
        return true;
      })
      .sort(
        (left, right) =>
          safeNumber(left.warehouseStock) - safeNumber(right.warehouseStock),
      );
  }, [deferredSearchQuery, products, stockFilter]);

  const demandProducts = useMemo(() => {
    return [...(demandInsights?.demandProducts || [])]
      .map((item) => {
        const product = products.find(
          (entry) => String(entry.id) === String(item.productId),
        );
        const threshold = safeNumber(
          product?.lowStockThreshold,
          DEFAULT_LOW_STOCK_THRESHOLD,
        );
        const warehouseStock = safeNumber(item.warehouseStock);
        const sellerStock = safeNumber(item.sellerStock);
        const waiting = safeNumber(item.subscribedCount);
        const notified = safeNumber(item.notifiedCount);
        const converted = safeNumber(item.convertedCount);
        const shortage = Math.max(threshold - warehouseStock, 0);
        const priorityScore =
          waiting * 10 +
          notified * 4 +
          converted * 3 +
          shortage * 2 +
          (warehouseStock <= 0 ? 8 : 0) +
          (sellerStock > 0 ? 2 : 0);

        return {
          ...item,
          threshold,
          priorityScore,
          suggestion:
            sellerStock > 0
              ? `Pull ${Math.min(Math.max(waiting, threshold), sellerStock)} units from seller`
              : 'Wait for seller restock',
        };
      })
      .sort((left, right) => right.priorityScore - left.priorityScore);
  }, [demandInsights?.demandProducts, products]);

  const getStockLabel = (product: AdminWarehouseRow) => {
    const warehouseStock = safeNumber(product.warehouseStock);
    const sellerStock = safeNumber(product.sellerStock);
    const threshold = safeNumber(
      product.lowStockThreshold,
      DEFAULT_LOW_STOCK_THRESHOLD,
    );

    if (warehouseStock <= 0 && sellerStock > 0) {
      return {
        label: 'Awaiting Transfer',
        color: 'warning' as const,
        note: 'Seller has stock but warehouse is empty',
      };
    }
    if (warehouseStock <= 0) {
      return {
        label: 'Out of Stock',
        color: 'error' as const,
        note: 'No seller or warehouse stock available',
      };
    }
    if (warehouseStock <= threshold) {
      return {
        label: 'Low Stock',
        color: 'warning' as const,
        note: `Threshold ${threshold} reached`,
      };
    }
    return {
      label: 'Ready to Sell',
      color: 'success' as const,
      note: 'Warehouse can fulfill customer orders',
    };
  };

  const getVariantSignals = (
    product: AdminWarehouseRow,
  ): Array<{
    id: string;
    label: string;
    color: 'warning' | 'error';
    note: string;
  }> => {
    const threshold = safeNumber(
      product.lowStockThreshold,
      DEFAULT_LOW_STOCK_THRESHOLD,
    );

    return (product.variants || [])
      .map((variant) => {
        const warehouseStock = safeNumber(variant.warehouseStock);
        const sellerStock = safeNumber(variant.sellerStock);
        const label = variantLabel(variant);

        if (warehouseStock <= 0 && sellerStock > 0) {
          return {
            id: `${product.id}-${variant.id}-${label}`,
            label: `${label}: transfer`,
            color: 'warning' as const,
            note: 'Seller has stock but variant is empty in warehouse',
          };
        }
        if (warehouseStock <= 0) {
          return {
            id: `${product.id}-${variant.id}-${label}`,
            label: `${label}: out`,
            color: 'error' as const,
            note: 'Variant is fully out of stock',
          };
        }
        if (warehouseStock <= threshold) {
          return {
            id: `${product.id}-${variant.id}-${label}`,
            label: `${label}: ${warehouseStock} left`,
            color: 'warning' as const,
            note: `Variant is under threshold ${threshold}`,
          };
        }
        return null;
      })
      .filter(
        (
          signal,
        ): signal is {
          id: string;
          label: string;
          color: 'warning' | 'error';
          note: string;
        } => Boolean(signal),
      );
  };

  const inventoryAlerts = useMemo(() => {
    return products
      .map((product) => {
        const demand = demandByProductId.get(String(product.id));
        const waiting = safeNumber(demand?.subscribedCount);
        const threshold = safeNumber(
          product.lowStockThreshold,
          DEFAULT_LOW_STOCK_THRESHOLD,
        );
        const warehouseStock = safeNumber(product.warehouseStock);
        const sellerStock = safeNumber(product.sellerStock);
        const suggestionQty = Math.min(
          Math.max(waiting, threshold),
          Math.max(sellerStock, 0),
        );

        if (warehouseStock <= 0 && sellerStock > 0) {
          return {
            id: product.id,
            severity: 'warning' as const,
            title: product.title || `Product #${product.id}`,
            headline: 'Warehouse empty but seller has stock',
            detail:
              waiting > 0
                ? `${waiting} users are waiting. Suggested transfer: ${suggestionQty} units.`
                : `Suggested transfer: ${Math.max(threshold, 1)} units.`,
          };
        }

        if (warehouseStock <= 0 && waiting > 0) {
          return {
            id: product.id,
            severity: 'error' as const,
            title: product.title || `Product #${product.id}`,
            headline: 'Demand exists but item is fully out of stock',
            detail: `${waiting} subscribed users are waiting for restock.`,
          };
        }

        if (warehouseStock > 0 && warehouseStock <= threshold) {
          return {
            id: product.id,
            severity: 'warning' as const,
            title: product.title || `Product #${product.id}`,
            headline: 'Low warehouse stock',
            detail:
              waiting > 0
                ? `${warehouseStock} units left with ${waiting} users waiting.`
                : `${warehouseStock} units left. Threshold is ${threshold}.`,
          };
        }

        return null;
      })
      .filter(Boolean)
      .slice(0, 8) as Array<{
      id: number;
      severity: 'warning' | 'error';
      title: string;
      headline: string;
      detail: string;
    }>;
  }, [demandByProductId, products]);

  const movementTypeOptions = useMemo(() => {
    return Array.from(
      new Set(
        movements
          .map((movement) => (movement.movementType || '').trim())
          .filter(Boolean),
      ),
    ).sort();
  }, [movements]);

  const movementRequestTypeOptions = useMemo(() => {
    return Array.from(
      new Set(
        movements
          .map((movement) => (movement.requestType || '').trim())
          .filter(Boolean),
      ),
    ).sort();
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const query = movementSearchQuery.trim().toLowerCase();
    const actorQuery = movementActorFilter.trim().toLowerCase();

    return movements.filter((movement) => {
      const createdAt = movement.createdAt ? new Date(movement.createdAt) : null;
      const createdAtTime =
        createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getTime() : null;
      const fromBoundary = movementDateFrom
        ? new Date(`${movementDateFrom}T00:00:00`).getTime()
        : null;
      const toBoundary = movementDateTo
        ? new Date(`${movementDateTo}T23:59:59`).getTime()
        : null;

      const matchesQuery =
        !query ||
        [
          movement.action,
          movement.movementType,
          movement.requestType,
          movement.orderStatus,
          movement.from,
          movement.to,
          movement.note,
          String(movement.requestId ?? ''),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesMovementType =
        movementTypeFilter === 'ALL' ||
        String(movement.movementType || '') === movementTypeFilter;
      const matchesRequestType =
        movementRequestTypeFilter === 'ALL' ||
        String(movement.requestType || '') === movementRequestTypeFilter;
      const matchesActor =
        !actorQuery ||
        [movement.addedBy, movement.updatedBy]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(actorQuery));
      const matchesDateFrom =
        fromBoundary === null ||
        (createdAtTime !== null && createdAtTime >= fromBoundary);
      const matchesDateTo =
        toBoundary === null || (createdAtTime !== null && createdAtTime <= toBoundary);

      return (
        matchesQuery &&
        matchesMovementType &&
        matchesRequestType &&
        matchesActor &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    movementActorFilter,
    movementDateFrom,
    movementDateTo,
    movementRequestTypeFilter,
    movementSearchQuery,
    movementTypeFilter,
    movements,
  ]);

  const openAdjustDialog = (product: AdminWarehouseRow) => {
    setSelectedProduct(product);
    setProductDialogMode('adjust');
    setInventoryActionError('');
    setInventoryActionSuccess('');
    setAdjustVariantId('');
    setAdjustSellerStock(String(safeNumber(product.sellerStock)));
    setAdjustWarehouseStock(String(safeNumber(product.warehouseStock)));
    setAdjustThreshold(
      String(
        safeNumber(product.lowStockThreshold, DEFAULT_LOW_STOCK_THRESHOLD),
      ),
    );
    setAdjustNote('Admin stock adjustment');
  };

  const openMovementsDialog = async (product: AdminWarehouseRow) => {
    setSelectedProduct(product);
    setProductDialogMode('movements');
    setMovementLoading(true);
    setMovementError('');
    setMovements([]);
    setMovementSearchQuery('');
    setMovementTypeFilter('ALL');
    setMovementRequestTypeFilter('ALL');
    setMovementActorFilter('');
    setMovementDateFrom('');
    setMovementDateTo('');
    try {
      const response = await api.get(API_ROUTES.admin.inventory.movements(product.id));
      setMovements(
        Array.isArray(response.data) ? (response.data as AdminMovementRow[]) : [],
      );
    } catch (requestError) {
      setMovementError(
        getErrorMessage(requestError, 'Failed to load inventory movements.'),
      );
    } finally {
      setMovementLoading(false);
    }
  };

  const openNotifyDialog = (product: AdminWarehouseRow) => {
    setSelectedProduct(product);
    setProductDialogMode('notify');
    setInventoryActionError('');
    setInventoryActionSuccess('');
    setNotifyNote('Warehouse stock is back. Triggering manual notify run.');
  };

  useEffect(() => {
    if (productDialogMode !== 'adjust' || !selectedProduct) {
      return;
    }

    const selectedVariant = (selectedProduct.variants || []).find(
      (variant) => String(variant.id) === adjustVariantId,
    );

    if (selectedVariant) {
      setAdjustSellerStock(String(safeNumber(selectedVariant.sellerStock)));
      setAdjustWarehouseStock(String(safeNumber(selectedVariant.warehouseStock)));
      return;
    }

    setAdjustSellerStock(String(safeNumber(selectedProduct.sellerStock)));
    setAdjustWarehouseStock(String(safeNumber(selectedProduct.warehouseStock)));
  }, [adjustVariantId, productDialogMode, selectedProduct]);

  const refreshWarehouseData = async () => {
    await Promise.all([
      dispatch(adminProductsList()).unwrap(),
      loadTransfers(),
      loadDemandInsights(),
    ]);
  };

  const submitInventoryAdjustment = async () => {
    if (!selectedProduct) return;
    setInventoryActionLoading(true);
    setInventoryActionError('');
    setInventoryActionSuccess('');
    try {
      await api.patch(API_ROUTES.admin.inventory.adjust(selectedProduct.id), {
        variantId: adjustVariantId || undefined,
        sellerStock:
          adjustSellerStock.trim() === '' ? undefined : Number(adjustSellerStock),
        warehouseStock:
          adjustWarehouseStock.trim() === ''
            ? undefined
            : Number(adjustWarehouseStock),
        lowStockThreshold:
          adjustThreshold.trim() === '' ? undefined : Number(adjustThreshold),
        note: adjustNote.trim() || undefined,
      });
      setInventoryActionSuccess('Inventory updated successfully.');
      await refreshWarehouseData();
    } catch (requestError) {
      setInventoryActionError(
        getErrorMessage(requestError, 'Failed to update inventory.'),
      );
    } finally {
      setInventoryActionLoading(false);
    }
  };

  const submitManualNotify = async () => {
    if (!selectedProduct) return;
    setInventoryActionLoading(true);
    setInventoryActionError('');
    setInventoryActionSuccess('');
    try {
      await api.post(API_ROUTES.admin.inventory.triggerNotify(selectedProduct.id), {
        note: notifyNote.trim() || undefined,
      });
      setInventoryActionSuccess('Manual notify trigger completed.');
      await loadDemandInsights();
    } catch (requestError) {
      setInventoryActionError(
        getErrorMessage(requestError, 'Failed to trigger notifications.'),
      );
    } finally {
      setInventoryActionLoading(false);
    }
  };

  const openTransferActionDialog = (
    transfer: AdminTransferRow,
    mode: TransferActionMode,
  ) => {
    setSelectedTransfer(transfer);
    setTransferActionMode(mode);
    setTransferActionNote(
      mode === 'reject' ? transfer.rejectionReason || '' : transfer.adminNote || '',
    );
    if (mode === 'plan') {
      setTransferPlanWeightKg(
        transfer.estimatedWeightKg ? String(transfer.estimatedWeightKg) : '',
      );
      setTransferPlanPackageCount(
        transfer.packageCount ? String(transfer.packageCount) : '',
      );
      setTransferPlanPackageType(transfer.packageType || '');
      setTransferPlanReadyAt(toDateTimeLocalValue(transfer.pickupReadyAt));
      setTransferPlanAddressVerified(
        transfer.pickupAddressVerified === false ? 'NO' : 'YES',
      );
      setTransferPlanTransportMode(
        transfer.transportMode === 'EXTERNAL_TRANSPORT'
          ? 'EXTERNAL_TRANSPORT'
          : 'INTERNAL_COURIER',
      );
      setTransferPlanCourierName(transfer.assignedCourierName || '');
      setTransferPlanTransporterName(transfer.transporterName || '');
      setTransferPlanInvoiceNumber(transfer.invoiceNumber || '');
      setTransferPlanChallanNumber(transfer.challanNumber || '');
    }
  };

  const transferActionLabels = (transfer: AdminTransferRow) => {
    const status = (transfer.status || '').toUpperCase();
    const pickupMode = (transfer.pickupMode || 'WAREHOUSE_PICKUP').toUpperCase();
    const hasPickupPlan =
      pickupMode === 'SELLER_DROP'
        ? true
        : Boolean(
            transfer.transportMode &&
              (transfer.transportMode === 'INTERNAL_COURIER'
                ? transfer.assignedCourierName
                : transfer.transporterName),
          );

    switch ((status || '').toUpperCase()) {
      case 'TRANSFER_PENDING':
        return { primary: 'approve', secondary: 'reject' };
      case 'TRANSFER_APPROVED':
        if (pickupMode === 'SELLER_DROP') {
          return { primary: 'receive', secondary: null };
        }
        return hasPickupPlan
          ? { primary: 'pickup', secondary: 'plan' }
          : { primary: 'plan', secondary: null };
      case 'PICKED_UP':
        return { primary: 'receive', secondary: null };
      default:
        return { primary: null, secondary: null };
    }
  };

  const submitTransferAction = async () => {
    if (!selectedTransfer || !transferActionMode) return;

    const route =
      transferActionMode === 'approve'
        ? API_ROUTES.admin.transfers.approve(selectedTransfer.id)
        : transferActionMode === 'reject'
          ? API_ROUTES.admin.transfers.reject(selectedTransfer.id)
          : transferActionMode === 'plan'
            ? API_ROUTES.admin.transfers.plan(selectedTransfer.id)
          : transferActionMode === 'pickup'
            ? API_ROUTES.admin.transfers.pickup(selectedTransfer.id)
            : API_ROUTES.admin.transfers.receive(selectedTransfer.id);

    if (transferActionMode === 'plan') {
      if (
        transferPlanWeightKg.trim() === '' ||
        Number(transferPlanWeightKg) <= 0 ||
        transferPlanPackageCount.trim() === '' ||
        Number(transferPlanPackageCount) <= 0 ||
        transferPlanReadyAt.trim() === ''
      ) {
        setTransferError(
          'Weight, package count and ready date are required for warehouse pickup planning.',
        );
        return;
      }
      if (
        transferPlanTransportMode === 'INTERNAL_COURIER' &&
        transferPlanCourierName.trim() === ''
      ) {
        setTransferError('Assigned courier name is required for internal courier mode.');
        return;
      }
      if (
        transferPlanTransportMode === 'EXTERNAL_TRANSPORT' &&
        transferPlanTransporterName.trim() === ''
      ) {
        setTransferError('Transporter name is required for external transport mode.');
        return;
      }
    }

    const payload =
      transferActionMode === 'reject'
        ? { reason: transferActionNote.trim() || undefined }
        : transferActionMode === 'plan'
          ? {
              estimatedWeightKg: Number(transferPlanWeightKg),
              packageCount: Number(transferPlanPackageCount),
              packageType: transferPlanPackageType.trim() || undefined,
              pickupReadyAt: transferPlanReadyAt || undefined,
              pickupAddressVerified: transferPlanAddressVerified === 'YES',
              transportMode: transferPlanTransportMode,
              assignedCourierName:
                transferPlanTransportMode === 'INTERNAL_COURIER'
                  ? transferPlanCourierName.trim() || undefined
                  : undefined,
              transporterName:
                transferPlanTransportMode === 'EXTERNAL_TRANSPORT'
                  ? transferPlanTransporterName.trim() || undefined
                  : undefined,
              invoiceNumber: transferPlanInvoiceNumber.trim() || undefined,
              challanNumber: transferPlanChallanNumber.trim() || undefined,
              note: transferActionNote.trim() || undefined,
            }
          : { note: transferActionNote.trim() || undefined };

    setTransferActionId(selectedTransfer.id);
    setTransferError('');
    try {
      await api.post(route, payload);
      setTransferActionMode(null);
      setTransferActionNote('');
      setTransferPlanWeightKg('');
      setTransferPlanPackageCount('');
      setTransferPlanPackageType('');
      setTransferPlanReadyAt('');
      setTransferPlanAddressVerified('YES');
      setTransferPlanTransportMode('INTERNAL_COURIER');
      setTransferPlanCourierName('');
      setTransferPlanTransporterName('');
      setTransferPlanInvoiceNumber('');
      setTransferPlanChallanNumber('');
      await refreshWarehouseData();
    } catch (requestError) {
      setTransferError(getErrorMessage(requestError, 'Transfer action failed.'));
    } finally {
      setTransferActionId(null);
    }
  };

  const exportFilteredProducts = () => {
    const rows = [
      [
        'Product ID',
        'Title',
        'Seller',
        'Category',
        'Seller Stock',
        'Warehouse Stock',
        'Low Stock Threshold',
        'Status',
        'Variants',
      ],
      ...filteredProducts.map((product) => [
        String(product.id),
        product.title || '',
        product.sellerName || '',
        product.categoryName || '',
        String(safeNumber(product.sellerStock)),
        String(safeNumber(product.warehouseStock)),
        String(
          safeNumber(product.lowStockThreshold, DEFAULT_LOW_STOCK_THRESHOLD),
        ),
        getStockLabel(product).label,
        (product.variants || [])
          .map(
            (variant) =>
              `${variantLabel(variant)} [seller ${safeNumber(variant.sellerStock)}, warehouse ${safeNumber(variant.warehouseStock)}]`,
          )
          .join(' | '),
      ]),
    ];

    downloadCsv('warehouse-stock-export.csv', rows);
  };

  const exportTransfers = () => {
    const rows = [
      [
        'Transfer ID',
        'Product ID',
        'Product',
        'Seller',
        'Quantity',
        'Status',
        'Requested At',
        'Approved At',
        'Picked Up At',
        'Received At',
        'Rejection Reason',
      ],
      ...transfers.map((transfer) => [
        String(transfer.id),
        String(transfer.productId ?? ''),
        transfer.productTitle || '',
        transfer.sellerName || '',
        String(transfer.quantity ?? 0),
        transfer.status || '',
        transfer.requestedAt || '',
        transfer.approvedAt || '',
        transfer.pickedUpAt || '',
        transfer.receivedAt || '',
        transfer.rejectionReason || '',
      ]),
    ];

    downloadCsv('warehouse-transfer-export.csv', rows);
  };

  const exportDemandSnapshot = () => {
    const rows = [
      [
        'Product ID',
        'Product',
        'Warehouse Stock',
        'Seller Stock',
        'Waiting',
        'Notified',
        'Converted',
        'Priority Score',
        'Suggestion',
      ],
      ...demandProducts.map((item) => [
        String(item.productId ?? ''),
        item.productTitle || '',
        String(item.warehouseStock ?? 0),
        String(item.sellerStock ?? 0),
        String(item.subscribedCount ?? 0),
        String(item.notifiedCount ?? 0),
        String(item.convertedCount ?? 0),
        String(item.priorityScore ?? 0),
        item.suggestion || '',
      ]),
    ];

    downloadCsv('warehouse-demand-export.csv', rows);
  };

  const exportNotifyHistory = () => {
    const rows = [
      ['Log ID', 'Product ID', 'Product', 'User ID', 'Status', 'Note', 'Created At'],
      ...(demandInsights?.recentNotifications || []).map((item) => [
        String(item.id),
        String(item.productId ?? ''),
        item.productTitle || '',
        String(item.userId ?? ''),
        item.status || '',
        item.note || '',
        item.createdAt || '',
      ]),
    ];

    downloadCsv('notify-history-export.csv', rows);
  };

  const exportMovementLedger = () => {
    const rows = [
      [
        'When',
        'Action',
        'Movement Type',
        'Request Type',
        'Request ID',
        'Flow',
        'Qty',
        'Added By',
        'Updated By',
        'Note',
      ],
      ...filteredMovements.map((movement) => [
        movement.createdAt || '',
        movement.action || '',
        movement.movementType || '',
        movement.requestType || '',
        String(movement.requestId ?? ''),
        `${movement.from || '-'} to ${movement.to || '-'}`,
        String(movement.quantity ?? 0),
        movement.addedBy || '',
        movement.updatedBy || '',
        movement.note || '',
      ]),
    ];

    downloadCsv(
      `inventory-movements-${selectedProduct?.id || 'product'}.csv`,
      rows,
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Warehouse Stock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin control panel for inventory, transfers, demand, and movement
            tracking.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" onClick={loadTransfers} disabled={transferLoading}>
            Refresh Transfers
          </Button>
          <Button
            variant="outlined"
            onClick={loadDemandInsights}
            disabled={demandLoading}
          >
            Refresh Demand
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={exportFilteredProducts}
          >
            Export Inventory
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={exportTransfers}
            disabled={transfers.length === 0}
          >
            Export Transfers
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={exportDemandSnapshot}
            disabled={demandProducts.length === 0}
          >
            Export Demand
          </Button>
        </div>
      </div>

      {(error || transferError || demandError) && (
        <Alert severity="error">{error || transferError || demandError}</Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Warehouse Units
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.totalWarehouseUnits}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sellable inventory in warehouse
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Seller-Held Units
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.sellerHeldUnits}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supply waiting outside warehouse
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #fcd34d', bgcolor: '#fffbeb' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Low Stock SKUs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.lowStockCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Product-specific threshold based
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Variant Tracked
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {warehouseStats.variantTrackedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {warehouseStats.variantLowStockCount} low or empty variants flagged
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Inventory Control Board
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Product-level view with variant alerts, movement access, and admin-only actions.
            </Typography>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TextField
              size="small"
              placeholder="Search by title, category, seller, id or variant"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
              label="Stock View"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value as StockFilter)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="ALL">All Products</MenuItem>
              <MenuItem value="READY">Warehouse Ready</MenuItem>
              <MenuItem value="LOW">Low Stock</MenuItem>
              <MenuItem value="AWAITING_TRANSFER">Awaiting Transfer</MenuItem>
              <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
            </TextField>
          </div>
        </div>

        <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Variant Alerts</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No warehouse inventory matched the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const stockMeta = getStockLabel(product);
                  const variantSignals = getVariantSignals(product);

                  return (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {product.title || 'Product'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{product.id} | {product.categoryName || 'Uncategorized'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{product.sellerName || 'Seller'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Seller stock {safeNumber(product.sellerStock)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {safeNumber(product.warehouseStock)} units
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Threshold {safeNumber(product.lowStockThreshold, DEFAULT_LOW_STOCK_THRESHOLD)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {variantSignals.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {variantSignals.slice(0, 3).map((signal) => (
                              <Chip
                                key={signal.id}
                                size="small"
                                color={signal.color}
                                variant="filled"
                                label={signal.label}
                              />
                            ))}
                            {variantSignals.length > 3 && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`+${variantSignals.length - 3} more`}
                              />
                            )}
                          </div>
                        ) : (product.variants || []).length > 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            All tracked variants ready
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No variant tracking
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color={stockMeta.color} label={stockMeta.label} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                          {stockMeta.note}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditRoundedIcon />}
                            onClick={() => openAdjustDialog(product)}
                          >
                            Adjust
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HistoryRoundedIcon />}
                            onClick={() => openMovementsDialog(product)}
                          >
                            Movements
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<NotificationsActiveRoundedIcon />}
                            onClick={() => openNotifyDialog(product)}
                            disabled={safeNumber(product.warehouseStock) <= 0}
                          >
                            Notify
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Inventory Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Suggested restock and transfer actions ranked by urgency.
              </Typography>
            </div>
            <Chip
              label={`${inventoryAlerts.length} active`}
              color={inventoryAlerts.length ? 'warning' : 'success'}
              size="small"
            />
          </div>
          <div className="space-y-3">
            {inventoryAlerts.length === 0 ? (
              <Alert severity="success">No urgent warehouse alerts right now.</Alert>
            ) : (
              inventoryAlerts.map((alertItem) => (
                <Alert key={alertItem.id} severity={alertItem.severity}>
                  <strong>{alertItem.title}</strong>: {alertItem.headline}.{' '}
                  {alertItem.detail}
                </Alert>
              ))
            )}
          </div>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Demand Snapshot
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quick view of notify demand health.
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadRoundedIcon />}
                onClick={exportNotifyHistory}
                disabled={(demandInsights?.recentNotifications || []).length === 0}
              >
                Export Notify Log
              </Button>
              {demandLoading && <CircularProgress size={22} />}
            </div>
          </div>
          <div className="space-y-3">
            <Alert severity="info">
              {warehouseStats.demandActiveCount} products currently have at least
              one waiting subscriber.
            </Alert>
            {demandProducts.slice(0, 4).map((item) => (
              <div
                key={item.productId || item.productTitle}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.productTitle || 'Product'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{item.productId || '-'} | warehouse {item.warehouseStock ?? 0} |
                      seller {item.sellerStock ?? 0}
                    </Typography>
                  </div>
                  <Chip
                    size="small"
                    color={safeNumber(item.subscribedCount) > 0 ? 'warning' : 'success'}
                    label={`${item.subscribedCount ?? 0} waiting`}
                  />
                </div>
                <Typography variant="caption" color="text.secondary">
                  Priority score {item.priorityScore} | {item.suggestion}
                </Typography>
              </div>
            ))}
            <Divider />
            <div className="space-y-2">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Recent Notify Runs
              </Typography>
              {(demandInsights?.recentNotifications || []).length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No notify history logged yet.
                </Typography>
              ) : (
                (demandInsights?.recentNotifications || []).slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.productTitle || 'Product'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          User #{item.userId || '-'} | {formatDateTime(item.createdAt)}
                        </Typography>
                      </div>
                      <Chip
                        size="small"
                        color={item.status === 'NOTIFIED' ? 'success' : 'warning'}
                        label={prettify(item.status)}
                      />
                    </div>
                    <Typography variant="caption" color="text.secondary">
                      {item.note || 'Manual or automatic notify entry'}
                    </Typography>
                  </div>
                ))
              )}
            </div>
          </div>
        </Paper>
      </div>

      <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Inbound Transfer Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approve request, plan pickup for `WAREHOUSE_PICKUP`, then mark pickup
              and receive after physical intake.
            </Typography>
          </div>
          {transferLoading && <CircularProgress size={22} />}
        </div>

        <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!transferLoading && transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No warehouse transfer requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((transfer) => {
                  const labels = transferActionLabels(transfer);
                  const statusColor =
                    transfer.status === 'TRANSFER_COMPLETED'
                      ? 'success'
                      : transfer.status === 'TRANSFER_REJECTED'
                        ? 'error'
                        : transfer.status === 'TRANSFER_CANCELLED'
                          ? 'default'
                          : 'warning';

                  return (
                    <TableRow key={transfer.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {transfer.productTitle || 'Product'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{transfer.productId || transfer.id} | {transfer.categoryName || 'Uncategorized'}
                        </Typography>
                      </TableCell>
                      <TableCell>{transfer.sellerName || 'Seller'}</TableCell>
                      <TableCell>{transfer.quantity || 0}</TableCell>
                      <TableCell>
                        <Chip size="small" color={statusColor} label={prettify(transfer.status)} />
                      </TableCell>
                      <TableCell>{formatDateTime(transfer.requestedAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={() => setSelectedTransfer(transfer)}
                          >
                            View
                          </Button>
                          {labels.primary && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<LocalShippingRoundedIcon />}
                              onClick={() =>
                                openTransferActionDialog(
                                  transfer,
                                  labels.primary as TransferActionMode,
                                )
                              }
                              disabled={transferActionId === transfer.id}
                            >
                              {prettify(labels.primary)}
                            </Button>
                          )}
                          {labels.secondary && (
                            <Button
                              size="small"
                              color={labels.secondary === 'reject' ? 'error' : 'primary'}
                              variant="outlined"
                              onClick={() =>
                                openTransferActionDialog(
                                  transfer,
                                  labels.secondary as TransferActionMode,
                                )
                              }
                              disabled={transferActionId === transfer.id}
                            >
                              {prettify(labels.secondary)}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={productDialogMode === 'adjust' && !!selectedProduct}
        onClose={inventoryActionLoading ? undefined : () => setProductDialogMode(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Manual Stock Adjust</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {inventoryActionError && <Alert severity="error">{inventoryActionError}</Alert>}
            {inventoryActionSuccess && <Alert severity="success">{inventoryActionSuccess}</Alert>}
            <Typography variant="body2" color="text.secondary">
              {selectedProduct?.title} | Product #{selectedProduct?.id}
            </Typography>
            {(selectedProduct?.variants || []).length > 0 && (
              <TextField
                select
                fullWidth
                label="Variant"
                value={adjustVariantId}
                onChange={(event) => setAdjustVariantId(event.target.value)}
              >
                <MenuItem value="">Whole product</MenuItem>
                {(selectedProduct?.variants || []).map((variant) => (
                  <MenuItem key={variant.id} value={String(variant.id)}>
                    {variantLabel(variant)}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                fullWidth
                type="number"
                label="Seller stock"
                value={adjustSellerStock}
                onChange={(event) => setAdjustSellerStock(event.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Warehouse stock"
                value={adjustWarehouseStock}
                onChange={(event) => setAdjustWarehouseStock(event.target.value)}
              />
            </div>
            <TextField
              fullWidth
              type="number"
              label="Low stock threshold"
              value={adjustThreshold}
              onChange={(event) => setAdjustThreshold(event.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Adjustment note"
              value={adjustNote}
              onChange={(event) => setAdjustNote(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProductDialogMode(null)} disabled={inventoryActionLoading}>
            Close
          </Button>
          <Button variant="contained" onClick={submitInventoryAdjustment} disabled={inventoryActionLoading}>
            {inventoryActionLoading ? 'Saving...' : 'Save Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={productDialogMode === 'movements' && !!selectedProduct}
        onClose={() => setProductDialogMode(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Inventory Movement Ledger</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedProduct?.title} | Product #{selectedProduct?.id} | Product filter is
              already locked for this ledger.
            </Typography>
            {movementError && <Alert severity="error">{movementError}</Alert>}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <TextField
                size="small"
                label="Search"
                placeholder="Action, flow, request id, note"
                value={movementSearchQuery}
                onChange={(event) => setMovementSearchQuery(event.target.value)}
              />
              <TextField
                size="small"
                select
                label="Movement Type"
                value={movementTypeFilter}
                onChange={(event) => setMovementTypeFilter(event.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                {movementTypeOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {prettify(value)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                select
                label="Request Type"
                value={movementRequestTypeFilter}
                onChange={(event) => setMovementRequestTypeFilter(event.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                {movementRequestTypeOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {prettify(value)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Actor"
                placeholder="added by or updated by"
                value={movementActorFilter}
                onChange={(event) => setMovementActorFilter(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={movementDateFrom}
                  onChange={(event) => setMovementDateFrom(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  value={movementDateTo}
                  onChange={(event) => setMovementDateTo(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Typography variant="caption" color="text.secondary">
                Showing {filteredMovements.length} of {movements.length} movement entries.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadRoundedIcon />}
                onClick={exportMovementLedger}
                disabled={filteredMovements.length === 0}
              >
                Export Ledger
              </Button>
            </div>
            <TableContainer component={Paper} sx={{ borderRadius: '18px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>When</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Movement</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Request</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Flow</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actors</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movementLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        No movement history matched the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                        <TableCell>{prettify(movement.action)}</TableCell>
                        <TableCell>{prettify(movement.movementType)}</TableCell>
                        <TableCell>
                          {prettify(movement.requestType)}
                          {movement.requestId ? ` #${movement.requestId}` : ''}
                        </TableCell>
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
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProductDialogMode(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={productDialogMode === 'notify' && !!selectedProduct}
        onClose={inventoryActionLoading ? undefined : () => setProductDialogMode(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Manual Notify Trigger</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {inventoryActionError && <Alert severity="error">{inventoryActionError}</Alert>}
            {inventoryActionSuccess && <Alert severity="success">{inventoryActionSuccess}</Alert>}
            <Typography variant="body2" color="text.secondary">
              {selectedProduct?.title} | Product #{selectedProduct?.id}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Notification note"
              value={notifyNote}
              onChange={(event) => setNotifyNote(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProductDialogMode(null)} disabled={inventoryActionLoading}>
            Close
          </Button>
          <Button variant="contained" onClick={submitManualNotify} disabled={inventoryActionLoading}>
            {inventoryActionLoading ? 'Triggering...' : 'Trigger Notify'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!selectedTransfer && !!transferActionMode}
        onClose={transferActionId ? undefined : () => setTransferActionMode(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{prettify(transferActionMode)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedTransfer?.productTitle} | Transfer #{selectedTransfer?.id}
            </Typography>
            {transferActionMode === 'plan' && (
              <>
                <Alert severity="info">
                  Warehouse manager planning step: confirm weight/package, ready
                  date, address verification, and assign internal/external pickup.
                </Alert>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    fullWidth
                    type="number"
                    label="Estimated Weight (kg)"
                    value={transferPlanWeightKg}
                    onChange={(event) => setTransferPlanWeightKg(event.target.value)}
                    inputProps={{ min: 0.1, step: 0.1 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Package Count"
                    value={transferPlanPackageCount}
                    onChange={(event) =>
                      setTransferPlanPackageCount(event.target.value)
                    }
                    inputProps={{ min: 1, step: 1 }}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    fullWidth
                    label="Package Type"
                    value={transferPlanPackageType}
                    onChange={(event) => setTransferPlanPackageType(event.target.value)}
                    placeholder="Box, carton, pallet"
                  />
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Pickup Ready At"
                    value={transferPlanReadyAt}
                    onChange={(event) => setTransferPlanReadyAt(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    select
                    fullWidth
                    label="Pickup Address Verified"
                    value={transferPlanAddressVerified}
                    onChange={(event) =>
                      setTransferPlanAddressVerified(event.target.value as 'YES' | 'NO')
                    }
                  >
                    <MenuItem value="YES">Yes</MenuItem>
                    <MenuItem value="NO">No</MenuItem>
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Transport Mode"
                    value={transferPlanTransportMode}
                    onChange={(event) =>
                      setTransferPlanTransportMode(
                        event.target.value as 'INTERNAL_COURIER' | 'EXTERNAL_TRANSPORT',
                      )
                    }
                  >
                    <MenuItem value="INTERNAL_COURIER">Internal Courier</MenuItem>
                    <MenuItem value="EXTERNAL_TRANSPORT">External Transport</MenuItem>
                  </TextField>
                </div>
                {transferPlanTransportMode === 'INTERNAL_COURIER' ? (
                  <TextField
                    fullWidth
                    label="Assigned Courier Name"
                    value={transferPlanCourierName}
                    onChange={(event) =>
                      setTransferPlanCourierName(event.target.value)
                    }
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Transport Vendor Name"
                    value={transferPlanTransporterName}
                    onChange={(event) =>
                      setTransferPlanTransporterName(event.target.value)
                    }
                  />
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={transferPlanInvoiceNumber}
                    onChange={(event) =>
                      setTransferPlanInvoiceNumber(event.target.value)
                    }
                  />
                  <TextField
                    fullWidth
                    label="Challan Number"
                    value={transferPlanChallanNumber}
                    onChange={(event) =>
                      setTransferPlanChallanNumber(event.target.value)
                    }
                  />
                </div>
              </>
            )}
            <TextField
              fullWidth
              multiline
              minRows={4}
              label={
                transferActionMode === 'reject'
                  ? 'Rejection reason'
                  : transferActionMode === 'plan'
                    ? 'Planning note'
                    : 'Admin note'
              }
              value={transferActionNote}
              onChange={(event) => setTransferActionNote(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTransferActionMode(null)} disabled={!!transferActionId}>
            Close
          </Button>
          <Button
            variant="contained"
            color={transferActionMode === 'reject' ? 'error' : 'primary'}
            onClick={submitTransferAction}
            disabled={!!transferActionId}
          >
            {transferActionId ? 'Saving...' : prettify(transferActionMode)}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={!!selectedTransfer && !transferActionMode} onClose={() => setSelectedTransfer(null)}>
        <div className="w-[420px] max-w-full p-5">
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Transfer Detail
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {selectedTransfer?.productTitle} | Transfer #{selectedTransfer?.id}
          </Typography>
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Chip
              size="small"
              sx={{ width: 'fit-content' }}
              color={
                selectedTransfer?.status === 'TRANSFER_COMPLETED'
                  ? 'success'
                  : selectedTransfer?.status === 'TRANSFER_REJECTED'
                    ? 'error'
                    : 'warning'
              }
              label={prettify(selectedTransfer?.status)}
            />
            <Paper sx={{ p: 2, borderRadius: '18px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>Seller:</strong> {selectedTransfer?.sellerName || 'Seller'}</Typography>
                <Typography variant="body2"><strong>Quantity:</strong> {selectedTransfer?.quantity || 0}</Typography>
                <Typography variant="body2"><strong>Seller Stock:</strong> {selectedTransfer?.sellerStock || 0}</Typography>
                <Typography variant="body2"><strong>Warehouse Stock:</strong> {selectedTransfer?.warehouseStock || 0}</Typography>
                <Typography variant="body2">
                  <strong>Pickup Mode:</strong> {prettify(selectedTransfer?.pickupMode || 'WAREHOUSE_PICKUP')}
                </Typography>
                {selectedTransfer?.pickupMode === 'SELLER_DROP' ? (
                  <Typography variant="body2">
                    <strong>Flow:</strong> Seller will drop stock at warehouse after approval.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2">
                      <strong>Weight:</strong> {selectedTransfer?.estimatedWeightKg || 0} kg
                    </Typography>
                    <Typography variant="body2">
                      <strong>Packages:</strong> {selectedTransfer?.packageCount || 0}
                      {selectedTransfer?.packageType ? ` (${selectedTransfer.packageType})` : ''}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Pickup Ready:</strong> {formatDateTime(selectedTransfer?.pickupReadyAt)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Address Verified:</strong>{' '}
                      {selectedTransfer?.pickupAddressVerified ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Transport Mode:</strong> {prettify(selectedTransfer?.transportMode || 'PLANNING_PENDING')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Assigned Courier:</strong> {selectedTransfer?.assignedCourierName || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Transport Vendor:</strong> {selectedTransfer?.transporterName || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Invoice:</strong> {selectedTransfer?.invoiceNumber || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Challan:</strong> {selectedTransfer?.challanNumber || '-'}
                    </Typography>
                  </>
                )}
              </Stack>
            </Paper>
            <Paper sx={{ p: 2, borderRadius: '18px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Timeline
                </Typography>
                <Typography variant="body2">Requested: {formatDateTime(selectedTransfer?.requestedAt)}</Typography>
                <Typography variant="body2">Approved: {formatDateTime(selectedTransfer?.approvedAt)}</Typography>
                <Typography variant="body2">Picked Up: {formatDateTime(selectedTransfer?.pickedUpAt)}</Typography>
                <Typography variant="body2">Received: {formatDateTime(selectedTransfer?.receivedAt)}</Typography>
                <Typography variant="body2">Cancelled: {formatDateTime(selectedTransfer?.cancelledAt)}</Typography>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2, borderRadius: '18px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Notes and Proof
                </Typography>
                <Typography variant="body2"><strong>Seller Note:</strong> {selectedTransfer?.sellerNote || '-'}</Typography>
                <Typography variant="body2"><strong>Admin Note:</strong> {selectedTransfer?.adminNote || '-'}</Typography>
                <Typography variant="body2"><strong>Rejection Reason:</strong> {selectedTransfer?.rejectionReason || '-'}</Typography>
                <Typography variant="body2"><strong>Pickup Proof:</strong> {selectedTransfer?.pickupProofUrl || '-'}</Typography>
                <Typography variant="body2"><strong>Receive Proof:</strong> {selectedTransfer?.receiveProofUrl || '-'}</Typography>
              </Stack>
            </Paper>
            <Divider />
            <Button variant="outlined" onClick={() => setSelectedTransfer(null)}>
              Close
            </Button>
          </Stack>
        </div>
      </Drawer>
    </div>
  );
};

export default AdminWarehouseStock;
