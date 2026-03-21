import React from 'react';
import { Address } from 'shared/types/user.types';
import AddressCard from '../../pages/Checkout/AddressCard';

interface Props {
  addresses: Address[];
  selectedAddressId: number | null;
  useManualAddress: boolean;
  onSelect: (address: Address) => void;
}

const AddressSelectionList = ({
  addresses,
  selectedAddressId,
  useManualAddress,
  onSelect,
}: Props) => {
  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          selected={!useManualAddress && selectedAddressId === address.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default AddressSelectionList;
