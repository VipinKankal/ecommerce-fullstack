import React from 'react';
import { Chip } from '@mui/material';
import { Address } from 'shared/types/user.types';

interface Props {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId?: number) => void;
  deleting?: boolean;
}

const UserAddressCard = ({ address, onEdit, onDelete, deleting }: Props) => {
  return (
    <div className="border border-gray-300 bg-white">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="font-semibold text-[#282c3f] text-sm sm:text-base truncate">
            {address.name}
          </h1>
          <Chip
            label="HOME"
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 700,
              bgcolor: '#f4f4f5',
            }}
          />
        </div>

        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          {address.address}, {address.locality}, {address.city}, {address.state}{' '}
          {address.pinCode}
        </p>
        <p className="text-xs sm:text-sm text-gray-700 mt-1">
          Mobile: {address.mobileNumber}
        </p>
      </div>

      <div className="grid grid-cols-2 border-t border-gray-200">
        <button
          className="py-2.5 text-xs sm:text-sm font-bold text-[#526cd0] hover:bg-gray-50"
          onClick={() => onEdit(address)}
        >
          EDIT
        </button>
        <button
          className="py-2.5 text-xs sm:text-sm font-bold text-[#526cd0] border-l border-gray-200 hover:bg-gray-50 disabled:opacity-60"
          onClick={() => onDelete(address.id)}
          disabled={deleting}
        >
          {deleting ? 'REMOVING...' : 'REMOVE'}
        </button>
      </div>
    </div>
  );
};

export default UserAddressCard;
