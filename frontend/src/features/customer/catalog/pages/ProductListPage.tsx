import React from 'react';
import {
  Box,
  CircularProgress,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
} from '@mui/material';
import { Close, FilterAlt } from '@mui/icons-material';
import FilterSections from '../components/FilterSections';
import ProductCard from '../components/ProductCard';
import { useCatalogList } from '../hooks/useCatalogList';

const ProductListPage = () => {
  const {
    category,
    handlePageChange,
    handleSortChange,
    loading,
    mobileFilterOpen,
    page,
    products,
    sort,
    toggleMobileFilter,
    totalPages,
  } = useCatalogList();
  const categoryTitle =
    typeof category === 'string'
      ? category.replaceAll('-', ' ')
      : typeof category === 'object' && category !== null
        ? (category as { name?: string }).name || 'All Products'
        : 'All Products';

  return (
    <div className="mt-6 sm:mt-10 min-h-screen">
      <header className="mb-6 sm:mb-10 px-4 sm:px-0">
        <h1 className="text-xl sm:text-3xl text-center font-bold text-gray-800 uppercase tracking-wide sm:tracking-widest">
          {categoryTitle}
        </h1>
        <div className="w-20 h-1 bg-teal-500 mx-auto mt-2"></div>
      </header>

      <div className="lg:flex px-3 sm:px-5 lg:px-10 gap-6 lg:gap-8">
        <section className="hidden lg:block w-[20%] sticky top-20 h-fit">
          <FilterSections />
        </section>

        <Drawer
          anchor="left"
          open={mobileFilterOpen}
          onClose={toggleMobileFilter}
        >
          <Box className="w-[280px] p-4">
            <Box className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-xl">Filters</h2>
              <IconButton onClick={toggleMobileFilter}>
                <Close />
              </IconButton>
            </Box>
            <FilterSections />
          </Box>
        </Drawer>

        <div className="w-full lg:w-[80%]">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5 sm:mb-8 bg-white p-2 sm:p-3 rounded-lg shadow-sm border">
            <div className="lg:hidden flex items-center">
              <IconButton onClick={toggleMobileFilter} color="primary">
                <FilterAlt />
              </IconButton>
              <span className="text-sm font-semibold text-gray-600">
                Filters
              </span>
            </div>

            <FormControl
              size="small"
              sx={{ width: { xs: '100%', sm: '220px' } }}
            >
              <InputLabel>Sort By</InputLabel>
              <Select value={sort} label="Sort By" onChange={handleSortChange}>
                <MenuItem value="">Relevance</MenuItem>
                <MenuItem value="price_low">Price: Low to High</MenuItem>
                <MenuItem value="price_high">Price: High to Low</MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
              </Select>
            </FormControl>
          </div>

          {loading ? (
            <Box className="flex justify-center items-center h-[40vh]">
              <CircularProgress sx={{ color: 'teal.500' }} />
            </Box>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products?.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </section>
          )}

          <div className="flex justify-center py-16">
            <Pagination
              page={page}
              count={totalPages}
              onChange={(_, value) => handlePageChange(value)}
              variant="outlined"
              color="primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
