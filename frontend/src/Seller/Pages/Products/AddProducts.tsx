import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  MenuItem,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Alert,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { createProduct } from "../../../State/Seller/sellerProductThunks";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "shared/utils/uploadToCloudinary";

import { menLevelTwo } from "../../../Data/Category/Level Two/menLavelTwo";
import { womenLevelTwo } from "../../../Data/Category/Level Two/womenLavelTwo";
import { furnitureLevelTwo } from "../../../Data/Category/Level Two/furuitureLavelTwo";
import { electronicsLevelTwo } from "../../../Data/Category/Level Two/electronicsLavelTwo";
import { menLevelThree } from "../../../Data/Category/Level Three/menLavelThree";
import { womenLevelThree } from "../../../Data/Category/Level Three/womenLavelThree";
import { furnitureLevelThree } from "../../../Data/Category/Level Three/furuitureLavelThree";
import { electronicsLevelThree } from "../../../Data/Category/Level Three/electronicsLavelThree";

const categoryTwo: { [key: string]: any[] } = {
  men: menLevelTwo,
  women: womenLevelTwo,
  home_furniture: furnitureLevelTwo,
  electronics: electronicsLevelTwo,
};

const categoryThree: { [key: string]: any[] } = {
  men: menLevelThree,
  women: womenLevelThree,
  home_furniture: furnitureLevelThree,
  electronics: electronicsLevelThree,
};

interface VariantRow {
  variantType: string;
  variantValue: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  quantity: string;
}

const emptyVariant = (): VariantRow => ({
  variantType: "SIZE_COLOR",
  variantValue: "",
  size: "",
  color: "",
  sku: "",
  price: "",
  quantity: "",
});

