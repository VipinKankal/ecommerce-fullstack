import React from 'react';
import { CourierAssignmentItem } from 'features/courier/courierTypes';
import { CourierDeliveryFormState } from './courierDashboardTypes';

type CreateTaskDialogHandlersParams = {
  setSelectedTask: React.Dispatch<
    React.SetStateAction<CourierAssignmentItem | null>
  >;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setOtpSent: React.Dispatch<React.SetStateAction<boolean>>;
  setDeliveryAction: React.Dispatch<React.SetStateAction<string>>;
  setDeliveryForm: React.Dispatch<
    React.SetStateAction<CourierDeliveryFormState>
  >;
};

export const createTaskDialogHandlers = ({
  setSelectedTask,
  setSuccessMessage,
  setError,
  setOtpSent,
  setDeliveryAction,
  setDeliveryForm,
}: CreateTaskDialogHandlersParams) => {
  const openTask = (task: CourierAssignmentItem) => {
    setSelectedTask(task);
    setSuccessMessage(null);
    setError(null);
    setOtpSent(
      Boolean(
        task.otpVerified ||
        task.courierTaskStatus === 'CONFIRMATION_PENDING' ||
        task.courierTaskStatus === 'DELIVERED',
      ),
    );
    setDeliveryAction(
      task.courierTaskStatus === 'ASSIGNED'
        ? 'ACCEPTED'
        : task.courierTaskStatus === 'CONFIRMATION_PENDING'
          ? 'DELIVERED'
          : task.courierTaskStatus,
    );
    setDeliveryForm({
      codAmount: task.codAmount
        ? String(task.codAmount)
        : String(task.amount || ''),
      codMode: 'CASH',
      otp: '',
      proofPhotoUrl: task.proofPhotoUrl || '',
      transactionId: '',
      failureReason: task.failureReason || '',
      statusReason: task.statusReason || '',
      statusNote: task.statusNote || '',
    });
  };

  const closeTaskDialog = () => {
    setSelectedTask(null);
    setOtpSent(false);
    setSuccessMessage(null);
  };

  const handleDeliveryActionChange = (value: string) => {
    setSuccessMessage(null);
    setDeliveryAction(value);
  };

  return {
    closeTaskDialog,
    handleDeliveryActionChange,
    openTask,
  };
};
