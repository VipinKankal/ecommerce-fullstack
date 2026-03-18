import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/Api";
import { Product } from "../Types/ProductTypes";
import { API_ROUTES } from "../../Config/ApiRoutes";

export const fetchSellerProducts = createAsyncThunk<Product[], void>(
  "sellerProduct/fetchSellerProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerProducts.base);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  },
);

export const createProduct = createAsyncThunk<Product, { request: any }>(
  "sellerProduct/createProduct",
  async ({ request }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.sellerProducts.base, request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Creation failed");
    }
  },
);

export const updateSellerProduct = createAsyncThunk<
  Product,
  { productId: number; product: Partial<Product> }
>("sellerProduct/updateSellerProduct", async ({ productId, product }, { rejectWithValue }) => {
  try {
    const response = await api.put(API_ROUTES.sellerProducts.byId(productId), product);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Update failed");
  }
});

export const deleteSellerProduct = createAsyncThunk<
  number,
  { productId: number }
>("sellerProduct/deleteSellerProduct", async ({ productId }, { rejectWithValue }) => {
  try {
    await api.delete(API_ROUTES.sellerProducts.byId(productId));
    return Number(productId);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Delete failed");
  }
});
