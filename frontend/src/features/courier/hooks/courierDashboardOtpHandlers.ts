import React from 'react';
import { OTP_LENGTH } from 'features/courier/courierDashboardConfig';
import { CourierDeliveryFormState } from './courierDashboardTypes';
import { OtpInputRefs } from 'features/courier/components/dialogs/deliveryTask/CourierDeliveryTaskDialog.types';

type CreateOtpHandlersParams = {
  otpSlots: string[];
  otpRefs: OtpInputRefs;
  setDeliveryForm: React.Dispatch<
    React.SetStateAction<CourierDeliveryFormState>
  >;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export const createOtpHandlers = ({
  otpSlots,
  otpRefs,
  setDeliveryForm,
  setError,
}: CreateOtpHandlersParams) => {
  const setOtpAt = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, '').slice(0, 1);
    const next = otpSlots
      .map((value, slotIndex) => (slotIndex === index ? clean : value))
      .join('');
    setDeliveryForm((current) => ({ ...current, otp: next }));
    if (clean && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key !== 'Backspace') return;
    if (!otpSlots[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      return;
    }
    setOtpAt(index, '');
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDeliveryForm((current) => ({ ...current, otp: pasted }));
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleOtpInputChange = (index: number, value: string) => {
    setError((current) => (/otp/i.test(current || '') ? null : current));
    setOtpAt(index, value);
  };

  return {
    handleOtpInputChange,
    handleOtpKeyDown,
    handleOtpPaste,
  };
};
