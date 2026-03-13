import { create } from 'zustand';

export const useAppStore = create((set) => ({
    // Authentication & User
    user: null,
    token: localStorage.getItem('token') || null,
    tempTgUser: null, // Temporary storage for registration
    setUser: (userData, token) => {
        if (token) localStorage.setItem('token', token);
        set({ user: userData, token, tempTgUser: null });
    },
    setTempTgUser: (tgUser) => set({ tempTgUser: tgUser }),
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, tempTgUser: null });
    },

    // Theming (light, dark, pink)
    theme: localStorage.getItem('theme') || 'light',
    setTheme: (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        set({ theme: newTheme });
    },

    // Internationalization (en, ko, uz, ru)
    lang: localStorage.getItem('lang') || 'en',
    setLang: (newLang) => {
        localStorage.setItem('lang', newLang);
        set({ lang: newLang });
    },

    // Cart
    cart: [],
    addToCart: (product, quantity = 1, addons = []) => set((state) => {
        // Basic logic for cart addition.
        // In a real app, we'd check if product+addons already exist and increment quantity
        const existingIndex = state.cart.findIndex(item =>
            item.product._id === product._id && JSON.stringify(item.addons) === JSON.stringify(addons)
        );

        if (existingIndex >= 0) {
            const newCart = [...state.cart];
            const newQty = newCart[existingIndex].quantity + quantity;
            if (product.stock !== null && product.stock !== undefined && newQty > product.stock) {
                newCart[existingIndex].quantity = product.stock;
            } else {
                newCart[existingIndex].quantity = newQty;
            }
            return { cart: newCart };
        }

        return { cart: [...state.cart, { product, quantity, addons, priceAtTime: product.price }] };
    }),
    updateQuantity: (index, delta) => set((state) => {
        const newCart = [...state.cart];
        const item = newCart[index];
        const newQty = item.quantity + delta;

        // Max bounds check
        if (item.product.stock !== null && item.product.stock !== undefined) {
            if (newQty > item.product.stock) return state;
        }

        // Min bounds check
        const minQty = item.product.minOrderQuantity || 1;
        if (newQty < minQty) {
            return { cart: state.cart.filter((_, i) => i !== index) };
        }

        item.quantity = newQty;
        return { cart: newCart };
    }),
    removeFromCart: (index) => set((state) => ({
        cart: state.cart.filter((_, i) => i !== index)
    })),
    clearCart: () => set({ cart: [] }),

    // App Config
    isLocationBlocked: false,
    setLocationBlocked: (isBlocked) => set({ isLocationBlocked: isBlocked }),

    // Global Call State
    incomingCall: null,
    activeCall: null,
    setIncomingCall: (call) => set({ incomingCall: call }),
    setActiveCall: (call) => set({ activeCall: call }),
}));

// Initialize theme on load
const storedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', storedTheme);
