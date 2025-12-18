// CartContext.tsx
import React, {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";
import type { Product } from "../types/Product";

export type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  totalPrice: number;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  increment: (id: number | string) => void;
  decrement: (id: number | string) => void;
  getTotalPrice: () => number;
  isInCart: (id: number | string) => boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const normalizeId = (id: number | string) => Number(id);

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const pid = normalizeId(product.id);
      const existing = prev.find((it) => it.id === pid);
      if (existing) {
        return prev.map((it) =>
          it.id === pid ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          ...product,
          id: pid,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: number | string) => {
    const pid = normalizeId(id);
    setItems((prev) => prev.filter((it) => it.id !== pid));
  };

  const clearCart = () => setItems([]);

  const increment = (id: number | string) => {
    const pid = normalizeId(id);
    setItems((prev) =>
      prev.map((it) =>
        it.id === pid ? { ...it, quantity: it.quantity + 1 } : it
      )
    );
  };

  const decrement = (id: number | string) => {
    const pid = normalizeId(id);
    setItems((prev) =>
      prev
        .map((it) =>
          it.id === pid ? { ...it, quantity: it.quantity - 1 } : it
        )
        .filter((it) => it.quantity > 0)
    );
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    const pid = normalizeId(id);
    if (quantity <= 0) {
      removeFromCart(pid);
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === pid ? { ...it, quantity } : it
      )
    );
  };

  const getTotalPrice = () =>
    items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const isInCart = (id: number | string) => {
    const pid = normalizeId(id);
    return items.some((it) => it.id === pid);
  };

  const totalPrice = useMemo(() => getTotalPrice(), [items]);

  const value = useMemo(
    () => ({
      items,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      increment,
      decrement,
      getTotalPrice,
      isInCart,
    }),
    [items, totalPrice]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
