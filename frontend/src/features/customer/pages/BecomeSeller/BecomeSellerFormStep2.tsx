import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import { SellerAccountFormik } from './types';

const BecomeSellerFormStep2 = ({ formik }: { formik: SellerAccountFormik }) => {
  const nonGstMode = formik.values.gstRegistrationType === 'NON_GST_DECLARATION';

  return (
    <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <h2 className="md:col-span-2 text-xl font-bold text-gray-700">
        Business Information
      </h2>
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
          { label: 'Individual', value: 'INDIVIDUAL' },
          { label: 'Company', value: 'COMPANY' },
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        fullWidth
        name="gstRegistrationType"
        label="GST Registration"
        value={formik.values.gstRegistrationType}
        onChange={(event) => {
          const nextType = event.target.value as
            | 'GST_REGISTERED'
            | 'NON_GST_DECLARATION';
          formik.setFieldValue('gstRegistrationType', nextType);
          if (nextType === 'NON_GST_DECLARATION') {
            formik.setFieldValue('gstin', '');
            formik.setFieldValue('businessDetails.gstNumber', '');
            formik.setFieldValue('kycDetails.gstCertificateUrl', '');
            formik.setFieldValue('kycDetails.gstCertificateUrlName', '');
          }
        }}
        helperText="Final acceptance depends on the active onboarding policy configured on the platform."
      >
        <MenuItem value="GST_REGISTERED">GST Registered Seller</MenuItem>
        <MenuItem value="NON_GST_DECLARATION">
          Non-GST declaration seller
        </MenuItem>
      </TextField>
      <TextField
        fullWidth
        name="gstin"
        label="GST Number"
        value={formik.values.gstin}
        onChange={(event) =>
          formik.setFieldValue('gstin', event.target.value.toUpperCase())
        }
        error={formik.touched.gstin && Boolean(formik.errors.gstin)}
        helperText={
          (formik.touched.gstin && formik.errors.gstin) ||
          (nonGstMode
            ? 'Leave blank if the seller is onboarding under a non-GST declaration policy.'
            : 'Active GSTIN is required for GST-registered sellers.')
        }
        inputProps={{ maxLength: 15 }}
        disabled={nonGstMode}
      />
      <TextField
        fullWidth
        name="businessDetails.panNumber"
        label="PAN Number"
        value={formik.values.businessDetails.panNumber}
        onChange={(event) =>
          formik.setFieldValue(
            'businessDetails.panNumber',
            event.target.value.toUpperCase(),
          )
        }
        error={
          formik.touched.businessDetails?.panNumber &&
          Boolean(formik.errors.businessDetails?.panNumber)
        }
        helperText={
          formik.touched.businessDetails?.panNumber &&
          formik.errors.businessDetails?.panNumber
        }
      />

      {nonGstMode && (
        <>
          <Box className="md:col-span-2">
            <Alert severity="info">
              Non-GST onboarding needs a seller declaration and may still be
              rejected if the current platform policy requires an active GSTIN.
            </Alert>
          </Box>
          <Box className="md:col-span-2">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.gstDeclarationAccepted}
                  onChange={(event) =>
                    formik.setFieldValue(
                      'gstDeclarationAccepted',
                      event.target.checked,
                    )
                  }
                />
              }
              label="I confirm this seller is onboarding under the non-GST declaration path and will follow the platform compliance policy."
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default BecomeSellerFormStep2;
