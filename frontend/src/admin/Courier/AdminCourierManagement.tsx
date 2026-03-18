import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "shared/api/Api";
import { API_ROUTES } from "shared/api/ApiRoutes";
import {
  defaultSalaryConfig,
  formatDateLabel,
  formatMoney,
  mapCodCollection,
  mapCourier,
  mapDispatchItem,
  mapEarnings,
  mapPetrolClaim,
  statusTone,
} from "modules/courier/courierData";
import {
  CodCollectionItem,
  CourierProfile,
  DispatchQueueItem,
  EarningsBreakdown,
  PetrolClaimItem,
} from "modules/courier/courierTypes";

type DeliveryHistoryItem = { id?: number | string; status?: string; reason?: string; note?: string; proofUrl?: string; updatedBy?: string; updatedAt?: string; };

type PayrollRow = {
  id?: number | string;
  courierId?: number | string;
  courierName?: string;
  month?: string;
  baseSalary?: number;
  presentDays?: number;
  payableDays?: number;
  perDeliveryEarnings?: number;
  petrolAllowanceApproved?: number;
  incentiveAmount?: number;
  penalties?: number;
  totalPayable?: number;
  payoutStatus?: string;
  paidAt?: string;
  payoutReference?: string;
};

type AdminOrderRow = {
  id: number | string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  courierName?: string;
  courierPhone?: string;
  deliveryWindow?: string;
  totalSellingPrice?: number;
  orderDate?: string;
};

type TabKey = "overview" | "couriers" | "orders" | "dispatch" | "cod" | "payroll";

const monthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const emptyCourierForm = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  zone: "",
  vehicleNumber: "",
  kycIdNumber: "",
  kycDocUrl: "",
};

const emptySalaryForm = {
  monthlyBase: String(defaultSalaryConfig.monthlyBase),
  perDeliveryRate: String(defaultSalaryConfig.perDeliveryRate),
  petrolAllowanceMonthlyCap: String(defaultSalaryConfig.petrolAllowanceMonthlyCap),
  targetDeliveries: String(defaultSalaryConfig.targetDeliveries),
  incentiveAmount: String(defaultSalaryConfig.incentiveAmount),
  latePenalty: String(defaultSalaryConfig.latePenalty),
  failedPenalty: String(defaultSalaryConfig.failedPenalty),
  codMismatchPenalty: String(defaultSalaryConfig.codMismatchPenalty),
};

