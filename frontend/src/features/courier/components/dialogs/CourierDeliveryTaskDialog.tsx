import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { transitionOptions } from 'features/courier/courierDashboardConfig';
import { formatMoney } from 'features/courier/courierData';
import DeliveryCodSection from './deliveryTask/DeliveryCodSection';
import DeliveryOtpSection from './deliveryTask/DeliveryOtpSection';
import DeliveryProofAndFailureSection from './deliveryTask/DeliveryProofAndFailureSection';
import { CourierDeliveryTaskDialogProps } from './deliveryTask/CourierDeliveryTaskDialog.types';

const CourierDeliveryTaskDialog = ({
  open,
  selectedTask,
  deliveryAction,
  safeDeliveryAction,
  onDeliveryActionChange,
  isConfirmationStep,
  isArrivedOrBeyond,
  otpSent,
  otpVerified,
  otpError,
  otpLooksEntered,
  otpCooldownActive,
  otpCooldownSeconds,
  deliveryForm,
  setDeliveryForm,
  successMessage,
  error,
  verifyingOtp,
  uploadingProof,
  otpSlots,
  otpRefs,
  currentReasonOptions,
  safeSelectedReasonValue,
  onClose,
  onSendDeliveryOtp,
  onDeliverySubmit,
  onOtpKeyDown,
  onOtpPaste,
  onOtpInputChange,
  onProofUpload,
}: CourierDeliveryTaskDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>Delivery Task</DialogTitle>
    <DialogContent>
      {selectedTask && (
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-200 p-4">
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Customer Details
              </Typography>
              <div className="mt-2 text-sm text-slate-600 space-y-1">
                <div>{selectedTask.customerName}</div>
                <div>{selectedTask.customerPhone || 'Phone unavailable'}</div>
                <div>{selectedTask.address}</div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 p-4">
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Order Info
              </Typography>
              <div className="mt-2 text-sm text-slate-600 space-y-1">
                <div>Amount: {formatMoney(selectedTask.amount)}</div>
                <div>Payment Type: {selectedTask.paymentType}</div>
                <div>
                  Delivery Slot:{' '}
                  {selectedTask.deliveryWindow ||
                    selectedTask.etaLabel ||
                    'Today'}
                </div>
                <div>Status: {selectedTask.courierTaskStatus}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl fullWidth size="small">
              <InputLabel>Update Delivery Status</InputLabel>
              <Select
                value={safeDeliveryAction}
                label="Update Delivery Status"
                onChange={(event) =>
                  onDeliveryActionChange(String(event.target.value))
                }
              >
                {transitionOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Select <strong>Delivered</strong> first. After that only OTP and
              COD payment inputs will open.
            </div>
          </div>

          {isConfirmationStep && (
            <DeliveryOtpSection
              otpSent={otpSent}
              otpVerified={otpVerified}
              otpError={otpError}
              otpLooksEntered={otpLooksEntered}
              otpCooldownActive={otpCooldownActive}
              otpCooldownSeconds={otpCooldownSeconds}
              isArrivedOrBeyond={isArrivedOrBeyond}
              verifyingOtp={verifyingOtp}
              error={error}
              deliveryForm={deliveryForm}
              otpSlots={otpSlots}
              otpRefs={otpRefs}
              onSendDeliveryOtp={onSendDeliveryOtp}
              onDeliverySubmit={onDeliverySubmit}
              onOtpKeyDown={onOtpKeyDown}
              onOtpPaste={onOtpPaste}
              onOtpInputChange={onOtpInputChange}
            />
          )}
          {selectedTask.paymentType === 'COD' && isConfirmationStep && (
            <DeliveryCodSection
              deliveryForm={deliveryForm}
              setDeliveryForm={setDeliveryForm}
              uploadingProof={uploadingProof}
              onProofUpload={onProofUpload}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl size="small" fullWidth>
              <InputLabel>Status Reason</InputLabel>
              <Select
                value={safeSelectedReasonValue}
                label="Status Reason"
                onChange={(event) =>
                  setDeliveryForm((current) =>
                    deliveryAction === 'FAILED'
                      ? {
                          ...current,
                          failureReason: String(event.target.value),
                        }
                      : {
                          ...current,
                          statusReason: String(event.target.value),
                        },
                  )
                }
              >
                {currentReasonOptions.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Remark / Note"
              value={deliveryForm.statusNote}
              onChange={(event) =>
                setDeliveryForm((current) => ({
                  ...current,
                  statusNote: event.target.value,
                }))
              }
            />
          </div>

          {successMessage && <Alert severity="success">{successMessage}</Alert>}
          <DeliveryProofAndFailureSection
            isConfirmationStep={isConfirmationStep}
            isCodPayment={selectedTask.paymentType === 'COD'}
            deliveryForm={deliveryForm}
            setDeliveryForm={setDeliveryForm}
            uploadingProof={uploadingProof}
            onProofUpload={onProofUpload}
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Updated flow: Delivered click first sends Order Confirmation OTP to
            customer email. Final completion happens only after OTP
            verification. COD orders must confirm payment before OTP.
          </div>
        </div>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
      {!isConfirmationStep && (
        <Button
          variant="contained"
          onClick={() => onDeliverySubmit()}
          disabled={verifyingOtp}
        >
          {verifyingOtp ? 'Verifying OTP...' : 'Save Update'}
        </Button>
      )}
    </DialogActions>
  </Dialog>
);

export default CourierDeliveryTaskDialog;
