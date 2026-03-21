import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CodCollectionItem,
  CourierProfile,
  DispatchQueueItem,
  EarningsBreakdown,
  PetrolClaimItem,
} from 'features/courier/courierTypes';
import {
  emptyCourierForm,
  emptySalaryForm,
  monthValue,
} from '../adminCourierConfig';
import {
  AdminOrderRow,
  DeliveryHistoryItem,
  NewCourierForm,
  PayrollRow,
  SalaryConfigForm,
  TabKey,
} from '../types';
import {
  batchAssignDispatchApi,
  createCourierApi,
  fetchCourierEarningsApi,
  fetchDeliveryHistoryApi,
  fetchPayrollRowsApi,
  lockPayrollApi,
  loadAdminCourierWorkspaceApi,
  markPayoutApi,
  reviewCodSettlementApi,
  reviewPetrolClaimApi,
  runPayrollApi,
  updateCourierControlsApi,
  updateCourierSalaryApi,
} from './adminCourierApi';

const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ||
  (error as { message?: string })?.message ||
  fallback;

export const useAdminCourierManagement = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [couriers, setCouriers] = useState<CourierProfile[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [dispatchQueue, setDispatchQueue] = useState<DispatchQueueItem[]>([]);
  const [codCollections, setCodCollections] = useState<CodCollectionItem[]>([]);
  const [petrolClaims, setPetrolClaims] = useState<PetrolClaimItem[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [newCourier, setNewCourier] =
    useState<NewCourierForm>(emptyCourierForm);
  const [salaryConfig, setSalaryConfig] =
    useState<SalaryConfigForm>(emptySalaryForm);
  const [selectedDispatchIds, setSelectedDispatchIds] = useState<
    Array<number | string>
  >([]);
  const [month, setMonth] = useState(monthValue());
  const [earnings, setEarnings] = useState<EarningsBreakdown | null>(null);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [codFrequency, setCodFrequency] = useState('DAILY');
  const [statusUpdate, setStatusUpdate] = useState('ACTIVE');
  const [petrolNotes, setPetrolNotes] = useState<Record<string, string>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [selectedOrderTracking, setSelectedOrderTracking] = useState<{
    orderId: number | string;
    history: DeliveryHistoryItem[];
  } | null>(null);

  const selectedCourier = useMemo(
    () =>
      couriers.find((item) => String(item.id) === selectedCourierId) || null,
    [couriers, selectedCourierId],
  );

  const overview = useMemo(
    () => ({
      ordersToday: orders.length,
      deliveredToday: orders.filter(
        (item) =>
          (item.shipmentStatus || item.orderStatus || '').toUpperCase() ===
          'DELIVERED',
      ).length,
      failedToday: orders.filter((item) =>
        (item.shipmentStatus || '').toUpperCase().includes('FAILED'),
      ).length,
      activeCouriers: couriers.filter((item) => item.status === 'ACTIVE')
        .length,
      dispatchPending: dispatchQueue.length,
      codPendingVerification: codCollections.filter(
        (item) => item.status !== 'VERIFIED',
      ).length,
      monthlyPayoutPending: couriers.filter(
        (item) => (item.activeOrders || 0) > 0,
      ).length,
    }),
    [codCollections, couriers, dispatchQueue.length, orders],
  );

  const loadWorkspace = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const workspaceData = await loadAdminCourierWorkspaceApi();
      if (workspaceData.couriers) {
        setCouriers(workspaceData.couriers);
      }
      if (workspaceData.orders) {
        setOrders(workspaceData.orders);
      }
      setDispatchQueue(workspaceData.dispatchQueue);
      setCodCollections(workspaceData.codCollections);
      setPetrolClaims(workspaceData.petrolClaims);
    } catch (loadError: unknown) {
      setError(readErrorMessage(loadError, 'Failed to load courier workspace'));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleCreateCourier = async () => {
    setError(null);
    try {
      const createdCourier = await createCourierApi({
        ...newCourier,
        status: statusUpdate,
        codSettlementFrequency: codFrequency,
        salaryConfig,
      });
      if (createdCourier?.id !== undefined && createdCourier?.id !== null) {
        setSelectedCourierId(String(createdCourier.id));
      }
      setNewCourier(emptyCourierForm);
      setSalaryConfig(emptySalaryForm);
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to create courier'));
    }
  };

  const handleSalaryUpdate = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await updateCourierSalaryApi(selectedCourierId, salaryConfig);
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to update salary config'),
      );
    }
  };

  const handleCourierStatus = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await updateCourierControlsApi(
        selectedCourierId,
        statusUpdate,
        codFrequency,
      );
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to update courier controls'),
      );
    }
  };

  const handleBatchAssign = async () => {
    if (!selectedCourierId || selectedDispatchIds.length === 0) return;
    setError(null);
    try {
      await batchAssignDispatchApi(selectedCourierId, selectedDispatchIds);
      setSelectedDispatchIds([]);
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to assign dispatch batch'),
      );
    }
  };

  const handleCodSettlementUpdate = async (
    id: number | string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    setError(null);
    try {
      await reviewCodSettlementApi(id, status);
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to review COD deposit'));
    }
  };

  const handlePetrolClaimUpdate = async (
    id: number | string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    setError(null);
    try {
      await reviewPetrolClaimApi(id, status, petrolNotes[String(id)] || '');
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to review petrol claim'));
    }
  };

  const handleOpenTracking = async (orderId: number | string) => {
    setError(null);
    try {
      setSelectedOrderTracking({
        orderId,
        history: await fetchDeliveryHistoryApi(orderId),
      });
      setTrackingOpen(true);
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to load delivery history'),
      );
    }
  };

  const loadPayrollRows = async (targetMonth = month) => {
    setPayrollRows(await fetchPayrollRowsApi(targetMonth));
  };

  const handleFetchEarnings = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      const [mappedEarnings] = await Promise.all([
        fetchCourierEarningsApi(selectedCourierId, month),
        loadPayrollRows(month),
      ]);
      setEarnings(mappedEarnings);
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to fetch monthly earnings'),
      );
    }
  };

  const handleRunPayroll = async () => {
    setError(null);
    try {
      setPayrollRows(await runPayrollApi(month));
      if (selectedCourierId) {
        setEarnings(await fetchCourierEarningsApi(selectedCourierId, month));
      }
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to run payroll'));
    }
  };

  const handleLockPayroll = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await lockPayrollApi(selectedCourierId, month);
      await handleFetchEarnings();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to lock payroll'));
    }
  };

  const handleMarkPayout = async () => {
    if (!selectedCourierId) return;
    setError(null);
    try {
      await markPayoutApi(selectedCourierId, month);
      await handleFetchEarnings();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to mark payout'));
    }
  };

  const toggleDispatchSelection = (id: number | string) => {
    setSelectedDispatchIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleOpenProfile = (courierId: string) => {
    setSelectedCourierId(courierId);
    setProfileOpen(true);
  };

  const closeProfile = () => setProfileOpen(false);
  const closeTracking = () => setTrackingOpen(false);

  return {
    activeTab,
    busy,
    closeProfile,
    closeTracking,
    codCollections,
    codFrequency,
    couriers,
    dispatchQueue,
    earnings,
    error,
    handleBatchAssign,
    handleCodSettlementUpdate,
    handleCourierStatus,
    handleCreateCourier,
    handleFetchEarnings,
    handleLockPayroll,
    handleMarkPayout,
    handleOpenProfile,
    handleOpenTracking,
    handlePetrolClaimUpdate,
    handleRunPayroll,
    handleSalaryUpdate,
    loadWorkspace,
    month,
    newCourier,
    orders,
    payrollRows,
    petrolClaims,
    petrolNotes,
    profileOpen,
    salaryConfig,
    selectedCourier,
    selectedCourierId,
    selectedDispatchIds,
    selectedOrderTracking,
    setActiveTab,
    setCodFrequency,
    setMonth,
    setNewCourier,
    setPetrolNotes,
    setSalaryConfig,
    setSelectedCourierId,
    setStatusUpdate,
    statusUpdate,
    toggleDispatchSelection,
    trackingOpen,
    overview,
  };
};
