import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (balanceMode: "WALLET" | "BANK_TRANSFER") => Promise<void> | void;
};

const BalanceSelectionForm = ({ open, loading = false, onClose, onSubmit }: Props) => {
  const [balanceMode, setBalanceMode] = useState<"WALLET" | "BANK_TRANSFER">("WALLET");
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Select Balance Handling</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">Choose how the remaining balance should be handled when the new product price is lower than the old product price.</Typography>
          <FormControl fullWidth>
            <InputLabel id="balance-mode">Balance mode</InputLabel>
            <Select labelId="balance-mode" value={balanceMode} label="Balance mode" onChange={(e) => setBalanceMode(e.target.value as any)}>
              <MenuItem value="WALLET">Store in Wallet</MenuItem>
              <MenuItem value="BANK_TRANSFER">Transfer to Bank</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(balanceMode)} disabled={loading}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BalanceSelectionForm;
