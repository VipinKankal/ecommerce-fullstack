import { TextField, Box } from '@mui/material';

const BecomeSellerFormStep3 = ({ formik }: any) => (
  <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <h2 className="md:col-span-2 text-xl font-bold">Pickup Address</h2>
    <TextField
      fullWidth
      name="pickupAddress.name"
      label="Contact Name"
      value={formik.values.pickupAddress.name}
      onChange={formik.handleChange}
      error={formik.touched.pickupAddress?.name && Boolean(formik.errors.pickupAddress?.name)}
      helperText={formik.touched.pickupAddress?.name && formik.errors.pickupAddress?.name}
    />
    <TextField
      fullWidth
      name="pickupAddress.mobile"
      label="Pickup Mobile Number"
      value={formik.values.pickupAddress.mobile}
      onChange={formik.handleChange}
      error={formik.touched.pickupAddress?.mobile && Boolean(formik.errors.pickupAddress?.mobile)}
      helperText={formik.touched.pickupAddress?.mobile && formik.errors.pickupAddress?.mobile}
    />
    <TextField
      className="md:col-span-2"
      fullWidth
      name="pickupAddress.address"
      label="Address"
      value={formik.values.pickupAddress.address}
      onChange={formik.handleChange}
      error={formik.touched.pickupAddress?.address && Boolean(formik.errors.pickupAddress?.address)}
      helperText={formik.touched.pickupAddress?.address && formik.errors.pickupAddress?.address}
    />
    <TextField
      fullWidth
      name="pickupAddress.locality"
      label="Locality"
      value={formik.values.pickupAddress.locality}
      onChange={formik.handleChange}
    />
    <TextField
      fullWidth
      name="pickupAddress.city"
      label="City"
      value={formik.values.pickupAddress.city}
      onChange={formik.handleChange}
      error={formik.touched.pickupAddress?.city && Boolean(formik.errors.pickupAddress?.city)}
      helperText={formik.touched.pickupAddress?.city && formik.errors.pickupAddress?.city}
    />
    <TextField
      fullWidth
      name="pickupAddress.state"
      label="State"
      value={formik.values.pickupAddress.state}
      onChange={formik.handleChange}
      error={formik.touched.pickupAddress?.state && Boolean(formik.errors.pickupAddress?.state)}
      helperText={formik.touched.pickupAddress?.state && formik.errors.pickupAddress?.state}
    />
    <TextField
      fullWidth
      name="pickupAddress.pincode"
      label="Pincode"
      value={formik.values.pickupAddress.pincode}
      onChange={formik.handleChange}
      error={formik.touched.pickupAddress?.pincode && Boolean(formik.errors.pickupAddress?.pincode)}
      helperText={formik.touched.pickupAddress?.pincode && formik.errors.pickupAddress?.pincode}
    />
    <TextField
      fullWidth
      name="pickupAddress.country"
      label="Country"
      value={formik.values.pickupAddress.country}
      onChange={formik.handleChange}
      error={formik.touched.pickupAddress?.country && Boolean(formik.errors.pickupAddress?.country)}
      helperText={formik.touched.pickupAddress?.country && formik.errors.pickupAddress?.country}
    />
  </Box>
);
export default BecomeSellerFormStep3;

