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
  Stack,
  TextField,
} from '@mui/material';
import { CancelReasonOption } from '../../orderDetailsTypes';

type OrderDetailsDialogsProps = {
  cancelDialogOpen: boolean;
  selectedCancelReason: string;
  cancelReasonText: string;
  cancelReasonOptions: CancelReasonOption[];
  loading: boolean;
  onCloseCancel: () => void;
  onCancelReasonChange: (value: string) => void;
  onCancelReasonTextChange: (value: string) => void;
  onConfirmCancel: () => void;
  differenceDialogOpen: boolean;
  exchangeActionLoading: boolean;
  paymentReference: string;
  onCloseDifference: () => void;
  onPaymentReferenceChange: (value: string) => void;
  onSubmitDifference: () => void;
};

const OrderDetailsDialogs = ({
  cancelDialogOpen,
  selectedCancelReason,
  cancelReasonText,
  cancelReasonOptions,
  loading,
  onCloseCancel,
  onCancelReasonChange,
  onCancelReasonTextChange,
  onConfirmCancel,
  differenceDialogOpen,
  exchangeActionLoading,
  paymentReference,
  onCloseDifference,
  onPaymentReferenceChange,
  onSubmitDifference,
}: OrderDetailsDialogsProps) => (
  <>
    <Dialog
      open={cancelDialogOpen}
      onClose={onCloseCancel}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
    >
      <DialogTitle className="font-black text-2xl">Cancel Order</DialogTitle>
      <DialogContent className="space-y-4">
        <p className="text-gray-500 text-sm">
          Please let us know why you are cancelling your order. This helps us
          improve our service.
        </p>
        <FormControl fullWidth margin="normal">
          <InputLabel id="cancel-reason-label">Select Reason</InputLabel>
          <Select
            labelId="cancel-reason-label"
            value={selectedCancelReason}
            label="Select Reason"
            onChange={(event) =>
              onCancelReasonChange(String(event.target.value))
            }
            sx={{ borderRadius: '12px' }}
          >
            {cancelReasonOptions.map((reason) => (
              <MenuItem key={reason.code} value={reason.code}>
                {reason.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Additional comments"
          placeholder="Tell us more..."
          value={cancelReasonText}
          onChange={(event) => onCancelReasonTextChange(event.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onCloseCancel}
          sx={{ fontWeight: 'bold', color: 'gray' }}
        >
          Stay with Order
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={!selectedCancelReason || loading}
          onClick={onConfirmCancel}
          sx={{
            borderRadius: '10px',
            px: 4,
            fontWeight: 'bold',
            boxShadow: 'none',
          }}
        >
          Confirm Cancellation
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog
      open={differenceDialogOpen}
      onClose={exchangeActionLoading ? undefined : onCloseDifference}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Difference Payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="warning">
            Please submit the payment reference after collecting the extra
            amount from the customer.
          </Alert>
          <TextField
            label="Payment reference"
            value={paymentReference}
            onChange={(event) => onPaymentReferenceChange(event.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onCloseDifference} disabled={exchangeActionLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmitDifference}
          disabled={exchangeActionLoading || !paymentReference.trim()}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  </>
);

export default OrderDetailsDialogs;
