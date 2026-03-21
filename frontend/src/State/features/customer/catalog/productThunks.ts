import { createAsyncThunk } from '@reduxjs/toolkit';
import { publicApi } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';

type ProductQueryParams = {
  pageNumber?: number;
  [key: string]: unknown;
};

const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

/**
 * 1. Fetch Filtered Products (Category, Color, Size, Price Range, Pagination)
 * Maps to Backend: @GetMapping("/") or @GetMapping("")
 */
export const fetchAllProduct = createAsyncThunk(
  'products/fetchAllProduct',
  async (params: ProductQueryParams | undefined, { rejectWithValue }) => {
    try {
      const safeParams = params || {};
      const response = await publicApi.get(API_ROUTES.products.list, {
        params: {
          ...safeParams,
          // Ensuring the backend gets at least 0 for pageNumber
          pageNumber: safeParams.pageNumber || 0,
        },
      });
      return response.data; // Usually returns a Page object { content: [], totalPages: 0 }
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Failed to load products'),
      );
    }
  },
);

/**
 * 2. Search Products by Query String
 * Maps to Backend: @GetMapping("/search") with @RequestParam String query
 */
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.search, {
        params: { query },
      });
      return response.data; // Returns List<Product>
    } catch (error: unknown) {
      return rejectWithValue(readErrorMessage(error, 'Search failed'));
    }
  },
);

/**
 * 3. Fetch Single Product By ID (For Product Details Page)
 * Maps to Backend: @GetMapping("/{productId}")
 */
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.byId(productId));
      return response.data; // Returns a single Product object
    } catch (error: unknown) {
      return rejectWithValue(readErrorMessage(error, 'Product not found'));
    }
  },
);
