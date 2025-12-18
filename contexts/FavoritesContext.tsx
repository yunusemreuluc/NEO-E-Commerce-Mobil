// FavoritesContext.tsx
import React, {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";
import type { Product } from "../types/Product";

type FavoritesContextValue = {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (id: number) => boolean; // ✅ string → number
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);

  const toggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        // zaten favoriyse -> çıkar
        return prev.filter((p) => p.id !== product.id);
      }
      // değilse -> ekle
      return [...prev, product];
    });
  };

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite: (id: number) => favorites.some((p) => p.id === id), // ✅ number
    }),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
