import { TextField, Box } from '@mui/material';

const BecomeSellerFormStep4 = ({ formik }: any) => (
  <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <h2 className="md:col-span-2 text-xl font-bold">Bank Details</h2>
    <TextField
      fullWidth
      name="bankDetails.accountHolderName"
      label="Account Holder Name"
      value={formik.values.bankDetails.accountHolderName}
      onChange={formik.handleChange}
      error={formik.touched.bankDetails?.accountHolderName && Boolean(formik.errors.bankDetails?.accountHolderName)}
      helperText={formik.touched.bankDetails?.accountHolderName && formik.errors.bankDetails?.accountHolderName}
    />
    <TextField
      fullWidth
      name="bankDetails.bankName"
      label="Bank Name"
      value={formik.values.bankDetails.bankName}
      onChange={formik.handleChange}
      error={formik.touched.bankDetails?.bankName && Boolean(formik.errors.bankDetails?.bankName)}
      helperText={formik.touched.bankDetails?.bankName && formik.errors.bankDetails?.bankName}
    />
    <TextField
      fullWidth
      name="bankDetails.accountNumber"
      label="Account Number"
      value={formik.values.bankDetails.accountNumber}
      onChange={formik.handleChange}
      error={formik.touched.bankDetails?.accountNumber && Boolean(formik.errors.bankDetails?.accountNumber)}
      helperText={formik.touched.bankDetails?.accountNumber && formik.errors.bankDetails?.accountNumber}
    />
    <TextField
      fullWidth
      name="bankDetails.ifscCode"
      label="IFSC Code"
      value={formik.values.bankDetails.ifscCode}
      onChange={formik.handleChange}
      error={formik.touched.bankDetails?.ifscCode && Boolean(formik.errors.bankDetails?.ifscCode)}
      helperText={formik.touched.bankDetails?.ifscCode && formik.errors.bankDetails?.ifscCode}
    />
  </Box>
);
export default BecomeSellerFormStep4;

