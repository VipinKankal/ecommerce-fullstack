import React, { ChangeEvent, useMemo, useState } from 'react';
import {
  Alert,
  Box,
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
  Typography,
} from '@mui/material';
import type { ReturnExchangeType } from 'State/features/customer/returns/slice';

const REQUEST_REASON_OPTIONS: Record<
  ReturnExchangeType,
  Array<{ value: string; label: string }>
> = {
  RETURN: [
    { value: 'DAMAGED_ITEM', label: 'Damaged item received' },
    { value: 'WRONG_ITEM', label: 'Wrong item delivered' },
    { value: 'QUALITY_ISSUE', label: 'Quality issue' },
    { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
    { value: 'OTHER', label: 'Other' },
  ],
  EXCHANGE: [
    { value: 'SIZE_ISSUE', label: 'Size issue' },
    { value: 'COLOR_VARIANT', label: 'Need another color or variant' },
    { value: 'WRONG_ITEM', label: 'Wrong item delivered' },
    { value: 'QUALITY_ISSUE', label: 'Quality issue' },
    { value: 'OTHER', label: 'Other' },
  ],
};

type ReturnExchangeRequestDialogProps = {
  open: boolean;
  requestType: ReturnExchangeType;
  loading?: boolean;
  error?: string | null;
  orderItemTitle?: string;
  onClose: () => void;
  onSubmit: (payload: {
    reasonCode: string;
    description?: string;
    imageFile?: File | null;
  }) => Promise<void> | void;
};

const ReturnExchangeRequestDialog = ({
  open,
  requestType,
  loading = false,
  error,
  orderItemTitle,
  onClose,
  onSubmit,
}: ReturnExchangeRequestDialogProps) => {
  const [reasonCode, setReasonCode] = useState(
    REQUEST_REASON_OPTIONS[requestType][0]?.value || '',
  );
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const reasonOptions = useMemo(
    () => REQUEST_REASON_OPTIONS[requestType],
    [requestType],
  );
  const defaultReasonCode = reasonOptions[0]?.value || '';

  const resetForm = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setReasonCode(defaultReasonCode);
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    if (!reasonCode) return;
    await onSubmit({
      reasonCode,
      description: description.trim() || undefined,
      imageFile,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const title =
    requestType === 'RETURN' ? 'Return Request' : 'Exchange Request';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      TransitionProps={{ onEnter: resetForm }}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 900, fontSize: 28 }}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Requesting for
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {orderItemTitle || 'Selected order item'}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth>
            <InputLabel id="return-exchange-reason-label">
              {requestType === 'RETURN' ? 'Return reason' : 'Exchange reason'}
            </InputLabel>
            <Select
              labelId="return-exchange-reason-label"
              value={reasonCode}
              label={
                requestType === 'RETURN' ? 'Return reason' : 'Exchange reason'
              }
              onChange={(event) => setReasonCode(String(event.target.value))}
              sx={{ borderRadius: '12px' }}
            >
              {reasonOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Description"
            placeholder="Tell us what happened and what resolution you expect."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <Stack spacing={1.25}>
            <Button
              variant="outlined"
              component="label"
              sx={{
                borderRadius: '12px',
                justifyContent: 'flex-start',
                py: 1.5,
              }}
            >
              {imageFile ? `Image: ${imageFile.name}` : 'Upload image'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Image upload is included in the UI and the selected file name is
              sent with the request for backend processing.
            </Typography>
            {imagePreview && (
              <Box
                component="img"
                src={imagePreview}
                alt="Selected return evidence"
                sx={{
                  width: 112,
                  height: 112,
                  objectFit: 'cover',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ fontWeight: 700, color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!reasonCode || loading}
          onClick={handleSubmit}
          sx={{
            borderRadius: '12px',
            px: 3.5,
            fontWeight: 800,
            boxShadow: 'none',
          }}
        >
          {loading ? 'Submitting...' : `Submit ${title}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReturnExchangeRequestDialog;
