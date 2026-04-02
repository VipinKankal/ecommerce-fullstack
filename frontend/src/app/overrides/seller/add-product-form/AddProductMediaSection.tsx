import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import { AddProductMediaSectionProps } from './types';

const AddProductMediaSection = ({
  formik,
  uploading,
  handleImageUpload,
}: AddProductMediaSectionProps) => (
  <Grid size={{ xs: 12 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
      Product Media
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="p-img"
        type="file"
        onChange={handleImageUpload}
      />
      <label htmlFor="p-img">
        <Box
          sx={{
            width: 120,
            height: 120,
            border: '2px dashed #ccc',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {uploading ? (
            <CircularProgress size={24} />
          ) : (
            <AddPhotoAlternateIcon color="action" />
          )}
        </Box>
      </label>
      {formik.values.images.map((img, index) => (
        <Box key={img} sx={{ position: 'relative', width: 120, height: 120 }}>
          <img
            src={img}
            alt="preview"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '8px',
              objectFit: 'cover',
            }}
          />
          <IconButton
            size="small"
            onClick={() =>
              formik.setFieldValue(
                'images',
                formik.values.images.filter((_, i) => i !== index),
              )
            }
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'white',
              boxShadow: 1,
            }}
          >
            <CloseIcon sx={{ fontSize: 16, color: 'red' }} />
          </IconButton>
        </Box>
      ))}
    </Box>
    {formik.touched.images && formik.errors.images && (
      <Typography variant="caption" color="error">
        {formik.errors.images as string}
      </Typography>
    )}
  </Grid>
);

export default AddProductMediaSection;
