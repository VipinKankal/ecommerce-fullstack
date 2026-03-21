import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  adminUpdateUserStatus,
  adminUsersList,
} from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';

type AdminUserRow = {
  id: number;
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  role?: string;
  accountStatus?: string;
};

const AdminUsers = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const [query, setQuery] = useState('');
  const users = useMemo(
    () =>
      Array.isArray(responses.adminUsersList) ? responses.adminUsersList : [],
    [responses.adminUsersList],
  );

  useEffect(() => {
    dispatch(adminUsersList());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (users as AdminUserRow[]).filter((user) => {
      const text = [
        user.fullName,
        user.email,
        user.mobileNumber,
        user.role,
        user.accountStatus,
      ]
        .join(' ')
        .toLowerCase();
      return !search || text.includes(search);
    });
  }, [query, users]);

  const handleStatusUpdate = async (id: number, status: string) => {
    await dispatch(adminUpdateUserStatus({ id, status })).unwrap();
    await dispatch(adminUsersList()).unwrap();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin-level user account status visibility and control.
          </Typography>
        </div>
        <TextField
          size="small"
          placeholder="Search user"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {user.fullName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {user.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.mobileNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={user.role} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={
                        user.accountStatus === 'ACTIVE' ? 'success' : 'warning'
                      }
                      label={user.accountStatus}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={user.accountStatus}
                        label="Status"
                        onChange={(e) =>
                          handleStatusUpdate(user.id, e.target.value)
                        }
                      >
                        {[
                          'ACTIVE',
                          'DEACTIVATED',
                          'SUSPENDED',
                          'BANNED',
                          'CLOSED',
                        ].map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminUsers;