const AdminCourierManagement = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [couriers, setCouriers] = useState<CourierProfile[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [dispatchQueue, setDispatchQueue] = useState<DispatchQueueItem[]>([]);
  const [codCollections, setCodCollections] = useState<CodCollectionItem[]>([]);
  const [petrolClaims, setPetrolClaims] = useState<PetrolClaimItem[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
  const [newCourier, setNewCourier] = useState(emptyCourierForm);
  const [salaryConfig, setSalaryConfig] = useState(emptySalaryForm);
  const [selectedDispatchIds, setSelectedDispatchIds] = useState<Array<number | string>>([]);
  const [month, setMonth] = useState(monthValue());
  const [earnings, setEarnings] = useState<EarningsBreakdown | null>(null);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [codFrequency, setCodFrequency] = useState("DAILY");
  const [statusUpdate, setStatusUpdate] = useState("ACTIVE");
  const [petrolNotes, setPetrolNotes] = useState<Record<string, string>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [selectedOrderTracking, setSelectedOrderTracking] = useState<{ orderId: number | string; history: DeliveryHistoryItem[] } | null>(null);

  const selectedCourier = useMemo(
    () => couriers.find((item) => String(item.id) === selectedCourierId) || null,
    [couriers, selectedCourierId],
  );

  const overview = useMemo(() => ({
    ordersToday: orders.length,
    deliveredToday: orders.filter((item) => (item.shipmentStatus || item.orderStatus || "").toUpperCase() === "DELIVERED").length,
    failedToday: orders.filter((item) => (item.shipmentStatus || "").toUpperCase().includes("FAILED")).length,
    activeCouriers: couriers.filter((item) => item.status === "ACTIVE").length,
    dispatchPending: dispatchQueue.length,
    codPendingVerification: codCollections.filter((item) => item.status !== "VERIFIED").length,
    monthlyPayoutPending: couriers.filter((item) => (item.activeOrders || 0) > 0).length,
  }), [codCollections, couriers, dispatchQueue.length, orders]);

  const loadWorkspace = async () => {
    setBusy(true);
    setError(null);
    try {
      const [courierRes, orderRes, dispatchRes, codRes, petrolRes] = await Promise.allSettled([
        api.get(API_ROUTES.adminCouriers.base),
        api.get(API_ROUTES.admin.orders),
        api.get(API_ROUTES.adminCouriers.dispatchQueue()),
        api.get(API_ROUTES.adminCouriers.codSettlements()),
        api.get(API_ROUTES.adminCouriers.petrolClaims()),
      ]);

      if (courierRes.status === "fulfilled") {
        setCouriers((Array.isArray(courierRes.value.data) ? courierRes.value.data : []).map(mapCourier));
      }
      if (orderRes.status === "fulfilled") {
        setOrders(Array.isArray(orderRes.value.data) ? orderRes.value.data : []);
      }
      if (dispatchRes.status === "fulfilled") {
        setDispatchQueue((Array.isArray(dispatchRes.value.data) ? dispatchRes.value.data : []).map(mapDispatchItem));
      } else {
        setDispatchQueue([]);
      }
      if (codRes.status === "fulfilled") {
        setCodCollections((Array.isArray(codRes.value.data) ? codRes.value.data : []).map(mapCodCollection));
      } else {
        setCodCollections([]);
      }
      if (petrolRes.status === "fulfilled") {
        setPetrolClaims((Array.isArray(petrolRes.value.data) ? petrolRes.value.data : []).map(mapPetrolClaim));
      } else {
        setPetrolClaims([]);
      }
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || "Failed to load courier workspace");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handleCreateCourier = async () => {
    setError(null);
    try {
      await api.post(API_ROUTES.adminCouriers.base, newCourier);
      setNewCourier(emptyCourierForm);
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to create courier");
    }
  };

  const handleSalaryUpdate = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await api.put(API_ROUTES.adminCouriers.salary(selectedCourierId), {
        monthlyBase: Number(salaryConfig.monthlyBase),
        perDeliveryRate: Number(salaryConfig.perDeliveryRate),
        petrolAllowanceMonthlyCap: Number(salaryConfig.petrolAllowanceMonthlyCap),
        targetDeliveries: Number(salaryConfig.targetDeliveries),
        incentiveAmount: Number(salaryConfig.incentiveAmount),
        latePenalty: Number(salaryConfig.latePenalty),
        failedPenalty: Number(salaryConfig.failedPenalty),
        codMismatchPenalty: Number(salaryConfig.codMismatchPenalty),
      });
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to update salary config");
    }
  };

  const handleCourierStatus = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await api.patch(API_ROUTES.adminCouriers.status(selectedCourierId, statusUpdate));
      await api.patch(API_ROUTES.adminCouriers.codFrequency(selectedCourierId), { frequency: codFrequency });
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to update courier controls");
    }
  };

  const handleBatchAssign = async () => {
    if (!selectedCourierId || selectedDispatchIds.length === 0) return;
    setError(null);
    try {
      await api.post(API_ROUTES.adminCouriers.batchAssign, {
        courierId: selectedCourierId,
        shipmentIds: selectedDispatchIds,
      });
      setSelectedDispatchIds([]);
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to assign dispatch batch");
    }
  };

  const handleCodSettlementUpdate = async (id: number | string, status: "APPROVED" | "REJECTED") => {
    setError(null);
    try {
      await api.patch(API_ROUTES.adminCouriers.updateCodSettlement(id), { status });
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to review COD deposit");
    }
  };

  const handlePetrolClaimUpdate = async (id: number | string, status: "APPROVED" | "REJECTED") => {
    setError(null);
    try {
      await api.patch(API_ROUTES.adminCouriers.updatePetrolClaim(id), {
        status,
        reviewerNote: petrolNotes[String(id)] || "",
      });
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to review petrol claim");
    }
  };

  const handleOpenTracking = async (orderId: number | string) => {
    setError(null);
    try {
      const response = await api.get(API_ROUTES.adminCouriers.deliveryHistory(orderId));
      setSelectedOrderTracking({
        orderId,
        history: Array.isArray(response.data) ? response.data : [],
      });
      setTrackingOpen(true);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to load delivery history");
    }
  };
  const loadPayrollRows = async (targetMonth = month) => {
    const response = await api.get(API_ROUTES.adminCouriers.payroll(`month=${targetMonth}`));
    setPayrollRows(Array.isArray(response.data) ? response.data : []);
  };

  const handleFetchEarnings = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      const [earningsResponse] = await Promise.all([
        api.get(API_ROUTES.adminCouriers.earnings(selectedCourierId, month)),
        loadPayrollRows(month),
      ]);
      setEarnings(mapEarnings(earningsResponse.data || {}, month));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to fetch monthly earnings");
    }
  };

  const handleRunPayroll = async () => {
    setError(null);
    try {
      const response = await api.post(API_ROUTES.adminCouriers.payrollRun, { month });
      setPayrollRows(Array.isArray(response.data) ? response.data : []);
      if (selectedCourierId) {
        const earningsResponse = await api.get(API_ROUTES.adminCouriers.earnings(selectedCourierId, month));
        setEarnings(mapEarnings(earningsResponse.data || {}, month));
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to run payroll");
    }
  };

  const handleLockPayroll = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await api.post(API_ROUTES.adminCouriers.payrollLock(selectedCourierId), { month });
      await handleFetchEarnings();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to lock payroll");
    }
  };

  const handleMarkPayout = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await api.post(API_ROUTES.adminCouriers.payout, {
        courierId: Number(selectedCourierId),
        month,
        payoutMode: "BANK_TRANSFER",
        referenceNumber: `PAY-${Date.now()}` ,
      });
      await handleFetchEarnings();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to mark payout");
    }
  };

  const toggleDispatchSelection = (id: number | string) => {
    setSelectedDispatchIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ["Orders Today", overview.ordersToday],
          ["Delivered Today", overview.deliveredToday],
          ["Failed Delivery", overview.failedToday],
          ["Active Couriers", overview.activeCouriers],
          ["Dispatch Pending", overview.dispatchPending],
          ["COD Pending Verification", overview.codPendingVerification],
          ["Monthly Payout Pending", overview.monthlyPayoutPending],
        ].map(([label, value]) => (
          <Card key={String(label)} sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none">
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Courier Control Center</Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">Courier registry, KYC and salary controls</div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">Dispatch batch assignment with zone and COD awareness</div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">COD reconciliation and petrol claim approvals</div>
          </div>
        </Paper>

        <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none">
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Selected Courier Snapshot</Typography>
          {selectedCourier ? (
            <div className="space-y-2 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">{selectedCourier.fullName}</div>
              <div>Phone: {selectedCourier.phone}</div>
              <div>City: {selectedCourier.city || "-"}</div>
              <div>Zone: {selectedCourier.zone || "Unassigned"}</div>
              <div>KYC: {selectedCourier.kycStatus || "PENDING"}</div>
              <div>Status: {selectedCourier.status}</div>
            </div>
          ) : (
            <Typography variant="body2" color="text.secondary">Select a courier to see profile and payroll actions.</Typography>
          )}
        </Paper>
      </div>
    </div>
  );

  const renderCouriers = () => (
    <div className="grid grid-cols-1 2xl:grid-cols-[1.05fr_1fr] gap-6">
      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Add Courier</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(newCourier).map(([key, value]) => (
            <TextField
              key={key}
              size="small"
              label={key}
              value={value}
              onChange={(event) => setNewCourier((current) => ({ ...current, [key]: event.target.value }))}
            />
          ))}
        </div>
        <Button variant="contained" onClick={handleCreateCourier}>Create Courier</Button>

        <Box sx={{ pt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Couriers Management Table</Typography>
          <div className="space-y-3">
            {couriers.map((courier) => (
              <div key={String(courier.id)} className="rounded-3xl border border-slate-200 p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">{courier.fullName}</div>
                  <div className="text-sm text-slate-500">{courier.phone} � {courier.city || "-"} � Zone {courier.zone || "Unassigned"}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip size="small" label={courier.status} color={statusTone(courier.status)} />
                  <Chip size="small" label={`KYC ${courier.kycStatus || "PENDING"}`} color={statusTone(courier.kycStatus)} variant="outlined" />
                  <Button size="small" variant="outlined" onClick={() => { setSelectedCourierId(String(courier.id)); setProfileOpen(true); }}>View Profile</Button>
                </div>
              </div>
            ))}
            {!couriers.length && <Typography color="text.secondary">No couriers found yet.</Typography>}
          </div>
        </Box>
      </Paper>

      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Courier Controls</Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Courier</InputLabel>
          <Select value={selectedCourierId} label="Courier" onChange={(event) => setSelectedCourierId(String(event.target.value))}>
            {couriers.map((courier) => (
              <MenuItem key={String(courier.id)} value={String(courier.id)}>{courier.fullName}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={statusUpdate} label="Status" onChange={(event) => setStatusUpdate(String(event.target.value))}>
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>COD Frequency</InputLabel>
            <Select value={codFrequency} label="COD Frequency" onChange={(event) => setCodFrequency(String(event.target.value))}>
              <MenuItem value="DAILY">DAILY</MenuItem>
              <MenuItem value="WEEKLY">WEEKLY</MenuItem>
              <MenuItem value="CUSTOM">CUSTOM</MenuItem>
            </Select>
          </FormControl>
        </div>

        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Salary Configuration</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(salaryConfig).map(([key, value]) => (
            <TextField
              key={key}
              size="small"
              label={key}
              value={value}
              onChange={(event) => setSalaryConfig((current) => ({ ...current, [key]: event.target.value }))}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outlined" onClick={handleCourierStatus} disabled={!selectedCourierId}>Save Controls</Button>
          <Button variant="contained" onClick={handleSalaryUpdate} disabled={!selectedCourierId}>Update Salary Config</Button>
        </div>
      </Paper>
    </div>
  );

  const renderOrders = () => (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>Orders Management</Typography>
      <div className="grid grid-cols-1 gap-3">
        {orders.map((order) => (
          <div key={String(order.id)} className="rounded-3xl border border-slate-200 p-4 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
            <div>
              <div className="font-semibold text-slate-900">ORD{order.id}</div>
              <div className="text-sm text-slate-500">{order.customerName || "Customer"} - {order.customerPhone || order.city || "-"}</div>
              <div className="text-xs text-slate-400">{order.address || order.city || "Address pending"}</div>
            </div>
            <div className="space-y-2">
              <Chip size="small" label={order.paymentMethod || "-"} color={statusTone(order.paymentStatus)} />
              <div className="text-xs text-slate-500">{order.paymentStatus || "-"}</div>
            </div>
            <div className="space-y-2">
              <Chip size="small" label={order.fulfillmentStatus || order.orderStatus || "-"} color={statusTone(order.fulfillmentStatus || order.orderStatus)} />
              <div className="text-xs text-slate-500">Shipment {order.shipmentStatus || "LABEL_CREATED"}</div>
            </div>
            <div className="text-sm text-slate-500">
              <div>Courier: {order.courierName || "Unassigned"}</div>
              <div>{order.deliveryWindow || "Today 2PM - 6PM"}</div>
            </div>
            <div className="text-sm text-slate-500">
              <div>{order.city || "-"}</div>
              <div>{formatMoney(order.totalSellingPrice)}</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button size="small" variant="outlined" onClick={() => handleOpenTracking(order.id)}>View Tracking</Button>
            </div>
          </div>
        ))}
        {!orders.length && <Typography color="text.secondary">No orders available for courier operations.</Typography>}
      </div>
    </Paper>
  );

  const renderDispatch = () => (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Dispatch Center</Typography>
          <Typography variant="body2" color="text.secondary">Select shipments, review customer location, then assign a courier from the list.</Typography>
        </div>
        <Button variant="contained" disabled={!selectedCourierId || !selectedDispatchIds.length} onClick={handleBatchAssign}>
          Assign Courier
        </Button>
      </div>

      {!!selectedDispatchIds.length && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="text-sm text-slate-600">{selectedDispatchIds.length} shipment selected. Choose courier and assign.</div>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Assign Courier</InputLabel>
            <Select value={selectedCourierId} label="Assign Courier" onChange={(event) => setSelectedCourierId(String(event.target.value))}>
              {couriers.map((courier) => (
                <MenuItem key={String(courier.id)} value={String(courier.id)}>{courier.fullName} - {courier.phone}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )}

      <div className="space-y-3">
        {dispatchQueue.map((item) => {
          const selected = selectedDispatchIds.includes(item.id);
          return (
            <button
              key={String(item.id)}
              type="button"
              onClick={() => toggleDispatchSelection(item.id)}
              className={`w-full text-left rounded-3xl border p-4 transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}
            >
              <div className="grid grid-cols-1 xl:grid-cols-[auto_1.2fr_1.4fr_1fr_1fr_auto] gap-3 items-center">
                <div className="font-semibold">#{item.orderId}</div>
                <div>
                  <div className="font-medium">{item.customerName || "Customer"}</div>
                  <div className="text-sm opacity-80">{item.customerPhone || "Phone pending"}</div>
                </div>
                <div>
                  <div>{item.address || item.city || "Address pending"}</div>
                  <div className="text-sm opacity-80">{item.city} - {item.zone || "Zone pending"}</div>
                </div>
                <div>
                  <div>{item.deliveryWindow || "Today 2PM - 6PM"}</div>
                  <div className="text-sm opacity-80">{item.paymentType} {item.codAmount ? formatMoney(item.codAmount) : ""}</div>
                </div>
                <div>
                  <div>{item.paymentStatus || "-"}</div>
                  <div className="text-sm opacity-80">SLA {item.slaRisk}</div>
                </div>
                <div>
                  <Chip size="small" label={selected ? "Selected" : "Select"} color={selected ? "success" : "default"} />
                </div>
              </div>
            </button>
          );
        })}
        {!dispatchQueue.length && <Typography color="text.secondary">No unassigned shipments in queue.</Typography>}
      </div>
    </Paper>
  );

  const renderCod = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>COD Management</Typography>
        {codCollections.map((item) => (
          <div key={String(item.id)} className="rounded-3xl border border-slate-200 p-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">Order #{item.orderId}</div>
                <div className="text-sm text-slate-500">Courier: {item.courierName || "-"} � {item.paymentMode}</div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Chip size="small" label={item.status} color={statusTone(item.status)} />
                <span className="text-sm font-semibold">{formatMoney(item.amount)}</span>
              </div>
            </div>
            <div className="text-sm text-slate-500">Collected: {formatDateLabel(item.collectedAt)} � Deposit Date: {item.depositDate || "Pending"}</div>
            <div className="flex gap-2">
              <Button size="small" variant="outlined" onClick={() => handleCodSettlementUpdate(item.id, "APPROVED")}>Approve</Button>
              <Button size="small" color="error" variant="outlined" onClick={() => handleCodSettlementUpdate(item.id, "REJECTED")}>Reject</Button>
            </div>
          </div>
        ))}
        {!codCollections.length && <Typography color="text.secondary">No COD records waiting for review.</Typography>}
      </Paper>

      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Petrol Claims</Typography>
        {petrolClaims.map((claim) => (
          <div key={String(claim.id)} className="rounded-3xl border border-slate-200 p-4 space-y-3">
            <div>
              <div className="font-semibold text-slate-900">{claim.courierName || "Courier"}</div>
              <div className="text-sm text-slate-500">{claim.month} � {formatMoney(claim.amount)}</div>
            </div>
            <TextField
              size="small"
              fullWidth
              label="Reviewer note"
              value={petrolNotes[String(claim.id)] || ""}
              onChange={(event) => setPetrolNotes((current) => ({ ...current, [String(claim.id)]: event.target.value }))}
            />
            <div className="flex gap-2">
              <Button size="small" variant="outlined" onClick={() => handlePetrolClaimUpdate(claim.id, "APPROVED")}>Approve</Button>
              <Button size="small" color="error" variant="outlined" onClick={() => handlePetrolClaimUpdate(claim.id, "REJECTED")}>Reject</Button>
            </div>
          </div>
        ))}
        {!petrolClaims.length && <Typography color="text.secondary">No petrol claims pending right now.</Typography>}
      </Paper>
    </div>
  );

  const renderPayroll = () => (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Earnings and Payroll</Typography>
          <Typography variant="body2" color="text.secondary">Calculate monthly payouts with attendance, deliveries, petrol and penalties.</Typography>
        </div>
        <div className="flex flex-wrap gap-3">
          <TextField size="small" label="Month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <Button variant="outlined" onClick={handleRunPayroll}>Run Payroll</Button>
          <Button variant="contained" onClick={handleFetchEarnings} disabled={!selectedCourierId}>Fetch Earnings</Button>
          <Button variant="outlined" onClick={handleLockPayroll} disabled={!selectedCourierId}>Lock Payroll</Button>
          <Button variant="outlined" color="success" onClick={handleMarkPayout} disabled={!selectedCourierId}>Mark Paid</Button>
        </div>
      </div>
      {earnings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ["Base Salary", formatMoney(earnings.baseSalary)],
            ["Present Days", `${earnings.presentDays}/${earnings.payableDays}`],
            ["Delivery Earnings", formatMoney(earnings.perDeliveryEarnings)],
            ["Petrol", formatMoney(earnings.petrolAllowanceApproved)],
            ["Incentive", formatMoney(earnings.incentiveAmount)],
            ["Penalties", `- ${formatMoney(earnings.penalties)}`],
            ["COD Pending", formatMoney(earnings.codPending)],
            ["Final Payout", formatMoney(earnings.totalPayable)],
          ].map(([label, value]) => (
            <Card key={String(label)} sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid #e2e8f0" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">{label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Typography color="text.secondary">Select a courier and fetch month-wise earnings to review payout.</Typography>
      )}

      <div className="space-y-3">
        {payrollRows.map((row) => (
          <div key={String(row.id || `${row.courierId}-${row.month}`)} className="rounded-3xl border border-slate-200 p-4 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-slate-900">{row.courierName || `Courier ${row.courierId || "-"}`}</div>
              <div className="text-sm text-slate-500">{row.month} ? {row.presentDays || 0}/{row.payableDays || 0} days ? {formatMoney(row.totalPayable)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="small" label={row.payoutStatus || "DRAFT"} color={statusTone(row.payoutStatus)} />
              {row.payoutReference && <span className="text-xs text-slate-500">Ref {row.payoutReference}</span>}
            </div>
          </div>
        ))}
        {!payrollRows.length && <Typography color="text.secondary">Run payroll for the selected month to generate payout rows.</Typography>}
      </div>
    </Paper>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Courier Operations</Typography>
          <Typography variant="body2" color="text.secondary">
            End-to-end command center for courier onboarding, dispatch, COD settlement and payroll.
          </Typography>
        </div>
        <Button variant="outlined" onClick={loadWorkspace} disabled={busy}>Refresh Workspace</Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="rounded-3xl border border-slate-200 shadow-none overflow-hidden">
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto">
          <Tab value="overview" label="Overview" />
          <Tab value="couriers" label="Couriers" />
          <Tab value="orders" label="Orders" />
          <Tab value="dispatch" label="Dispatch" />
          <Tab value="cod" label="COD & Petrol" />
          <Tab value="payroll" label="Salary" />
        </Tabs>
      </Paper>

      {activeTab === "overview" && renderOverview()}
      {activeTab === "couriers" && renderCouriers()}
      {activeTab === "orders" && renderOrders()}
      {activeTab === "dispatch" && renderDispatch()}
      {activeTab === "cod" && renderCod()}
      {activeTab === "payroll" && renderPayroll()}

      <Dialog open={trackingOpen} onClose={() => setTrackingOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Delivery Tracking Timeline</DialogTitle>
        <DialogContent>
          <div className="space-y-3 pt-2">
            <div className="text-sm font-semibold text-slate-900">Order #{selectedOrderTracking?.orderId}</div>
            {selectedOrderTracking?.history?.length ? selectedOrderTracking.history.map((entry) => (
              <div key={String(entry.id || `${entry.status}-${entry.updatedAt}`)} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">{(entry.status || "UPDATE").replaceAll("_", " ")}</div>
                  <Chip size="small" label={(entry.status || "UPDATE").replaceAll("_", " ")} color={statusTone(entry.status)} />
                </div>
                <div className="mt-2 text-sm text-slate-600 space-y-1">
                  {entry.reason && <div>Reason: {entry.reason}</div>}
                  {entry.note && <div>Note: {entry.note}</div>}
                  <div>Updated: {entry.updatedAt ? formatDateLabel(entry.updatedAt) : "-"}</div>
                  {entry.updatedBy && <div>By: {entry.updatedBy}</div>}
                </div>
              </div>
            )) : <Typography color="text.secondary">No delivery history available yet.</Typography>}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Courier Profile</DialogTitle>
        <DialogContent>
          {selectedCourier ? (
            <div className="space-y-3 text-sm text-slate-600 pt-2">
              <div><strong>Name:</strong> {selectedCourier.fullName}</div>
              <div><strong>Phone:</strong> {selectedCourier.phone}</div>
              <div><strong>Email:</strong> {selectedCourier.email || "-"}</div>
              <div><strong>City:</strong> {selectedCourier.city || "-"}</div>
              <div><strong>Zone:</strong> {selectedCourier.zone || "Unassigned"}</div>
              <div><strong>Joining Date:</strong> {selectedCourier.joiningDate ? formatDateLabel(selectedCourier.joiningDate) : "-"}</div>
              <div><strong>Status:</strong> {selectedCourier.status}</div>
              <div><strong>KYC:</strong> {selectedCourier.kycStatus || "PENDING"}</div>
              <div><strong>Deliveries This Month:</strong> {selectedCourier.deliveriesThisMonth || 0}</div>
            </div>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminCourierManagement;


