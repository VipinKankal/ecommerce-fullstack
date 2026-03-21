import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import {
  loadCourierAssignments,
  loadCourierEarnings,
  mapCodCollection,
  mapPetrolClaim,
} from 'features/courier/courierData';
import {
  mapReversePickupTask,
  mergeAssignmentsWithReverseTasks,
} from 'features/courier/courierDashboardConfig';
import {
  CodCollectionItem,
  CourierAssignmentItem,
  EarningsBreakdown,
  PetrolClaimItem,
} from 'features/courier/courierTypes';
import { ReversePickupTaskRecord } from 'features/courier/courierDashboardConfig';

type CourierWorkspaceData = {
  assignments: CourierAssignmentItem[];
  codItems: CodCollectionItem[];
  petrolClaims: PetrolClaimItem[];
  earnings: EarningsBreakdown | null;
};

export const loadCourierWorkspaceData = async (
  month: string,
): Promise<CourierWorkspaceData> => {
  const [
    assignmentList,
    reversePickupResponse,
    earningsData,
    codResponse,
    petrolResponse,
  ] = await Promise.allSettled([
    loadCourierAssignments(),
    api.get(API_ROUTES.courier.reversePickups),
    loadCourierEarnings(month),
    api.get(API_ROUTES.courier.codSettlements),
    api.get(API_ROUTES.courier.petrolClaims),
  ]);

  let reverseTasks: ReversePickupTaskRecord[] = [];
  if (reversePickupResponse.status === 'fulfilled') {
    const reversePickupData = Array.isArray(reversePickupResponse.value.data)
      ? reversePickupResponse.value.data
      : [];
    reverseTasks = reversePickupData.map(mapReversePickupTask);
  }

  let assignments: CourierAssignmentItem[] = [];
  if (assignmentList.status === 'fulfilled') {
    assignments = mergeAssignmentsWithReverseTasks(
      assignmentList.value,
      reverseTasks,
    );
  } else if (reverseTasks.length) {
    assignments = mergeAssignmentsWithReverseTasks([], reverseTasks);
  }

  const codItems =
    codResponse.status === 'fulfilled'
      ? (Array.isArray(codResponse.value.data)
          ? codResponse.value.data
          : []
        ).map(mapCodCollection)
      : [];

  const petrolClaims =
    petrolResponse.status === 'fulfilled'
      ? (Array.isArray(petrolResponse.value.data)
          ? petrolResponse.value.data
          : []
        ).map(mapPetrolClaim)
      : [];

  return {
    assignments,
    codItems,
    petrolClaims,
    earnings: earningsData.status === 'fulfilled' ? earningsData.value : null,
  };
};
