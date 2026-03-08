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
            newCart[existingIndex].quantity += quantity;
            return { cart: newCart };
        }

        return { cart: [...state.cart, { product, quantity, addons, priceAtTime: product.price }] };
    }),
    removeFromCart: (index) => set((state) => ({
        cart: state.cart.filter((_, i) => i !== index)
    })),
    clearCart: () => set({ cart: [] }),

    // App Config
    isLocationBlocked: false,
    setLocationBlocked: (isBlocked) => set({ isLocationBlocked: isBlocked }),
}));

// Initialize theme on load
const storedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', storedTheme);
