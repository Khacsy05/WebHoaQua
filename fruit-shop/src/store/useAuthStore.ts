import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/shop';
import { fetchCurrentUser } from '@/services/authService';

interface AuthState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    loadUser: (force?: boolean) => Promise<User | null>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            loading: false,
            setUser: (user) => set({ user }),
            loadUser: async (force = false) => {
                if (get().user && !force) {
                    return get().user;
                }
                set({ loading: true });
                try {
                    const userData = await fetchCurrentUser();
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
        }
    )
);
