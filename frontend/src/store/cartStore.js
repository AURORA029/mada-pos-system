import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      orderType: 'sur_place', // 'sur_place' ou 'a_emporter'
      
      // Actions du panier
      setOrderType: (type) => set({ orderType: type }),
      
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.id === item.id);
        if (existingItem) {
          return {
            items: state.items.map(i => 
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),

      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(i => i.id !== itemId)
      })),

      updateQuantity: (itemId, delta) => set((state) => ({
        items: state.items.map(i => {
          if (i.id === itemId) {
            const newQuantity = i.quantity + delta;
            return newQuantity > 0 ? { ...i, quantity: newQuantity } : i;
          }
          return i;
        })
      })),

      clearCart: () => set({ items: [], orderType: 'sur_place' }),

      // Calculateurs (Getters) avec casting Number strict pour éviter la concaténation
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 0;
          return total + (price * qty);
        }, 0);
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
      }
    }),
    {
      name: 'mada-pos-cart-storage',
    }
  )
);