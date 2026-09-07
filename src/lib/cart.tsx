import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItemKind = "curso" | "bolsa";

export interface CartItem {
  kind: CartItemKind;
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  imageKey: string | null;
  quantity: number;
}

const STORAGE_KEY = "adribacci:carrinho:v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  requiresShipping: boolean;
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (kind: CartItemKind, id: string, quantity: number) => void;
  remove: (kind: CartItemKind, id: string) => void;
  clear: () => void;
  has: (kind: CartItemKind, id: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((i) => i && typeof i.id === "string" && typeof i.quantity === "number");
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* armazenamento indisponível: o carrinho segue apenas nesta sessão */
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.kind === item.kind && i.id === item.id);
      if (index === -1) {
        return [...prev, { ...item, quantity: item.kind === "curso" ? 1 : Math.max(1, quantity) }];
      }
      if (item.kind === "curso") return prev;
      const next = prev.slice();
      const current = next[index]!;
      next[index] = { ...current, quantity: current.quantity + Math.max(1, quantity) };
      return next;
    });
  }, []);

  const setQuantity = useCallback((kind: CartItemKind, id: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.kind !== kind || i.id !== id) return [i];
        const q = kind === "curso" ? 1 : Math.max(0, Math.min(20, Math.trunc(quantity)));
        return q <= 0 ? [] : [{ ...i, quantity: q }];
      }),
    );
  }, []);

  const remove = useCallback((kind: CartItemKind, id: string) => {
    setItems((prev) => prev.filter((i) => !(i.kind === kind && i.id === id)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items,
      count,
      subtotalCents: items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
      requiresShipping: items.some((i) => i.kind === "bolsa"),
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
      has: (kind, id) => items.some((i) => i.kind === kind && i.id === id),
    };
  }, [items, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
