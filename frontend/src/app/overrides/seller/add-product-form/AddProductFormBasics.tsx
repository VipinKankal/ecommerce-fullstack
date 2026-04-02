import { Divider, Grid, MenuItem, TextField, Typography } from '@mui/material';
import {
  categoryThree,
  categoryTwo,
  CONSTRUCTION_OPTIONS,
  FABRIC_OPTIONS,
  FIBER_FAMILY_OPTIONS,
  GENDER_OPTIONS,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
} from 'features/seller/products/pages/addProductConfig';
import { SharedAddProductFormProps } from './types';

type AddProductFormBasicsProps = SharedAddProductFormProps & {
  descriptionHelperText: string;
};

const AddProductFormBasics = ({
  formik,
  descriptionHelperText,
}: AddProductFormBasicsProps) => (
  <>
    <Grid size={{ xs: 12 }}>
      <Divider />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Basic Information
      </Typography>
    </Grid>
    <Grid size={{ xs: 12, md: 8 }}>
      <TextField
        fullWidth
        label="Product Title"
        {...formik.getFieldProps('title')}
        error={formik.touched.title && !!formik.errors.title}
        helperText={formik.touched.title && formik.errors.title}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField
        fullWidth
        label="Brand"
        {...formik.getFieldProps('brand')}
        error={formik.touched.brand && !!formik.errors.brand}
        helperText={formik.touched.brand && formik.errors.brand}
      />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <TextField
        fullWidth
        label="Short Description"
        {...formik.getFieldProps('shortDescription')}
        error={
          formik.touched.shortDescription && !!formik.errors.shortDescription
        }
        helperText={
          formik.touched.shortDescription && formik.errors.shortDescription
        }
      />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Detailed Description"
        {...formik.getFieldProps('description')}
        error={formik.touched.description && !!formik.errors.description}
        helperText={descriptionHelperText}
        inputProps={{ maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH }}
      />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Product Highlights (one per line)"
        {...formik.getFieldProps('productHighlights')}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label="Search Keywords (comma separated)"
        {...formik.getFieldProps('searchKeywords')}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label="Tags (comma separated)"
        {...formik.getFieldProps('tags')}
      />
    </Grid>

    <Grid size={{ xs: 12 }}>
      <Divider />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Category And Classification
      </Typography>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <TextField
        select
        fullWidth
        label="Main Category"
        {...formik.getFieldProps('category')}
        onChange={(e) => {
          formik.setFieldValue('category', e.target.value);
          formik.setFieldValue('category2', '');
          formik.setFieldValue('category3', '');
        }}
      >
        <MenuItem value="men">Men</MenuItem>
        <MenuItem value="women">Women</MenuItem>
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <TextField
        select
        fullWidth
        label="Sub Category"
        {...formik.getFieldProps('category2')}
        disabled={!formik.values.category}
      >
        {categoryTwo[formik.values.category] ? (
          categoryTwo[formik.values.category].map((item) => (
            <MenuItem key={item.categoryId} value={item.categoryId}>
              {item.name}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled value="">
            Select Main Category
          </MenuItem>
        )}
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <TextField
        select
        fullWidth
        label="Third Category"
        {...formik.getFieldProps('category3')}
        disabled={!formik.values.category2}
      >
        {categoryThree[formik.values.category]?.filter(
          (item) => item.parentCategoryId === formik.values.category2,
        ).length > 0 ? (
          categoryThree[formik.values.category]
            .filter((item) => item.parentCategoryId === formik.values.category2)
            .map((item) => (
              <MenuItem key={item.categoryId} value={item.categoryId}>
                {item.name}
              </MenuItem>
            ))
        ) : (
          <MenuItem disabled value="">
            No options found
          </MenuItem>
        )}
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <TextField
        select
        fullWidth
        label="Gender"
        {...formik.getFieldProps('gender')}
      >
        <MenuItem value="">Not specified</MenuItem>
        {GENDER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <TextField
        select
        fullWidth
        label="Fabric"
        {...formik.getFieldProps('fabricType')}
      >
        <MenuItem value="">Not specified</MenuItem>
        {FABRIC_OPTIONS.map((option) => (
          <MenuItem
            key={option}
            value={option.toUpperCase().replaceAll(' ', '_')}
          >
            {option}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <TextField
        select
        fullWidth
        label="Construction"
        {...formik.getFieldProps('constructionType')}
        error={
          formik.touched.constructionType && !!formik.errors.constructionType
        }
        helperText={
          (formik.touched.constructionType && formik.errors.constructionType) ||
          'Required for HSN chapter and GST rule mapping'
        }
      >
        {CONSTRUCTION_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        select
        fullWidth
        label="Fibre Family (required for fibre-based categories)"
        {...formik.getFieldProps('fiberFamily')}
        helperText="Use this for saree / dhoti / textile mappings when CA-approved HSN depends on fibre."
      >
        <MenuItem value="">Not applicable</MenuItem>
        {FIBER_FAMILY_OPTIONS.map((option) => (
          <MenuItem
            key={option}
            value={option.toUpperCase().replaceAll(' ', '_')}
          >
            {option}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
  </>
);

export default AddProductFormBasics;
