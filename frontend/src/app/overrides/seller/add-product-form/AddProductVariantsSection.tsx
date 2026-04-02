import {
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { emptyVariant } from 'features/seller/products/pages/addProductConfig';
import { AddProductVariantsSectionProps } from './types';

const AddProductVariantsSection = ({
  variants,
  setVariants,
  updateVariant,
}: AddProductVariantsSectionProps) => (
  <>
    <Grid size={{ xs: 12 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Product Variants
        </Typography>
        <Button
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
        >
          Add Variant
        </Button>
      </Box>
    </Grid>
    {variants.map((variant, index) => (
      <Grid
        key={
          variant.sku ||
          `${variant.variantType}-${variant.variantValue}-${variant.size}-${variant.color}`
        }
        size={{ xs: 12 }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              select
              label="Variant Type"
              value={variant.variantType}
              onChange={(e) =>
                updateVariant(index, 'variantType', e.target.value)
              }
            >
              <MenuItem value="SIZE_COLOR">Size + Color</MenuItem>
              <MenuItem value="SIZE">Size</MenuItem>
              <MenuItem value="COLOR">Color</MenuItem>
            </TextField>
            <TextField
              label="Variant Value"
              value={variant.variantValue}
              onChange={(e) =>
                updateVariant(index, 'variantValue', e.target.value)
              }
            />
            <TextField
              label="Variant SKU"
              value={variant.sku}
              onChange={(e) => updateVariant(index, 'sku', e.target.value)}
            />
            <TextField
              label="Size"
              value={variant.size}
              onChange={(e) => updateVariant(index, 'size', e.target.value)}
            />
            <TextField
              label="Color"
              value={variant.color}
              onChange={(e) => updateVariant(index, 'color', e.target.value)}
            />
            <TextField
              type="number"
              label="Price"
              value={variant.price}
              onChange={(e) => updateVariant(index, 'price', e.target.value)}
            />
            <TextField
              type="number"
              label="Quantity"
              value={variant.quantity}
              onChange={(e) => updateVariant(index, 'quantity', e.target.value)}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="error"
                onClick={() =>
                  setVariants((prev) =>
                    prev.filter((_, i) => i !== index || prev.length === 1),
                  )
                }
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          </div>
        </Paper>
      </Grid>
    ))}
  </>
);

export default AddProductVariantsSection;
