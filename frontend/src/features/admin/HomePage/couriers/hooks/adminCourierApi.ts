import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import {
  mapCodCollection,
  mapCourier,
  mapDispatchItem,
  mapEarnings,
  mapPetrolClaim,
} from 'features/courier/courierData';
import {
  CodCollectionItem,
  CourierProfile,
  DispatchQueueItem,
  PetrolClaimItem,
} from 'features/courier/courierTypes';
import { AdminOrderRow, NewCourierForm, SalaryConfigForm } from '../types';

type AdminCourierWorkspaceData = {
  couriers?: CourierProfile[];
  orders?: AdminOrderRow[];
  dispatchQueue: DispatchQueueItem[];
  codCollections: CodCollectionItem[];
  petrolClaims: PetrolClaimItem[];
};

export const loadAdminCourierWorkspaceApi =
  async (): Promise<AdminCourierWorkspaceData> => {
    const [courierRes, orderRes, dispatchRes, codRes, petrolRes] =
      await Promise.allSettled([
        api.get(API_ROUTES.adminCouriers.base),
        api.get(API_ROUTES.admin.orders),
        api.get(API_ROUTES.adminCouriers.dispatchQueue()),
        api.get(API_ROUTES.adminCouriers.codSettlements()),
        api.get(API_ROUTES.adminCouriers.petrolClaims()),
      ]);

    return {
      couriers:
        courierRes.status === 'fulfilled'
          ? (Array.isArray(courierRes.value.data)
              ? courierRes.value.data
              : []
            ).map(mapCourier)
          : undefined,
      orders:
        orderRes.status === 'fulfilled'
          ? Array.isArray(orderRes.value.data)
            ? orderRes.value.data
            : []
          : undefined,
      dispatchQueue:
        dispatchRes.status === 'fulfilled'
          ? (Array.isArray(dispatchRes.value.data)
              ? dispatchRes.value.data
              : []
            ).map(mapDispatchItem)
          : [],
      codCollections:
        codRes.status === 'fulfilled'
          ? (Array.isArray(codRes.value.data) ? codRes.value.data : []).map(
              mapCodCollection,
            )
          : [],
      petrolClaims:
        petrolRes.status === 'fulfilled'
          ? (Array.isArray(petrolRes.value.data)
              ? petrolRes.value.data
              : []
            ).map(mapPetrolClaim)
          : [],
    };
  };

export const createCourierApi = async (payload: NewCourierForm) => {
  await api.post(API_ROUTES.adminCouriers.base, payload);
};

export const updateCourierSalaryApi = async (
  courierId: string,
  salaryConfig: SalaryConfigForm,
) => {
  await api.put(API_ROUTES.adminCouriers.salary(courierId), {
    monthlyBase: Number(salaryConfig.monthlyBase),
    perDeliveryRate: Number(salaryConfig.perDeliveryRate),
    petrolAllowanceMonthlyCap: Number(salaryConfig.petrolAllowanceMonthlyCap),
    targetDeliveries: Number(salaryConfig.targetDeliveries),
    incentiveAmount: Number(salaryConfig.incentiveAmount),
    latePenalty: Number(salaryConfig.latePenalty),
    failedPenalty: Number(salaryConfig.failedPenalty),
    codMismatchPenalty: Number(salaryConfig.codMismatchPenalty),
  });
};

export const updateCourierControlsApi = async (
  courierId: string,
  statusUpdate: string,
  codFrequency: string,
) => {
  await api.patch(API_ROUTES.adminCouriers.status(courierId, statusUpdate));
  await api.patch(API_ROUTES.adminCouriers.codFrequency(courierId), {
    frequency: codFrequency,
  });
};

export const batchAssignDispatchApi = async (
  courierId: string,
  shipmentIds: Array<number | string>,
) => {
  await api.post(API_ROUTES.adminCouriers.batchAssign, {
    courierId,
    shipmentIds,
  });
};

export const reviewCodSettlementApi = async (
  id: number | string,
  status: 'APPROVED' | 'REJECTED',
) => {
  await api.patch(API_ROUTES.adminCouriers.updateCodSettlement(id), { status });
};

export const reviewPetrolClaimApi = async (
  id: number | string,
  status: 'APPROVED' | 'REJECTED',
  reviewerNote: string,
) => {
  await api.patch(API_ROUTES.adminCouriers.updatePetrolClaim(id), {
    status,
    reviewerNote,
  });
};

export const fetchDeliveryHistoryApi = async (orderId: number | string) => {
  const response = await api.get(
    API_ROUTES.adminCouriers.deliveryHistory(orderId),
  );
  return Array.isArray(response.data) ? response.data : [];
};

export const fetchPayrollRowsApi = async (targetMonth: string) => {
  const response = await api.get(
    API_ROUTES.adminCouriers.payroll(`month=${targetMonth}`),
  );
  return Array.isArray(response.data) ? response.data : [];
};

export const fetchCourierEarningsApi = async (
  courierId: string,
  month: string,
) => {
  const response = await api.get(
    API_ROUTES.adminCouriers.earnings(courierId, month),
  );
  return mapEarnings(response.data || {}, month);
};

export const runPayrollApi = async (month: string) => {
  const response = await api.post(API_ROUTES.adminCouriers.payrollRun, {
    month,
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const lockPayrollApi = async (courierId: string, month: string) => {
  await api.post(API_ROUTES.adminCouriers.payrollLock(courierId), { month });
};

export const markPayoutApi = async (courierId: string, month: string) => {
  await api.post(API_ROUTES.adminCouriers.payout, {
    courierId: Number(courierId),
    month,
    payoutMode: 'BANK_TRANSFER',
    referenceNumber: `PAY-${Date.now()}`,
  });
};
