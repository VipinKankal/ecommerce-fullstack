import { Box, MenuItem, TextField } from '@mui/material';

const BecomeSellerFormStep2 = ({ formik }: any) => (
  <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <h2 className="md:col-span-2 text-xl font-bold text-gray-700">Business Information</h2>
    <TextField
      fullWidth
      name="businessDetails.businessName"
      label="Business Name"
      value={formik.values.businessDetails.businessName}
      onChange={formik.handleChange}
      error={
        formik.touched.businessDetails?.businessName &&
        Boolean(formik.errors.businessDetails?.businessName)
      }
      helperText={
        formik.touched.businessDetails?.businessName &&
        formik.errors.businessDetails?.businessName
      }
    />
    <TextField
      select
      fullWidth
      name="businessDetails.businessType"
      label="Business Type"
      value={formik.values.businessDetails.businessType}
      onChange={formik.handleChange}
      error={
        formik.touched.businessDetails?.businessType &&
        Boolean(formik.errors.businessDetails?.businessType)
      }
      helperText={
        formik.touched.businessDetails?.businessType &&
        formik.errors.businessDetails?.businessType
      }
    >
      {[
        { label: "Individual", value: "INDIVIDUAL" },
        { label: "Company", value: "COMPANY" },
      ].map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
    <TextField
      fullWidth
      name="gstin"
      label="GST Number"
      value={formik.values.gstin}
      onChange={formik.handleChange}
      error={formik.touched.gstin && Boolean(formik.errors.gstin)}
      helperText={formik.touched.gstin && formik.errors.gstin}
    />
    <TextField
      fullWidth
      name="businessDetails.panNumber"
      label="PAN Number"
      value={formik.values.businessDetails.panNumber}
      onChange={formik.handleChange}
      error={
        formik.touched.businessDetails?.panNumber &&
        Boolean(formik.errors.businessDetails?.panNumber)
      }
      helperText={
        formik.touched.businessDetails?.panNumber &&
        formik.errors.businessDetails?.panNumber
      }
    />
  </Box>
);
export default BecomeSellerFormStep2;

