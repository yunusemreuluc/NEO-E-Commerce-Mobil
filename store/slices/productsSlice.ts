// store/slices/productsSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getProducts } from '../../api';
import type { ApiProduct } from '../../types/Product';

interface ProductsState {
  items: ApiProduct[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
};

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    const products = await getProducts();
    return products;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ürünler yüklenirken hata oluştu';
      });
  },
});

export const { clearError } = productsSlice.actions;
export default productsSlice.reducer;