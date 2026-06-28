import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/shop';
import { fetchCurrentUser } from '@/services/authService';
import { isTokenExpired } from '@/utils/helpers';

interface AuthState {
    user: User | null;
    loading: boolean;
    hasHydrated: boolean;
    setHasHydrated: (val: boolean) => void;
    setUser: (user: User | null) => void;
    loadUser: (force?: boolean) => Promise<User | null>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            loading: false,
            hasHydrated: false,
            setHasHydrated: (val) => set({ hasHydrated: val }),
            setUser: (user) => set({ user }),
            loadUser: async (force = false) => {
                const token = typeof window !== "undefined" ? localStorage.getItem("fruit_shop_token") : null;
                if (token && isTokenExpired(token)) {
                    if (typeof window !== "undefined") {
                        localStorage.removeItem("fruit_shop_token");
                        window.location.href = "/login";
                    }
                    set({ user: null });
                    return null;
                }

                if (get().user && !force) {
                    return get().user;
                }
                set({ loading: true });
                try {
                    const userData = await fetchCurrentUser();
                    if (!userData && token) {
                        if (typeof window !== "undefined") {
                            localStorage.removeItem("fruit_shop_token");
                            window.location.href = "/login";
                        }
                        set({ user: null, loading: false });
                        return null;
                    }
                    set({ user: userData, loading: false });
                    return userData;
                } catch (error) {
                    set({ user: null, loading: false });
                    return null;
                }
            },
            logout: () => {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("fruit_shop_token");
                }
                set({ user: null });
            }
        }),
        {
            name: 'fruit-shop-auth-storage',
            partialize: (state) => ({ user: state.user }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
