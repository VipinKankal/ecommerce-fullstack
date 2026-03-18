import { Box, MenuItem, TextField } from '@mui/material';

const BecomeSellerFormStep1 = ({ formik }: any) => (
  <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <h2 className="md:col-span-2 text-xl font-bold">Personal Information</h2>
    <TextField
      fullWidth
      name="sellerName"
      label="Full Name"
      value={formik.values.sellerName}
      onChange={formik.handleChange}
      error={formik.touched.sellerName && Boolean(formik.errors.sellerName)}
      helperText={formik.touched.sellerName && formik.errors.sellerName}
    />
    <TextField
      fullWidth
      name="mobile"
      label="Mobile Number"
      value={formik.values.mobile}
      onChange={formik.handleChange}
      error={formik.touched.mobile && Boolean(formik.errors.mobile)}
      helperText={formik.touched.mobile && formik.errors.mobile}
    />
    <TextField
      fullWidth
      name="email"
      label="Email ID"
      value={formik.values.email}
      onChange={formik.handleChange}
      error={formik.touched.email && Boolean(formik.errors.email)}
      helperText={formik.touched.email && formik.errors.email}
    />
    <TextField
      fullWidth
      name="password"
      type="password"
      label="Password"
      value={formik.values.password}
      onChange={formik.handleChange}
      error={formik.touched.password && Boolean(formik.errors.password)}
      helperText={formik.touched.password && formik.errors.password}
    />
    <TextField
      fullWidth
      name="dateOfBirth"
      type="date"
      label="Date of Birth"
      value={formik.values.dateOfBirth}
      onChange={formik.handleChange}
      InputLabelProps={{ shrink: true }}
      error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
      helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
    />
    <TextField
      select
      fullWidth
      name="storeDetails.primaryCategory"
      label="Product Category"
      value={formik.values.storeDetails.primaryCategory}
      onChange={formik.handleChange}
      error={
        formik.touched.storeDetails?.primaryCategory &&
        Boolean(formik.errors.storeDetails?.primaryCategory)
      }
      helperText={
        formik.touched.storeDetails?.primaryCategory &&
        formik.errors.storeDetails?.primaryCategory
      }
    >
      {["Electronics", "Clothing", "Shoes", "Furniture", "Beauty", "Accessories"].map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  </Box>
);
export default BecomeSellerFormStep1;