const AddProducts = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.sellerProduct);

  const formik = useFormik({
    initialValues: {
      title: "",
      brand: "",
      description: "",
      shortDescription: "",
      productHighlights: "",
      searchKeywords: "",
      tags: "",
      sku: "",
      barcode: "",
      modelNumber: "",
      hsnCode: "",
      manufacturerPartNumber: "",
      countryOfOrigin: "India",
      mrpPrice: "",
      sellingPrice: "",
      taxPercentage: "18",
      currency: "INR",
      platformCommission: "0",
      stockQuantity: "",
      minOrderQuantity: "1",
      maxOrderQuantity: "5",
      stockStatus: "IN_STOCK",
      warehouseLocation: "",
      reservedQuantity: "0",
      color: "",
      sizes: "",
      images: [] as string[],
      videoUrl: "",
      weight: "",
      length: "",
      width: "",
      height: "",
      packageType: "BOX",
      shippingClass: "STANDARD",
      returnable: true,
      returnWindowDays: "7",
	      warrantyType: "NONE",
      warrantyPeriod: "",
      replacementAvailable: true,
      manufacturerName: "",
      manufacturerAddress: "",
      packerName: "",
      importerName: "",
      safetyInformation: "",
      metaTitle: "",
      metaDescription: "",
      category: "",
      category2: "",
      category3: "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      brand: Yup.string().required("Brand is required"),
      description: Yup.string().min(20, "Description too short").required("Description is required"),
      shortDescription: Yup.string().required("Short description is required"),
      mrpPrice: Yup.number().positive().required("MRP is required"),
      sellingPrice: Yup.number().positive().required("Selling price is required"),
      stockQuantity: Yup.number().min(0).required("Stock quantity is required"),
      category: Yup.string().required("Required"),
      category2: Yup.string().required("Required"),
      category3: Yup.string().test(
        "category3-required",
        "Required",
        function (value) {
          const { category, category2 } = this.parent as {
            category?: string;
            category2?: string;
          };
          const options =
            category && category2
              ? (categoryThree[category] || []).filter(
                  (item) => item.parentCategoryId === category2,
                )
              : [];
          if (!options.length) return true;
          return Boolean(value);
        },
      ),
      images: Yup.array().min(3, "Minimum 3 images are required"),
      manufacturerName: Yup.string().required("Manufacturer name is required"),
    }),
	    onSubmit: async (values) => {
      setSubmitError(null);
	      const parsedVariants = variants
        .filter((variant) => variant.sku.trim())
        .map((variant) => ({
          variantType: variant.variantType,
          variantValue:
            variant.variantValue.trim() || [variant.size.trim(), variant.color.trim()].filter(Boolean).join(" / "),
          size: variant.size.trim() || undefined,
          color: variant.color.trim() || undefined,
          sku: variant.sku.trim(),
          price: Number(variant.price || values.sellingPrice),
          quantity: Number(variant.quantity || 0),
        }));

	      const requestBody = {
	        title: values.title.trim(),
	        brand: values.brand.trim(),
	        categoryId: values.category3 || values.category2 || values.category,
	        subCategoryId: values.category2 || values.category,
	        category: values.category3 || values.category2 || values.category,
	        category2: values.category2 || values.category,
	        category3: values.category3,
        description: values.description.trim(),
        productDescription: values.description.trim(),
        shortDescription: values.shortDescription.trim(),
        productHighlights: values.productHighlights
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        searchKeywords: values.searchKeywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        tags: values.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        sku: values.sku.trim(),
        barcode: values.barcode.trim() || undefined,
        modelNumber: values.modelNumber.trim() || undefined,
        hsnCode: values.hsnCode.trim() || undefined,
        manufacturerPartNumber: values.manufacturerPartNumber.trim() || undefined,
        countryOfOrigin: values.countryOfOrigin.trim() || undefined,
        mrpPrice: Number(values.mrpPrice),
        sellingPrice: Number(values.sellingPrice),
        taxPercentage: Number(values.taxPercentage || 0),
        currency: values.currency,
        platformCommission: Number(values.platformCommission || 0),
        stockQuantity: Number(values.stockQuantity),
        minOrderQuantity: Number(values.minOrderQuantity || 1),
        maxOrderQuantity: Number(values.maxOrderQuantity || values.stockQuantity || 1),
        stockStatus: values.stockStatus,
        warehouseLocation: values.warehouseLocation.trim() || undefined,
        reservedQuantity: Number(values.reservedQuantity || 0),
        color: values.color.trim(),
        sizes: values.sizes.trim(),
        images: values.images,
        mainImage: values.images[0],
        thumbnail: values.images[1] || values.images[0],
        galleryImages: values.images,
        videoUrl: values.videoUrl.trim() || undefined,
        weight: Number(values.weight || 0),
        length: Number(values.length || 0),
        width: Number(values.width || 0),
        height: Number(values.height || 0),
        packageType: values.packageType,
        shippingClass: values.shippingClass,
        returnable: values.returnable,
        returnWindowDays: Number(values.returnWindowDays || 0),
	        warrantyType: values.warrantyType === "NO_WARRANTY" ? "NONE" : values.warrantyType,
        warrantyPeriod: values.warrantyPeriod.trim() || undefined,
        replacementAvailable: values.replacementAvailable,
        manufacturerName: values.manufacturerName.trim(),
        manufacturerAddress: values.manufacturerAddress.trim() || undefined,
        packerName: values.packerName.trim() || undefined,
        importerName: values.importerName.trim() || undefined,
        safetyInformation: values.safetyInformation.trim() || undefined,
        metaTitle: values.metaTitle.trim() || values.title.trim(),
        metaDescription: values.metaDescription.trim() || values.shortDescription.trim(),
        size: values.sizes,
        quantity: Number(values.stockQuantity),
        variants: parsedVariants,
      };

	      const res = await dispatch(createProduct({ request: requestBody }));
	      if (res.meta.requestStatus === "fulfilled") {
	        navigate("/seller/products");
	      } else {
        setSubmitError((res.payload as string) || "Product creation failed");
	      }
	    },
	  });

	  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
	    const file = e.target.files?.[0];
	    if (!file) return;
	    setUploading(true);
    setUploadError(null);
	    try {
	      const url = await uploadToCloudinary(file);
	      if (url) {
	        formik.setFieldValue("images", [...formik.values.images, url]);
	      }
	    } catch (error) {
	      console.error("Upload failed", error);
      setUploadError(
        "Image upload failed. Check your internet connection or Cloudinary configuration, then try again.",
      );
	    } finally {
	      setUploading(false);
      e.target.value = "";
	    }
	  };

  const updateVariant = (index: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Add Marketplace Product
      </Typography>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
	        <form onSubmit={formik.handleSubmit}>
            {(uploadError || submitError || error) && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="error">{uploadError || submitError || error}</Alert>
              </Box>
            )}
	          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Product Media
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <input accept="image/*" style={{ display: "none" }} id="p-img" type="file" onChange={handleImageUpload} />
                <label htmlFor="p-img">
                  <Box sx={{ width: 120, height: 120, border: "2px dashed #ccc", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    {uploading ? <CircularProgress size={24} /> : <AddPhotoAlternateIcon color="action" />}
                  </Box>
                </label>
                {formik.values.images.map((img, index) => (
                  <Box key={index} sx={{ position: "relative", width: 120, height: 120 }}>
                    <img src={img} alt="preview" style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "cover" }} />
                    <IconButton size="small" onClick={() => formik.setFieldValue("images", formik.values.images.filter((_, i) => i !== index))} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "white", boxShadow: 1 }}>
                      <CloseIcon sx={{ fontSize: 16, color: "red" }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              {formik.touched.images && formik.errors.images && (
                <Typography variant="caption" color="error">{formik.errors.images as string}</Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>
            <Grid size={{ xs: 12 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Basic Information</Typography></Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField fullWidth label="Product Title" {...formik.getFieldProps("title")} error={formik.touched.title && !!formik.errors.title} helperText={formik.touched.title && formik.errors.title} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Brand" {...formik.getFieldProps("brand")} error={formik.touched.brand && !!formik.errors.brand} helperText={formik.touched.brand && formik.errors.brand} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Short Description" {...formik.getFieldProps("shortDescription")} error={formik.touched.shortDescription && !!formik.errors.shortDescription} helperText={formik.touched.shortDescription && formik.errors.shortDescription} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={4} label="Detailed Description" {...formik.getFieldProps("description")} error={formik.touched.description && !!formik.errors.description} helperText={formik.touched.description && formik.errors.description} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Product Highlights (one per line)" {...formik.getFieldProps("productHighlights")} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Search Keywords (comma separated)" {...formik.getFieldProps("searchKeywords")} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Tags (comma separated)" {...formik.getFieldProps("tags")} />
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>
            <Grid size={{ xs: 12 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Category</Typography></Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select fullWidth label="Main Category" {...formik.getFieldProps("category")} onChange={(e) => { formik.setFieldValue("category", e.target.value); formik.setFieldValue("category2", ""); formik.setFieldValue("category3", ""); }}>
                <MenuItem value="men">Men</MenuItem>
                <MenuItem value="women">Women</MenuItem>
                <MenuItem value="home_furniture">Home & Furniture</MenuItem>
                <MenuItem value="electronics">Electronics</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select fullWidth label="Sub Category" {...formik.getFieldProps("category2")} disabled={!formik.values.category}>
                {categoryTwo[formik.values.category] ? categoryTwo[formik.values.category].map((item) => (
                  <MenuItem key={item.categoryId} value={item.categoryId}>{item.name}</MenuItem>
                )) : <MenuItem disabled value="">Select Main Category</MenuItem>}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select fullWidth label="Third Category" {...formik.getFieldProps("category3")} disabled={!formik.values.category2}>
                {categoryThree[formik.values.category]?.filter((x) => x.parentCategoryId === formik.values.category2).length > 0 ? (
                  categoryThree[formik.values.category]
                    .filter((x) => x.parentCategoryId === formik.values.category2)
                    .map((item) => <MenuItem key={item.categoryId} value={item.categoryId}>{item.name}</MenuItem>)
                ) : <MenuItem disabled value="">No options found</MenuItem>}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>
            <Grid size={{ xs: 12 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Identification & Pricing</Typography></Grid>
            {[
              ["sku", "Primary SKU"],
              ["barcode", "Barcode"],
              ["modelNumber", "Model Number"],
              ["hsnCode", "HSN Code"],
              ["manufacturerPartNumber", "Manufacturer Part Number"],
              ["countryOfOrigin", "Country of Origin"],
              ["mrpPrice", "MRP Price"],
              ["sellingPrice", "Selling Price"],
              ["taxPercentage", "Tax Percentage"],
              ["platformCommission", "Platform Commission"],
            ].map(([field, label]) => (
              <Grid key={field} size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField fullWidth label={label} type={["mrpPrice", "sellingPrice", "taxPercentage", "platformCommission"].includes(field) ? "number" : "text"} {...formik.getFieldProps(field)} />
              </Grid>
            ))}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField select fullWidth label="Currency" {...formik.getFieldProps("currency")}>
                <MenuItem value="INR">INR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>
            <Grid size={{ xs: 12 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Inventory & Shipping</Typography></Grid>
            {[
              ["stockQuantity", "Stock Quantity"],
              ["minOrderQuantity", "Min Order Quantity"],
              ["maxOrderQuantity", "Max Order Quantity"],
              ["reservedQuantity", "Reserved Quantity"],
              ["warehouseLocation", "Warehouse Location"],
              ["weight", "Weight (kg)"],
              ["length", "Length (cm)"],
              ["width", "Width (cm)"],
              ["height", "Height (cm)"],
              ["color", "Primary Color"],
              ["sizes", "Sizes (comma separated)"],
            ].map(([field, label]) => (
              <Grid key={field} size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField fullWidth label={label} type={field === "warehouseLocation" || field === "color" || field === "sizes" ? "text" : "number"} {...formik.getFieldProps(field)} />
              </Grid>
            ))}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField select fullWidth label="Stock Status" {...formik.getFieldProps("stockStatus")}>
                <MenuItem value="IN_STOCK">In Stock</MenuItem>
                <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
                <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
                <MenuItem value="PRE_ORDER">Pre Order</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField select fullWidth label="Package Type" {...formik.getFieldProps("packageType")}>
                <MenuItem value="BOX">Box</MenuItem>
                <MenuItem value="BAG">Bag</MenuItem>
                <MenuItem value="ENVELOPE">Envelope</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField select fullWidth label="Shipping Class" {...formik.getFieldProps("shippingClass")}>
                <MenuItem value="STANDARD">Standard</MenuItem>
                <MenuItem value="EXPRESS">Express</MenuItem>
                <MenuItem value="HEAVY">Heavy</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Video URL" {...formik.getFieldProps("videoUrl")} />
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>
            <Grid size={{ xs: 12 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Warranty, Compliance & SEO</Typography></Grid>
	            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
	              <TextField select fullWidth label="Warranty Type" {...formik.getFieldProps("warrantyType")}>
	                <MenuItem value="NONE">No Warranty</MenuItem>
	                <MenuItem value="BRAND">Brand Warranty</MenuItem>
	                <MenuItem value="SELLER">Seller Warranty</MenuItem>
	                <MenuItem value="MANUFACTURER">Manufacturer Warranty</MenuItem>
	              </TextField>
	            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth label="Warranty Period" {...formik.getFieldProps("warrantyPeriod")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="number" label="Return Window Days" {...formik.getFieldProps("returnWindowDays")} />
            </Grid>
            {[
              ["manufacturerName", "Manufacturer Name"],
              ["manufacturerAddress", "Manufacturer Address"],
              ["packerName", "Packer Name"],
              ["importerName", "Importer Name"],
              ["metaTitle", "Meta Title"],
              ["metaDescription", "Meta Description"],
            ].map(([field, label]) => (
              <Grid key={field} size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label={label} {...formik.getFieldProps(field)} multiline={field === "manufacturerAddress" || field === "metaDescription"} rows={field === "manufacturerAddress" || field === "metaDescription" ? 2 : undefined} />
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={2} label="Safety Information" {...formik.getFieldProps("safetyInformation")} />
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Product Variants</Typography>
                <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setVariants((prev) => [...prev, emptyVariant()])}>Add Variant</Button>
              </Box>
            </Grid>
            {variants.map((variant, index) => (
              <Grid key={index} size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <TextField select label="Variant Type" value={variant.variantType} onChange={(e) => updateVariant(index, "variantType", e.target.value)}>
                      <MenuItem value="SIZE_COLOR">Size + Color</MenuItem>
                      <MenuItem value="SIZE">Size</MenuItem>
                      <MenuItem value="COLOR">Color</MenuItem>
                    </TextField>
                    <TextField label="Variant Value" value={variant.variantValue} onChange={(e) => updateVariant(index, "variantValue", e.target.value)} />
                    <TextField label="Variant SKU" value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} />
                    <TextField label="Size" value={variant.size} onChange={(e) => updateVariant(index, "size", e.target.value)} />
                    <TextField label="Color" value={variant.color} onChange={(e) => updateVariant(index, "color", e.target.value)} />
                    <TextField type="number" label="Price" value={variant.price} onChange={(e) => updateVariant(index, "price", e.target.value)} />
                    <TextField type="number" label="Quantity" value={variant.quantity} onChange={(e) => updateVariant(index, "quantity", e.target.value)} />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <IconButton color="error" onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index || prev.length === 1))}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  </div>
                </Paper>
              </Grid>
            ))}

            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || uploading} sx={{ py: 1.5, bgcolor: "#10b981", fontWeight: "bold" }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "CREATE PRODUCT"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddProducts;
