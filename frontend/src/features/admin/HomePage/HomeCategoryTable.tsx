import React, { useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { getHomeCategories } from 'State/backend/MasterApiThunks';

type HomeCategoryApiRecord = {
  id?: number;
  name?: string;
  category?: string;
  title?: string;
  image?: string;
  imageUrl?: string;
  section?: string;
};

type HomeCategoryRow = {
  id: number;
  name: string;
  image: string;
  category: string;
};

const HomeCategoryTable = () => {
  const dispatch = useAppDispatch();
  const responses = useAppSelector((state) => state.masterApi.responses);
  const loading = useAppSelector((state) => state.masterApi.loading);
  const rawCategories = responses.getHomeCategories;

  useEffect(() => {
    dispatch(getHomeCategories());
  }, [dispatch]);

  const homeCategories = useMemo<HomeCategoryRow[]>(() => {
    if (!Array.isArray(rawCategories)) return [];
    return (rawCategories as HomeCategoryApiRecord[]).map(
      (item, index: number) => ({
        id: item.id || index + 1,
        name: item.name || item.category || item.title || 'N/A',
        image: item.image || item.imageUrl || '',
        category: item.section || item.category || 'Home',
      }),
    );
  }, [rawCategories]);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Homepage Apparel Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          Add Item
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid #eee', borderRadius: '12px' }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">
                Update
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {homeCategories.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>#{item.id}</TableCell>
                <TableCell>
                  <Avatar
                    src={item.image}
                    variant="rounded"
                    sx={{ width: 50, height: 50, border: '1px solid #eee' }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      bgcolor: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.category}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    sx={{
                      bgcolor: '#f0f7ff',
                      '&:hover': { bgcolor: '#e0effe' },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!homeCategories.length && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {loading
                    ? 'Loading categories...'
                    : 'No home categories found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HomeCategoryTable;
