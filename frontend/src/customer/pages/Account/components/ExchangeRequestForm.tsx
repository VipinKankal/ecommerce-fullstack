import React, { ChangeEvent, useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";

type ProductOption = { id: number | string; title: string };

type ExchangeRequestFormProps = {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  orderItemTitle?: string;
  productOptions: ProductOption[];
  onClose: () => void;
  onSubmit: (payload: { exchangeReason: string; comment?: string; productPhoto?: string; requestedVariant?: string; requestedNewProductId: number | string }) => Promise<void> | void;
};

const ExchangeRequestForm = ({ open, loading = false, error, orderItemTitle, productOptions, onClose, onSubmit }: ExchangeRequestFormProps) => {
  const [exchangeReason, setExchangeReason] = useState("");
  const [comment, setComment] = useState("");
  const [requestedVariant, setRequestedVariant] = useState("");
  const [requestedNewProductId, setRequestedNewProductId] = useState<string>("");
  const [productPhotoName, setProductPhotoName] = useState("");

  useEffect(() => {
    if (!open) return;
    setExchangeReason("");
    setComment("");
    setRequestedVariant("");
    setRequestedNewProductId(productOptions[0] ? String(productOptions[0].id) : "");
    setProductPhotoName("");
  }, [open, productOptions]);

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProductPhotoName(file?.name || "");
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 900, fontSize: 26 }}>Exchange</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <div>
            <Typography variant="body2" color="text.secondary">Exchanging</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{orderItemTitle || "Selected item"}</Typography>
          </div>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Exchange reason" value={exchangeReason} onChange={(e) => setExchangeReason(e.target.value)} fullWidth />
          <TextField label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} fullWidth multiline minRows={3} />
          <Button variant="outlined" component="label" sx={{ justifyContent: "flex-start" }}>
            {productPhotoName ? `Photo: ${productPhotoName}` : "Upload product photo"}
            <input hidden type="file" accept="image/*" onChange={handlePhoto} />
          </Button>
          <TextField label="Requested variant" value={requestedVariant} onChange={(e) => setRequestedVariant(e.target.value)} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="requested-new-product">Requested new product</InputLabel>
            <Select labelId="requested-new-product" value={requestedNewProductId} label="Requested new product" onChange={(e) => setRequestedNewProductId(String(e.target.value))}>
              {productOptions.map((option) => <MenuItem key={String(option.id)} value={String(option.id)}>{option.title}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" disabled={!exchangeReason.trim() || !requestedNewProductId || loading} onClick={() => onSubmit({ exchangeReason: exchangeReason.trim(), comment: comment.trim() || undefined, productPhoto: productPhotoName || undefined, requestedVariant: requestedVariant.trim() || undefined, requestedNewProductId })}> {loading ? "Submitting..." : "Submit Exchange"} </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExchangeRequestForm;
