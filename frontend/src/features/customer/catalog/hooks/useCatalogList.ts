import { SelectChangeEvent } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchAllProduct } from 'State/features/customer/catalog/thunks';
import { fetchWishlist } from 'State/features/customer/wishlist/slice';

export const useCatalogList = () => {
  const dispatch = useAppDispatch();
  const [searchParam] = useSearchParams();
  const { category } = useParams();

  const [sort, setSort] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const { products, loading, totalPages } = useAppSelector(
    (state) => state.product,
  );
  const customer = useAppSelector((state) => state.customerAuth.user);

  const handleSortChange = (event: SelectChangeEvent) => {
    setSort(event.target.value);
  };

  const handlePageChange = (value: number) => {
    setPage(value);
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const [minPrice, maxPrice] = searchParam.get('price')?.split('-') || [];
    const color = searchParam.get('color');
    const brand = searchParam.get('brand');
    const discount = searchParam.get('discount');

    const filterData = {
      category,
      brand,
      color,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      minDiscount: discount || null,
      sort: sort || null,
      pageNumber: page - 1,
    };

    dispatch(fetchAllProduct(filterData));
  }, [category, searchParam, sort, page, dispatch]);

  useEffect(() => {
    if (customer) {
      dispatch(fetchWishlist());
    }
  }, [customer, dispatch]);

  const toggleMobileFilter = () => setMobileFilterOpen((current) => !current);

  return {
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
  };
};
