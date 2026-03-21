import React from 'react';
import { Button, Chip, TextField, Typography } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import {
  DeliveryFormState,
  OtpInputRefs,
} from './CourierDeliveryTaskDialog.types';

type DeliveryOtpSectionProps = {
  otpSent: boolean;
  otpVerified: boolean;
  otpError: boolean;
  otpLooksEntered: boolean;
  otpCooldownActive: boolean;
  otpCooldownSeconds: number;
  isArrivedOrBeyond: boolean;
  verifyingOtp: boolean;
  error: string | null;
  deliveryForm: DeliveryFormState;
  otpSlots: string[];
  otpRefs: OtpInputRefs;
  onSendDeliveryOtp: () => void | Promise<void>;
  onDeliverySubmit: (nextStatus?: string) => void | Promise<void>;
  onOtpKeyDown: (
    index: number,
    event: React.KeyboardEvent<HTMLElement>,
  ) => void;
  onOtpPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onOtpInputChange: (index: number, value: string) => void;
};

const DeliveryOtpSection = ({
  otpSent,
  otpVerified,
  otpError,
  otpLooksEntered,
  otpCooldownActive,
  otpCooldownSeconds,
  isArrivedOrBeyond,
  verifyingOtp,
  error,
  deliveryForm,
  otpSlots,
  otpRefs,
  onSendDeliveryOtp,
  onDeliverySubmit,
  onOtpKeyDown,
  onOtpPaste,
  onOtpInputChange,
}: DeliveryOtpSectionProps) => {
  const otpInputKeys = ['otp-1', 'otp-2', 'otp-3', 'otp-4', 'otp-5', 'otp-6'];
  const sendOtpDisabled = !isArrivedOrBeyond || otpCooldownActive;
  let sendOtpLabel = 'Send OTP';
  if (otpCooldownActive) {
    sendOtpLabel = `Resend in ${otpCooldownSeconds}s`;
  } else if (otpSent) {
    sendOtpLabel = 'Resend OTP';
  }
  let otpStatusIcon: React.ReactNode = null;
  if (otpVerified) {
    otpStatusIcon = (
      <CheckCircleOutlinedIcon color="success" fontSize="small" />
    );
  } else if (otpError) {
    otpStatusIcon = <ErrorOutlineOutlinedIcon color="error" fontSize="small" />;
  } else if (otpLooksEntered) {
    otpStatusIcon = <VerifiedOutlinedIcon color="action" fontSize="small" />;
  }
  let otpHintText =
    'Enter the 6-digit OTP from customer email, then click Verify OTP.';
  if (otpVerified) {
    otpHintText = 'OTP verified successfully.';
  } else if (otpError) {
    otpHintText = error || 'Invalid OTP';
  } else if (!isArrivedOrBeyond) {
    otpHintText = 'Mark the order as Arrived first, then send OTP.';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outlined"
            onClick={onSendDeliveryOtp}
            sx={{ minWidth: 120 }}
            disabled={sendOtpDisabled}
          >
            {sendOtpLabel}
          </Button>
          {(otpSent || otpVerified) && (
            <Chip
              icon={
                otpVerified ? (
                  <VerifiedOutlinedIcon />
                ) : (
                  <MarkEmailReadOutlinedIcon />
                )
              }
              color="success"
              variant="outlined"
              label={
                otpVerified
                  ? 'Email OTP Verified'
                  : 'OTP Sent to Customer Email'
              }
            />
          )}
        </div>
        {otpSent && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Customer OTP
                </Typography>
                {otpStatusIcon}
              </div>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {otpInputKeys.map((otpKey, index) => {
                  const digit = otpSlots[index] || '';
                  return (
                    <TextField
                      key={otpKey}
                      size="small"
                      value={digit}
                      error={otpError}
                      inputRef={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      onPaste={onOtpPaste}
                      onKeyDown={(event) => onOtpKeyDown(index, event)}
                      onChange={(event) =>
                        onOtpInputChange(index, event.target.value)
                      }
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 1,
                        style: { textAlign: 'center' },
                      }}
                    />
                  );
                })}
              </div>
              <Typography
                className="mt-2"
                variant="caption"
                color={otpError ? 'error' : 'text.secondary'}
              >
                {otpHintText}
              </Typography>
            </div>
            <Button
              variant="contained"
              onClick={() => onDeliverySubmit('DELIVERED')}
              disabled={
                verifyingOtp || !deliveryForm.otp.trim() || !isArrivedOrBeyond
              }
            >
              {verifyingOtp ? 'Verifying OTP...' : 'Verify OTP'}
            </Button>
          </>
        )}
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
        Step 1: Mark the order Arrived. Step 2: Select Delivered. Step 3: Send
        OTP. Step 4: Enter OTP. Step 5: Verify OTP and complete delivery.
      </div>
    </div>
  );
};

export default DeliveryOtpSection;
