import React from 'react';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { uploadToCloudinary } from 'shared/utils/uploadToCloudinary';
import { reversePickupCompletedStatuses } from 'features/courier/courierDashboardConfig';
import { CourierAssignmentItem } from 'features/courier/courierTypes';
import {
  CourierReversePickupFormState,
  CourierToastState,
} from './courierDashboardTypes';

type CreateReversePickupHandlersParams = {
  selectedReverseTask: CourierAssignmentItem | null;
  reversePickupForm: CourierReversePickupFormState;
  setSelectedReverseTask: React.Dispatch<
    React.SetStateAction<CourierAssignmentItem | null>
  >;
  setReversePickupForm: React.Dispatch<
    React.SetStateAction<CourierReversePickupFormState>
  >;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setAssignments: React.Dispatch<React.SetStateAction<CourierAssignmentItem[]>>;
  setToast: React.Dispatch<React.SetStateAction<CourierToastState>>;
  setSubmittingReversePickup: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadingReverseProof: React.Dispatch<React.SetStateAction<boolean>>;
  loadWorkspace: () => Promise<void>;
};

const getReverseTaskId = (task: CourierAssignmentItem) =>
  task.reverseTaskId ?? task.returnId ?? task.id;

const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ||
  (error as { message?: string })?.message ||
  fallback;

