import React from 'react';
import { CircularProgress, Drawer, FormControl, InputLabel, MenuItem, Pagination, Select } from '@mui/material';
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

  return (
    <div className="min-h-screen bg-white px-3 pb-24 pt-4 sm:px-5 lg:px-20">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Catalog</p>
          <h1 className="mt-2 text-2xl font-bold capitalize text-gray-900">
            {(category || 'products').replaceAll('-', ' ')}
          </h1>
        </div>

        <div className="hidden min-w-[180px] sm:block">
          <FormControl fullWidth size="small">
            <InputLabel id="catalog-sort-label">Sort</InputLabel>
            <Select
              labelId="catalog-sort-label"
              value={sort}
              label="Sort"
              onChange={handleSortChange}
            >
              <MenuItem value="">Recommended</MenuItem>
              <MenuItem value="price_low">Price: Low to High</MenuItem>
              <MenuItem value="price_high">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <FilterSections />
          </div>
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={toggleMobileFilter}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Filters
            </button>

            <div className="min-w-[170px] flex-1">
              <FormControl fullWidth size="small">
                <InputLabel id="catalog-mobile-sort-label">Sort</InputLabel>
                <Select
                  labelId="catalog-mobile-sort-label"
                  value={sort}
                  label="Sort"
                  onChange={handleSortChange}
                >
                  <MenuItem value="">Recommended</MenuItem>
                  <MenuItem value="price_low">Price: Low to High</MenuItem>
                  <MenuItem value="price_high">Price: High to Low</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <CircularProgress />
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((item) => (
                <ProductCard key={item.id || item.title} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center text-gray-500">
              No products found for this category.
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => handlePageChange(value)}
                color="primary"
              />
            </div>
          )}
        </section>
      </div>

      <Drawer anchor="left" open={mobileFilterOpen} onClose={toggleMobileFilter}>
        <div className="w-[290px] max-w-full bg-white py-4">
          <FilterSections />
        </div>
      </Drawer>
    </div>
  );
};

export default ProductListPage;
