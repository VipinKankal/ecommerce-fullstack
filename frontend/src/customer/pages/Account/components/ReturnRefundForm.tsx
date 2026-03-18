import React, { ChangeEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type ReturnRefundFormProps = {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  orderItemTitle?: string;
  onClose: () => void;
  onSubmit: (payload: {
    returnReason: string;
    comment?: string;
    productPhoto?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  }) => Promise<void> | void;
};

const ReturnRefundForm = ({ open, loading = false, error, orderItemTitle, onClose, onSubmit }: ReturnRefundFormProps) => {
  const [returnReason, setReturnReason] = useState("");
  const [comment, setComment] = useState("");
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [productPhotoName, setProductPhotoName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    if (!open) return;
    setReturnReason("");
    setComment("");
    setProductPhoto(null);
    setProductPhotoName("");
    setAccountHolderName("");
    setAccountNumber("");
    setIfscCode("");
    setBankName("");
    setUpiId("");
  }, [open]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProductPhoto(file);
    setProductPhotoName(file?.name || "");
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 900, fontSize: 26 }}>Return & Refund</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Requesting return for</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{orderItemTitle || "Selected item"}</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Return reason" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} fullWidth />
          <TextField label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} fullWidth multiline minRows={3} />
          <Button variant="outlined" component="label" sx={{ justifyContent: "flex-start" }}>
            {productPhotoName ? `Photo: ${productPhotoName}` : "Upload product photo"}
            <input hidden type="file" accept="image/*" onChange={handlePhotoChange} />
          </Button>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Refund Details</Typography>
          <TextField label="Account holder name" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} fullWidth />
          <TextField label="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} fullWidth />
          <TextField label="IFSC code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} fullWidth />
          <TextField label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} fullWidth />
          <TextField label="UPI ID" value={upiId} onChange={(e) => setUpiId(e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!returnReason.trim() || loading}
          onClick={() => onSubmit({
            returnReason: returnReason.trim(),
            comment: comment.trim() || undefined,
            productPhoto: productPhotoName || undefined,
            accountHolderName: accountHolderName.trim() || undefined,
            accountNumber: accountNumber.trim() || undefined,
            ifscCode: ifscCode.trim() || undefined,
            bankName: bankName.trim() || undefined,
            upiId: upiId.trim() || undefined,
          })}
          sx={{ borderRadius: "12px", px: 3.5, fontWeight: 800, boxShadow: "none" }}
        >
          {loading ? "Submitting..." : "Submit Return"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReturnRefundForm;
