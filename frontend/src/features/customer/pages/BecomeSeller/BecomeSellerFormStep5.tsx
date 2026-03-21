import {
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { uploadToCloudinary } from 'shared/utils/uploadToCloudinary';
import { SellerAccountFormik } from './types';

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const UploadField = ({
  formik,
  field,
  label,
}: {
  formik: SellerAccountFormik;
  field: 'panCardUrl' | 'aadhaarCardUrl' | 'gstCertificateUrl';
  label: string;
}) => {
  const value = formik.values.kycDetails?.[field];
  const fileName = formik.values.kycDetails?.[`${field}Name`];
  const [uploading, setUploading] = useState(false);
  const error =
    formik.touched.kycDetails?.[field] &&
    Boolean(formik.errors.kycDetails?.[field]);
  const helperText =
    (formik.touched.kycDetails?.[field] && formik.errors.kycDetails?.[field]) ||
    '';
  const isImage = Boolean(value);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      const uploadedUrl = await uploadToCloudinary(file);
      formik.setFieldValue(`kycDetails.${field}`, uploadedUrl || dataUrl);
      formik.setFieldValue(`kycDetails.${field}Name`, file.name);
      formik.setFieldTouched(`kycDetails.${field}`, true, false);
    } catch {
      formik.setFieldError(`kycDetails.${field}`, 'Failed to read file');
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  return (
    <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Stack spacing={1.5}>
        <Typography className="font-semibold text-slate-900">
          {label}
        </Typography>
        <Button
          variant="outlined"
          component="label"
          sx={{ justifyContent: 'flex-start', py: 1.2 }}
          disabled={uploading}
        >
          {uploading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            'Upload Document'
          )}
          <input
            hidden
            accept="image/*"
            type="file"
            onChange={handleFileChange}
          />
        </Button>
        <Typography
          variant="body2"
          color={value ? 'success.main' : 'text.secondary'}
        >
          {value
            ? `Selected: ${fileName || 'Image uploaded successfully'}`
            : 'Accepted: JPG, PNG, JPEG'}
        </Typography>
        {isImage && (
          <Stack spacing={1.5}>
            <Box
              component="img"
              src={value}
              alt={label}
              sx={{
                width: 220,
                height: 140,
                objectFit: 'cover',
                borderRadius: 2,
                border: '1px solid #cbd5e1',
              }}
            />
            <Button
              variant="text"
              sx={{ width: 'fit-content', px: 0 }}
              onClick={() =>
                globalThis.open(String(value), '_blank', 'noopener,noreferrer')
              }
            >
              View Full Image
            </Button>
          </Stack>
        )}
        {error && <FormHelperText error>{helperText}</FormHelperText>}
      </Stack>
    </Box>
  );
};

const BecomeSellerFormStep5 = ({ formik }: { formik: SellerAccountFormik }) => (
  <Box className="grid grid-cols-1 gap-4">
    <h2 className="text-xl font-bold">Identity Verification</h2>
    <UploadField formik={formik} field="panCardUrl" label="PAN Card" />
    <UploadField formik={formik} field="aadhaarCardUrl" label="Aadhaar Card" />
    <UploadField
      formik={formik}
      field="gstCertificateUrl"
      label="GST Certificate"
    />
  </Box>
);

export default BecomeSellerFormStep5;
