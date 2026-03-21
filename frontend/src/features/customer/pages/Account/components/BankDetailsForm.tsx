import React, { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';

type Props = {
  open: boolean;
  loading?: boolean;
  initial?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  } | null;
  onClose: () => void;
  onSubmit: (payload: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  }) => Promise<void> | void;
};

const BankDetailsForm = ({
  open,
  loading = false,
  initial,
  onClose,
  onSubmit,
}: Props) => {
  const initialForm = useMemo(
    () => ({
      accountHolderName: initial?.accountHolderName || '',
      accountNumber: initial?.accountNumber || '',
      ifscCode: initial?.ifscCode || '',
      bankName: initial?.bankName || '',
      upiId: initial?.upiId || '',
    }),
    [initial],
  );
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');

  const resetForm = () => {
    setAccountHolderName(initialForm.accountHolderName);
    setAccountNumber(initialForm.accountNumber);
    setIfscCode(initialForm.ifscCode);
    setBankName(initialForm.bankName);
    setUpiId(initialForm.upiId);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      TransitionProps={{ onEnter: resetForm }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Bank Details</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="Account holder name"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            fullWidth
          />
          <TextField
            label="IFSC code"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
            fullWidth
          />
          <TextField
            label="Bank name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            fullWidth
          />
          <TextField
            label="UPI ID optional"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={
            !accountHolderName.trim() ||
            !accountNumber.trim() ||
            !ifscCode.trim() ||
            !bankName.trim() ||
            loading
          }
          onClick={() =>
            onSubmit({
              accountHolderName: accountHolderName.trim(),
              accountNumber: accountNumber.trim(),
              ifscCode: ifscCode.trim(),
              bankName: bankName.trim(),
              upiId: upiId.trim() || undefined,
            })
          }
        >
          Save Bank Details
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BankDetailsForm;
