import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import {
  Box,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";
import { FilterAlt, Close } from "@mui/icons-material";
import FilterSections from "./FilterSections";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchAllProduct } from "../../../State/Customer/productThunks";
import { fetchWishlist } from "../../../State/Wishlist/wishlistSlice";

const Product = () => {
  const dispatch = useAppDispatch();
  const [searchParam] = useSearchParams();
  const { category } = useParams();

  const [sort, setSort] = useState<string>("");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const [minPrice, maxPrice] = searchParam.get("price")?.split("-") || [];
    const color = searchParam.get("color");
    const brand = searchParam.get("brand");
    const discount = searchParam.get("discount");

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

  const toggleMobileFilter = () => setMobileFilterOpen(!mobileFilterOpen);

  return (
    <div className="mt-6 sm:mt-10 min-h-screen">
      <header className="mb-6 sm:mb-10 px-4 sm:px-0">
        <h1 className="text-xl sm:text-3xl text-center font-bold text-gray-800 uppercase tracking-wide sm:tracking-widest">
          {typeof category === "string"
            ? category?.replace("-", " ")
            : typeof category === "object"
              ? (category as any)?.name
              : "All Products"}
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

            <FormControl size="small" sx={{ width: { xs: "100%", sm: "220px" } }}>
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
              <CircularProgress sx={{ color: "teal.500" }} />
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

export default Product;

