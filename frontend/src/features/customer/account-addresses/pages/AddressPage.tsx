import React, { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import UserAddressCard from '../components/UserAddressCard';
import { Address as AddressType } from 'shared/types/user.types';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  addUserAddress,
  deleteUserAddress,
  getUserProfile,
  updateUserAddress,
} from 'State/features/customer/auth/thunks';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};

const emptyAddress: AddressType = {
  name: '',
  street: '',
  locality: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  mobileNumber: '',
};

interface AddressProps {
  title?: string;
}

const Address = ({ title = 'Saved Addresses' }: AddressProps) => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector(
    (state) => state.customerAuth,
  );
  const addresses = useMemo(() => user?.addresses || [], [user?.addresses]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | undefined>(
    undefined,
  );
  const [form, setForm] = useState<AddressType>(emptyAddress);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingAddressId(undefined);
    setForm(emptyAddress);
    setDialogOpen(true);
  };

  const openEdit = (address: AddressType) => {
    setEditingAddressId(address.id);
    setForm(address);
    setDialogOpen(true);
  };

  const handleDelete = async (addressId?: number) => {
    if (!addressId) return;
    setDeleteError(null);
    setDeletingId(addressId);
    try {
      await dispatch(deleteUserAddress(addressId)).unwrap();
      await dispatch(getUserProfile()).unwrap();
    } catch (error: unknown) {
      setDeleteError(getErrorMessage(error, 'Failed to remove address'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async () => {
    if (editingAddressId) {
      await dispatch(
        updateUserAddress({
          addressId: editingAddressId,
          payload: form,
        }),
      );
    } else {
      await dispatch(addUserAddress(form));
    }
    setDialogOpen(false);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-[#282c3f]">{title}</h1>
        <button
          className="flex items-center gap-2 text-[#526cd0] text-xs sm:text-sm font-bold border border-gray-300 px-3 py-2 hover:bg-gray-50"
          onClick={openCreate}
        >
          <AddIcon fontSize="small" />+ ADD NEW ADDRESS
        </button>
      </div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}
      {deleteError && (
        <Alert severity="error" className="mb-4">
          {deleteError}
        </Alert>
      )}

      {addresses.length === 0 ? (
        <div className="border border-gray-300 p-6 text-gray-500 text-sm">
          No addresses found. Add your first address.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((address) => (
            <UserAddressCard
              key={address.id}
              address={address}
              onEdit={openEdit}
              onDelete={handleDelete}
              deleting={deletingId === address.id}
            />
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 0,
            maxWidth: 560,
            width: '100%',
            margin: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            borderBottom: '1px solid #e5e7eb',
            fontSize: 16,
          }}
        >
          {editingAddressId ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <div className="space-y-3">
            <TextField
              margin="dense"
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              margin="dense"
              fullWidth
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <TextField
              margin="dense"
              fullWidth
              label="Street"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
            />
            <TextField
              margin="dense"
              fullWidth
              label="Locality"
              value={form.locality}
              onChange={(e) => setForm({ ...form, locality: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TextField
                margin="dense"
                fullWidth
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <TextField
                margin="dense"
                fullWidth
                label="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
              <TextField
                margin="dense"
                fullWidth
                label="Pin Code"
                value={form.pinCode}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
              />
            </div>
            <TextField
              margin="dense"
              fullWidth
              label="Mobile Number"
              value={form.mobileNumber}
              onChange={(e) =>
                setForm({ ...form, mobileNumber: e.target.value })
              }
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 0, borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{
              flex: 1,
              py: 1.6,
              borderRadius: 0,
              color: '#282c3f',
              fontWeight: 700,
            }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              flex: 1,
              py: 1.6,
              borderRadius: 0,
              bgcolor: '#ff3f6c',
              fontWeight: 700,
              '&:hover': { bgcolor: '#e7335f' },
            }}
          >
            SAVE
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Address;
