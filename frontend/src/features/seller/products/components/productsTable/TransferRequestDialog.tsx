import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Product } from 'shared/types/product.types';
import { PickupMode } from './ProductsTable.types';

type Props = {
  transferProduct: Product | null;
  transferQuantity: string;
  setTransferQuantity: (value: string) => void;
  transferPickupMode: PickupMode;
  setTransferPickupMode: (value: PickupMode) => void;
  transferSellerNote: string;
  setTransferSellerNote: (value: string) => void;
  transferringId: number | null;
  onClose: () => void;
  onSubmit: () => void;
};

const TransferRequestDialog = ({
  transferProduct,
  transferQuantity,
  setTransferQuantity,
  transferPickupMode,
  setTransferPickupMode,
  transferSellerNote,
  setTransferSellerNote,
  transferringId,
  onClose,
  onSubmit,
}: Props) => (
  <Dialog open={Boolean(transferProduct)} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Create Warehouse Transfer Request</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Seller transfer request banayega. Stock deduction tabhi hoga jab
        warehouse receive mark karega.
      </Typography>
      <Stack spacing={2}>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            fullWidth
            label="Transfer Quantity"
            type="number"
            value={transferQuantity}
            onChange={(event) => setTransferQuantity(event.target.value)}
            inputProps={{
              min: 1,
              max: Number(transferProduct?.sellerStock ?? 0),
            }}
          />
          <TextField
            select
            fullWidth
            label="Pickup Mode"
            value={transferPickupMode}
            onChange={(event) => setTransferPickupMode(event.target.value as PickupMode)}
          >
            <MenuItem value="WAREHOUSE_PICKUP">Warehouse Pickup</MenuItem>
            <MenuItem value="SELLER_DROP">Seller Drop</MenuItem>
          </TextField>
        </div>

        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Transfer Note (optional)"
          value={transferSellerNote}
          onChange={(event) => setTransferSellerNote(event.target.value)}
          placeholder="Example: pickup address landmark, ready timing, contact person"
        />

        <Alert severity="info">
          {transferProduct
            ? `Available seller stock: ${transferProduct.sellerStock ?? 0}`
            : 'Choose quantity'}
        </Alert>
        {transferPickupMode === 'SELLER_DROP' ? (
          <Alert severity="success">
            Seller drop mode: courier assign nahi hoga. Admin approval ke baad
            seller stock warehouse par drop karega.
          </Alert>
        ) : (
          <Alert severity="warning">
            Warehouse pickup mode: admin approve ke baad manager logistics plan
            karega, courier/transport assign karega, phir pickup hoga.
          </Alert>
        )}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={
          !transferProduct ||
          transferringId === transferProduct.id ||
          Number(transferQuantity) <= 0
        }
      >
        Create Request
      </Button>
    </DialogActions>
  </Dialog>
);

export default TransferRequestDialog;
