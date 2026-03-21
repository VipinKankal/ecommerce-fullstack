import React from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { statusTone } from 'features/courier/courierData';
import { CourierProfile } from 'features/courier/courierTypes';
import { NewCourierForm, SalaryConfigForm } from '../../types';

const replacementSeparator = ' \uFFFD ';

type AdminCourierCouriersSectionProps = {
  codFrequency: string;
  couriers: CourierProfile[];
  newCourier: NewCourierForm;
  onCreateCourier: () => void | Promise<void>;
  onOpenProfile: (courierId: string) => void;
  onSaveControls: () => void | Promise<void>;
  onUpdateSalary: () => void | Promise<void>;
  salaryConfig: SalaryConfigForm;
  selectedCourierId: string;
  setCodFrequency: React.Dispatch<React.SetStateAction<string>>;
  setNewCourier: React.Dispatch<React.SetStateAction<NewCourierForm>>;
  setSalaryConfig: React.Dispatch<React.SetStateAction<SalaryConfigForm>>;
  setSelectedCourierId: React.Dispatch<React.SetStateAction<string>>;
  setStatusUpdate: React.Dispatch<React.SetStateAction<string>>;
  statusUpdate: string;
};

const AdminCourierCouriersSection = ({
  codFrequency,
  couriers,
  newCourier,
  onCreateCourier,
  onOpenProfile,
  onSaveControls,
  onUpdateSalary,
  salaryConfig,
  selectedCourierId,
  setCodFrequency,
  setNewCourier,
  setSalaryConfig,
  setSelectedCourierId,
  setStatusUpdate,
  statusUpdate,
}: AdminCourierCouriersSectionProps) => (
  <div className="grid grid-cols-1 2xl:grid-cols-[1.05fr_1fr] gap-6">
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Add Courier
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(newCourier).map(([key, value]) => (
          <TextField
            key={key}
            size="small"
            label={key}
            value={value}
            onChange={(event) =>
              setNewCourier((current) => ({
                ...current,
                [key]: event.target.value,
              }))
            }
          />
        ))}
      </div>
      <Button variant="contained" onClick={onCreateCourier}>
        Create Courier
      </Button>

      <Box sx={{ pt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Couriers Management Table
        </Typography>
        <div className="space-y-3">
          {couriers.map((courier) => (
            <div
              key={String(courier.id)}
              className="rounded-3xl border border-slate-200 p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="font-semibold text-slate-900">
                  {courier.fullName}
                </div>
                <div className="text-sm text-slate-500">
                  {courier.phone}
                  {replacementSeparator}
                  {courier.city || '-'}
                  {replacementSeparator}
                  Zone {courier.zone || 'Unassigned'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  size="small"
                  label={courier.status}
                  color={statusTone(courier.status)}
                />
                <Chip
                  size="small"
                  label={`KYC ${courier.kycStatus || 'PENDING'}`}
                  color={statusTone(courier.kycStatus)}
                  variant="outlined"
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onOpenProfile(String(courier.id))}
                >
                  View Profile
                </Button>
              </div>
            </div>
          ))}
          {!couriers.length && (
            <Typography color="text.secondary">
              No couriers found yet.
            </Typography>
          )}
        </div>
      </Box>
    </Paper>

    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Courier Controls
      </Typography>
      <FormControl fullWidth size="small">
        <InputLabel>Courier</InputLabel>
        <Select
          value={selectedCourierId}
          label="Courier"
          onChange={(event) => setSelectedCourierId(String(event.target.value))}
        >
          {couriers.map((courier) => (
            <MenuItem key={String(courier.id)} value={String(courier.id)}>
              {courier.fullName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormControl size="small" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusUpdate}
            label="Status"
            onChange={(event) => setStatusUpdate(String(event.target.value))}
          >
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>COD Frequency</InputLabel>
          <Select
            value={codFrequency}
            label="COD Frequency"
            onChange={(event) => setCodFrequency(String(event.target.value))}
          >
            <MenuItem value="DAILY">DAILY</MenuItem>
            <MenuItem value="WEEKLY">WEEKLY</MenuItem>
            <MenuItem value="CUSTOM">CUSTOM</MenuItem>
          </Select>
        </FormControl>
      </div>

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Salary Configuration
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(salaryConfig).map(([key, value]) => (
          <TextField
            key={key}
            size="small"
            label={key}
            value={value}
            onChange={(event) =>
              setSalaryConfig((current) => ({
                ...current,
                [key]: event.target.value,
              }))
            }
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outlined"
          onClick={onSaveControls}
          disabled={!selectedCourierId}
        >
          Save Controls
        </Button>
        <Button
          variant="contained"
          onClick={onUpdateSalary}
          disabled={!selectedCourierId}
        >
          Update Salary Config
        </Button>
      </div>
    </Paper>
  </div>
);

export default AdminCourierCouriersSection;
