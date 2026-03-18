import React from "react";
import { TextField } from "@mui/material";

interface ShippingAddressForm {
  name: string;
  mobileNumber: string;
  address: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

interface Props {
  value: ShippingAddressForm;
  onChange: (field: keyof ShippingAddressForm, value: string) => void;
}

const AddressForm = ({ value, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        label="Recipient Full Name"
        placeholder="Enter delivery recipient name"
        value={value.name}
        onChange={(e) => onChange("name", e.target.value)}
        fullWidth
      />
      <TextField
        label="Recipient Mobile Number"
        placeholder="Enter delivery contact number"
        value={value.mobileNumber}
        onChange={(e) => onChange("mobileNumber", e.target.value)}
        fullWidth
      />
      <TextField
        label="House / Flat / Building Address"
        placeholder="Flat number, building name, area"
        value={value.address}
        onChange={(e) => onChange("address", e.target.value)}
        fullWidth
        multiline
        rows={2}
        className="md:col-span-2"
      />
      <TextField
        label="Street / Road"
        placeholder="Street or road name"
        value={value.street}
        onChange={(e) => onChange("street", e.target.value)}
        fullWidth
      />
      <TextField
        label="Locality / Landmark"
        placeholder="Locality or nearby landmark"
        value={value.locality}
        onChange={(e) => onChange("locality", e.target.value)}
        fullWidth
      />
      <TextField
        label="City"
        placeholder="City"
        value={value.city}
        onChange={(e) => onChange("city", e.target.value)}
        fullWidth
      />
      <TextField
        label="State"
        placeholder="State"
        value={value.state}
        onChange={(e) => onChange("state", e.target.value)}
        fullWidth
      />
      <TextField
        label="Pincode"
        placeholder="6-digit pincode"
        value={value.pinCode}
        onChange={(e) => onChange("pinCode", e.target.value)}
        fullWidth
      />
    </div>
  );
};

export default AddressForm;

