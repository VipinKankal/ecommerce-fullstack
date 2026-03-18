import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { uploadToCloudinary } from "shared/utils/uploadToCloudinary";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const BecomeSellerFormStep6 = ({ formik }: any) => {
  const [uploading, setUploading] = useState(false);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      const uploadedUrl = await uploadToCloudinary(file);
      formik.setFieldValue("storeDetails.storeLogo", uploadedUrl || dataUrl);
      formik.setFieldValue("storeDetails.storeLogoName", file.name);
    } catch {
      formik.setFieldError("storeDetails.storeLogo", "Failed to read logo file");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
  <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <h2 className="md:col-span-2 text-xl font-bold">Store Information</h2>
    <TextField
      fullWidth
      name="storeDetails.storeName"
      label="Store Name"
      value={formik.values.storeDetails.storeName}
      onChange={formik.handleChange}
      error={formik.touched.storeDetails?.storeName && Boolean(formik.errors.storeDetails?.storeName)}
      helperText={formik.touched.storeDetails?.storeName && formik.errors.storeDetails?.storeName}
    />
    <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Stack spacing={1.5}>
        <Typography className="font-semibold text-slate-900">Store Logo</Typography>
        <Button variant="outlined" component="label" sx={{ justifyContent: "flex-start", py: 1.2 }} disabled={uploading}>
          {uploading ? <CircularProgress size={18} color="inherit" /> : "Upload Store Logo"}
          <input hidden accept="image/*" type="file" onChange={handleLogoChange} />
        </Button>
        <Typography variant="body2" color={formik.values.storeDetails.storeLogo ? "success.main" : "text.secondary"}>
          {formik.values.storeDetails.storeLogo
            ? `Selected: ${formik.values.storeDetails.storeLogoName || "Logo uploaded successfully"}`
            : "Accepted: JPG, PNG, JPEG"}
        </Typography>
        {formik.values.storeDetails.storeLogo && (
          <Stack spacing={1.5}>
            <Box
              component="img"
              src={formik.values.storeDetails.storeLogo}
              alt="Store Logo Preview"
              sx={{ width: 140, height: 140, objectFit: "cover", borderRadius: 2, border: "1px solid #cbd5e1" }}
            />
            <Button
              variant="text"
              sx={{ width: "fit-content", px: 0 }}
              onClick={() => window.open(String(formik.values.storeDetails.storeLogo), "_blank", "noopener,noreferrer")}
            >
              View Full Logo
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
    <TextField
      className="md:col-span-2"
      fullWidth
      multiline
      minRows={3}
      name="storeDetails.storeDescription"
      label="Store Description"
      value={formik.values.storeDetails.storeDescription}
      onChange={formik.handleChange}
      error={
        formik.touched.storeDetails?.storeDescription &&
        Boolean(formik.errors.storeDetails?.storeDescription)
      }
      helperText={
        formik.touched.storeDetails?.storeDescription &&
        formik.errors.storeDetails?.storeDescription
      }
    />
    <TextField
      fullWidth
      name="storeDetails.supportEmail"
      label="Support Email"
      value={formik.values.storeDetails.supportEmail}
      onChange={formik.handleChange}
      error={formik.touched.storeDetails?.supportEmail && Boolean(formik.errors.storeDetails?.supportEmail)}
      helperText={formik.touched.storeDetails?.supportEmail && formik.errors.storeDetails?.supportEmail}
    />
    <TextField
      fullWidth
      name="storeDetails.supportPhone"
      label="Support Phone"
      value={formik.values.storeDetails.supportPhone}
      onChange={formik.handleChange}
      error={formik.touched.storeDetails?.supportPhone && Boolean(formik.errors.storeDetails?.supportPhone)}
      helperText={formik.touched.storeDetails?.supportPhone && formik.errors.storeDetails?.supportPhone}
    />
  </Box>
  );
};

export default BecomeSellerFormStep6;