export const createReversePickupHandlers = ({
  selectedReverseTask,
  reversePickupForm,
  setSelectedReverseTask,
  setReversePickupForm,
  setSuccessMessage,
  setError,
  setAssignments,
  setToast,
  setSubmittingReversePickup,
  setUploadingReverseProof,
  loadWorkspace,
}: CreateReversePickupHandlersParams) => {
  const openReverseTask = (task: CourierAssignmentItem) => {
    setSelectedReverseTask(task);
    setSuccessMessage(null);
    setError(null);
    setReversePickupForm({
      proofPhotoUrl: task.proofPhotoUrl || '',
      note: task.statusNote || '',
    });
  };

  const closeReverseTask = () => {
    setSelectedReverseTask(null);
    setReversePickupForm({ proofPhotoUrl: '', note: '' });
    setSuccessMessage(null);
  };

  const isReversePickupAccepted = (task?: CourierAssignmentItem | null) => {
    if (!task) return false;
    return (
      ['ACCEPTED', 'IN_PROGRESS', 'PICKED', 'COMPLETED'].includes(
        (task.reversePickupTaskStatus || '').toUpperCase(),
      ) ||
      reversePickupCompletedStatuses.has(
        (task.returnStatus || '').toUpperCase(),
      )
    );
  };

  const isReversePickupInProgress = (task?: CourierAssignmentItem | null) => {
    if (!task) return false;
    return (
      ['IN_PROGRESS', 'PICKED', 'COMPLETED'].includes(
        (task.reversePickupTaskStatus || '').toUpperCase(),
      ) ||
      reversePickupCompletedStatuses.has(
        (task.returnStatus || '').toUpperCase(),
      )
    );
  };

  const syncReverseTaskStatus = (taskId: number | string, status: string) => {
    setAssignments((current) =>
      current.map((task) =>
        String(getReverseTaskId(task)) === String(taskId)
          ? {
              ...task,
              reversePickupTaskStatus: status,
              statusNote: reversePickupForm.note || task.statusNote,
            }
          : task,
      ),
    );
    setSelectedReverseTask((current) =>
      current
        ? {
            ...current,
            reversePickupTaskStatus: status,
            statusNote: reversePickupForm.note || current.statusNote,
          }
        : current,
    );
  };

  const updateReverseTaskStatus = async (params: {
    taskId: number | string;
    status: 'ACCEPTED' | 'IN_PROGRESS';
    successMessage: string;
    fallbackErrorMessage: string;
  }) => {
    setSubmittingReversePickup(true);
    setError(null);
    try {
      await api.patch(API_ROUTES.courier.reversePickupStatus(params.taskId), {
        status: params.status,
        note: reversePickupForm.note || undefined,
      });
      syncReverseTaskStatus(params.taskId, params.status);
      setToast({
        open: true,
        severity: 'success',
        message: params.successMessage,
      });
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, params.fallbackErrorMessage));
    } finally {
      setSubmittingReversePickup(false);
    }
  };

  const handleAcceptReversePickup = async () => {
    if (!selectedReverseTask) return;
    const taskId = getReverseTaskId(selectedReverseTask);
    await updateReverseTaskStatus({
      taskId,
      status: 'ACCEPTED',
      successMessage: 'Pickup accepted successfully.',
      fallbackErrorMessage: 'Failed to accept pickup task',
    });
  };

  const handleStartReversePickup = async () => {
    if (!selectedReverseTask) return;
    const taskId = getReverseTaskId(selectedReverseTask);
    await updateReverseTaskStatus({
      taskId,
      status: 'IN_PROGRESS',
      successMessage: 'Pickup marked in progress.',
      fallbackErrorMessage: 'Failed to start pickup task',
    });
  };

  const handleReverseProofUpload = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setUploadingReverseProof(true);
    try {
      const url = await uploadToCloudinary(file);
      setReversePickupForm((current) => ({
        ...current,
        proofPhotoUrl: url || '',
      }));
    } catch (uploadError: unknown) {
      setError(readErrorMessage(uploadError, 'Failed to upload pickup proof'));
    } finally {
      setUploadingReverseProof(false);
    }
  };

  const validateReversePickupSubmit = (
    task: CourierAssignmentItem | null,
  ): string | null => {
    if (!task) {
      return null;
    }
    if (!isReversePickupAccepted(task)) {
      return 'Accept the pickup task before marking the item picked.';
    }
    if (!reversePickupForm.proofPhotoUrl.trim()) {
      return 'Upload pickup photo before marking the item picked.';
    }
    return null;
  };

  const getPickedStatus = (task: CourierAssignmentItem) =>
    task.reverseType === 'EXCHANGE'
      ? 'EXCHANGE_IN_TRANSIT'
      : 'RETURN_IN_TRANSIT';

  const syncPickedReverseTask = (
    selectedTask: CourierAssignmentItem,
    pickedStatus: string,
  ) => {
    setAssignments((current) =>
      current.map((task) => {
        if (
          String(task.returnId ?? task.id) !==
          String(selectedTask.returnId ?? selectedTask.id)
        ) {
          return task;
        }

        return {
          ...task,
          proofPhotoUrl: reversePickupForm.proofPhotoUrl,
          statusNote: reversePickupForm.note,
          reversePickupTaskStatus: 'COMPLETED',
          reversePickedAt: new Date().toISOString(),
          returnStatus: pickedStatus,
        };
      }),
    );
  };

  const handleReversePickupSubmit = async () => {
    if (!selectedReverseTask) return;

    const validationError = validateReversePickupSubmit(selectedReverseTask);
    if (validationError) {
      setError(validationError);
      return;
    }

    const taskId = getReverseTaskId(selectedReverseTask);

    setSubmittingReversePickup(true);
    setError(null);
    try {
      await api.patch(API_ROUTES.courier.reversePickupStatus(taskId), {
        status: 'PICKED',
        note: reversePickupForm.note || undefined,
        proofUrl: reversePickupForm.proofPhotoUrl || undefined,
      });
      const pickedStatus = getPickedStatus(selectedReverseTask);
      syncPickedReverseTask(selectedReverseTask, pickedStatus);

      setToast({
        open: true,
        severity: 'success',
        message: 'Pickup marked successfully.',
      });
      closeReverseTask();
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(
          requestError,
          'Failed to update reverse pickup status',
        ),
      );
    } finally {
      setSubmittingReversePickup(false);
    }
  };

  return {
    closeReverseTask,
    handleAcceptReversePickup,
    handleReversePickupSubmit,
    handleReverseProofUpload,
    handleStartReversePickup,
    isReversePickupAccepted,
    isReversePickupInProgress,
    openReverseTask,
  };
};
