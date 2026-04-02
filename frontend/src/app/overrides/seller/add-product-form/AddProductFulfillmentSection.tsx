import { Divider, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { SharedAddProductFormProps } from './types';

const AddProductFulfillmentSection = ({
  formik,
}: SharedAddProductFormProps) => (
  <>
    <Grid size={{ xs: 12 }}>
      <Divider />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Inventory & Shipping
      </Typography>
    </Grid>
    {[
      ['stockQuantity', 'Seller Stock'],
      ['minOrderQuantity', 'Min Order Quantity'],
      ['maxOrderQuantity', 'Max Order Quantity'],
      ['reservedQuantity', 'Reserved Quantity'],
      ['warehouseLocation', 'Warehouse Location'],
      ['weight', 'Weight (kg)'],
      ['length', 'Length (cm)'],
      ['width', 'Width (cm)'],
      ['height', 'Height (cm)'],
      ['color', 'Primary Color'],
      ['sizes', 'Sizes (comma separated)'],
    ].map(([field, label]) => (
      <Grid key={field} size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth
          label={label}
          type={
            field === 'warehouseLocation' ||
            field === 'color' ||
            field === 'sizes'
              ? 'text'
              : 'number'
          }
          {...formik.getFieldProps(field)}
        />
      </Grid>
    ))}
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <TextField
        select
        fullWidth
        label="Stock Status"
        {...formik.getFieldProps('stockStatus')}
      >
        <MenuItem value="IN_STOCK">In Stock</MenuItem>
        <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
        <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
        <MenuItem value="PRE_ORDER">Pre Order</MenuItem>
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <TextField
        select
        fullWidth
        label="Package Type"
        {...formik.getFieldProps('packageType')}
      >
        <MenuItem value="BOX">Box</MenuItem>
        <MenuItem value="BAG">Bag</MenuItem>
        <MenuItem value="ENVELOPE">Envelope</MenuItem>
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <TextField
        select
        fullWidth
        label="Shipping Class"
        {...formik.getFieldProps('shippingClass')}
      >
        <MenuItem value="STANDARD">Standard</MenuItem>
        <MenuItem value="EXPRESS">Express</MenuItem>
        <MenuItem value="HEAVY">Heavy</MenuItem>
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label="Video URL"
        {...formik.getFieldProps('videoUrl')}
      />
    </Grid>

    <Grid size={{ xs: 12 }}>
      <Divider />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Warranty, Compliance & SEO
      </Typography>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <TextField
        select
        fullWidth
        label="Warranty Type"
        {...formik.getFieldProps('warrantyType')}
      >
        <MenuItem value="NONE">No Warranty</MenuItem>
        <MenuItem value="BRAND">Brand Warranty</MenuItem>
        <MenuItem value="SELLER">Seller Warranty</MenuItem>
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <TextField
        fullWidth
        type="number"
        label="Warranty Days"
        {...formik.getFieldProps('warrantyDays')}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <TextField
        fullWidth
        type="number"
        label="Return Window Days"
        {...formik.getFieldProps('returnWindowDays')}
      />
    </Grid>
    {[
      ['manufacturerName', 'Manufacturer Name'],
      ['manufacturerAddress', 'Manufacturer Address'],
      ['packerName', 'Packer Name'],
      ['importerName', 'Importer Name'],
      ['metaTitle', 'Meta Title'],
      ['metaDescription', 'Meta Description'],
    ].map(([field, label]) => (
      <Grid key={field} size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label={label}
          {...formik.getFieldProps(field)}
          multiline={
            field === 'manufacturerAddress' || field === 'metaDescription'
          }
          rows={
            field === 'manufacturerAddress' || field === 'metaDescription'
              ? 2
              : undefined
          }
        />
      </Grid>
    ))}
    <Grid size={{ xs: 12 }}>
      <TextField
        fullWidth
        multiline
        rows={2}
        label="Safety Information"
        {...formik.getFieldProps('safetyInformation')}
      />
    </Grid>
  </>
);

export default AddProductFulfillmentSection;
