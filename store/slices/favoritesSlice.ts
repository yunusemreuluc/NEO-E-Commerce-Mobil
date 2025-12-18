// store/slices/favoritesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../types/Product';

interface FavoritesState {
  items: Product[];
}

const initialState: FavoritesState = {
  items: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const existingIndex = state.items.findIndex(item => item.id === product.id);
      
      if (existingIndex >= 0) {
        // Favorilerden çıkar
        state.items.splice(existingIndex, 1);
      } else {
        // Favorilere ekle
        state.items.push(product);
      }
    },
    clearFavorites: (state) => {
      state.items = [];
    },
  },
});

export const { toggleFavorite, clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;