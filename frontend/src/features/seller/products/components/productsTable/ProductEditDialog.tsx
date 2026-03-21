import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { PRODUCT_DESCRIPTION_MAX_LENGTH } from '../../pages/addProductConfig';
import { ProductEditFormState } from './ProductsTable.types';

type ProductEditDialogProps = {
  open: boolean;
  editForm: ProductEditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<ProductEditFormState>>;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

const ProductEditDialog = ({
  open,
  editForm,
  setEditForm,
  onClose,
  onSave,
}: ProductEditDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Edit Product</DialogTitle>
    <DialogContent>
      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
        <TextField
          fullWidth
          label="Title"
          value={editForm.title}
          onChange={(e) =>
            setEditForm((state) => ({ ...state, title: e.target.value }))
          }
          className="sm:col-span-2"
        />
        <TextField
          fullWidth
          label="Detailed Description"
          value={editForm.description}
          onChange={(e) =>
            setEditForm((state) => ({ ...state, description: e.target.value }))
          }
          multiline
          minRows={4}
          helperText={`${editForm.description.length}/${PRODUCT_DESCRIPTION_MAX_LENGTH} characters`}
          inputProps={{ maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH }}
          className="sm:col-span-2"
        />
        <TextField
          fullWidth
          label="Selling Price"
          type="number"
          value={editForm.sellingPrice}
          onChange={(e) =>
            setEditForm((state) => ({ ...state, sellingPrice: e.target.value }))
          }
        />
        <TextField
          fullWidth
          label="MRP Price"
          type="number"
          value={editForm.mrpPrice}
          onChange={(e) =>
            setEditForm((state) => ({ ...state, mrpPrice: e.target.value }))
          }
        />
        <TextField
          fullWidth
          label="Quantity"
          type="number"
          value={editForm.quantity}
          onChange={(e) =>
            setEditForm((state) => ({ ...state, quantity: e.target.value }))
          }
        />
        <TextField
          fullWidth
          label="Color"
          value={editForm.color}
          onChange={(e) =>
            setEditForm((state) => ({ ...state, color: e.target.value }))
          }
        />
        <TextField
          fullWidth
          label="Sizes"
          value={editForm.sizes}
          onChange={(e) =>
            setEditForm((state) => ({ ...state, sizes: e.target.value }))
          }
          className="sm:col-span-2"
        />
      </div>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onSave}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
);

export default ProductEditDialog;
