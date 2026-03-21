import React from 'react';
import { Radio } from '@mui/material';
import { Address } from 'shared/types/user.types';

interface Props {
  address: Address;
  selected: boolean;
  onSelect: (address: Address) => void;
  badgeLabel?: string;
  showActions?: boolean;
  onEdit?: (address: Address) => void;
  onRemove?: (address: Address) => void;
}

const AddressCard = ({
  address,
  selected,
  onSelect,
  badgeLabel = 'SAVED',
  showActions = false,
  onEdit,
  onRemove,
}: Props) => {
  return (
    <div
      className={`p-5 border rounded-xl flex items-start gap-4 bg-white transition-all cursor-pointer ${
        selected ? 'border-teal-500 bg-teal-50/30' : 'hover:border-teal-500'
      }`}
      onClick={() => onSelect(address)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(address);
        }
      }}
    >
      <Radio
        checked={selected}
        sx={{ color: 'gray', '&.Mui-checked': { color: '#008080' } }}
      />
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-3">
          <p className="font-bold text-gray-800">{address.name}</p>
          <span className="bg-gray-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            {badgeLabel}
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {address.address}
          {address.street ? `, ${address.street}` : ''}
          <br />
          {[address.locality, address.city, address.state]
            .filter(Boolean)
            .join(', ')}{' '}
          - {address.pinCode}
        </p>
        <p className="text-sm font-semibold text-gray-700 pt-2">
          Mobile: <span className="text-gray-500">{address.mobileNumber}</span>
        </p>
        {showActions && (
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="text-xs font-semibold border border-gray-300 px-3 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(address);
              }}
            >
              REMOVE
            </button>
            <button
              type="button"
              className="text-xs font-semibold border border-gray-900 px-3 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(address);
              }}
            >
              EDIT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
