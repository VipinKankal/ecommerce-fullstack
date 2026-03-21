import React from 'react';
import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { formatMoney } from 'features/courier/courierData';
import {
  CourierProfile,
  DispatchQueueItem,
} from 'features/courier/courierTypes';

type AdminCourierDispatchSectionProps = {
  couriers: CourierProfile[];
  dispatchQueue: DispatchQueueItem[];
  onBatchAssign: () => void | Promise<void>;
  selectedCourierId: string;
  selectedDispatchIds: Array<number | string>;
  setSelectedCourierId: React.Dispatch<React.SetStateAction<string>>;
  toggleDispatchSelection: (id: number | string) => void;
};

const AdminCourierDispatchSection = ({
  couriers,
  dispatchQueue,
  onBatchAssign,
  selectedCourierId,
  selectedDispatchIds,
  setSelectedCourierId,
  toggleDispatchSelection,
}: AdminCourierDispatchSectionProps) => (
  <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Dispatch Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select shipments, review customer location, then assign a courier from
          the list.
        </Typography>
      </div>
      <Button
        variant="contained"
        disabled={!selectedCourierId || !selectedDispatchIds.length}
        onClick={onBatchAssign}
      >
        Assign Courier
      </Button>
    </div>

    {!!selectedDispatchIds.length && (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="text-sm text-slate-600">
          {selectedDispatchIds.length} shipment selected. Choose courier and
          assign.
        </div>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Assign Courier</InputLabel>
          <Select
            value={selectedCourierId}
            label="Assign Courier"
            onChange={(event) =>
              setSelectedCourierId(String(event.target.value))
            }
          >
            {couriers.map((courier) => (
              <MenuItem key={String(courier.id)} value={String(courier.id)}>
                {courier.fullName} - {courier.phone}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    )}

    <div className="space-y-3">
      {dispatchQueue.map((item) => {
        const selected = selectedDispatchIds.includes(item.id);
        return (
          <button
            key={String(item.id)}
            type="button"
            onClick={() => toggleDispatchSelection(item.id)}
            className={`w-full text-left rounded-3xl border p-4 transition ${
              selected
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="grid grid-cols-1 xl:grid-cols-[auto_1.2fr_1.4fr_1fr_1fr_auto] gap-3 items-center">
              <div className="font-semibold">#{item.orderId}</div>
              <div>
                <div className="font-medium">
                  {item.customerName || 'Customer'}
                </div>
                <div className="text-sm opacity-80">
                  {item.customerPhone || 'Phone pending'}
                </div>
              </div>
              <div>
                <div>{item.address || item.city || 'Address pending'}</div>
                <div className="text-sm opacity-80">
                  {item.city} - {item.zone || 'Zone pending'}
                </div>
              </div>
              <div>
                <div>{item.deliveryWindow || 'Today 2PM - 6PM'}</div>
                <div className="text-sm opacity-80">
                  {item.paymentType}{' '}
                  {item.codAmount ? formatMoney(item.codAmount) : ''}
                </div>
              </div>
              <div>
                <div>{item.paymentStatus || '-'}</div>
                <div className="text-sm opacity-80">SLA {item.slaRisk}</div>
              </div>
              <div>
                <Chip
                  size="small"
                  label={selected ? 'Selected' : 'Select'}
                  color={selected ? 'success' : 'default'}
                />
              </div>
            </div>
          </button>
        );
      })}
      {!dispatchQueue.length && (
        <Typography color="text.secondary">
          No unassigned shipments in queue.
        </Typography>
      )}
    </div>
  </Paper>
);

export default AdminCourierDispatchSection;
