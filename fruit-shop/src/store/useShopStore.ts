import { create } from 'zustand';
import { Product, Category } from '@/types/shop';
import { fetchProducts, fetchCategories } from '@/services/productService';

interface ShopState {
    products: Product[];
    categories: Category[];
    selectedCategoryId: string | number | null;
    initialLoaded: boolean;
    setSelectedCategoryId: (categoryId: string | number | null) => void;
    loadShopData: (categoryId?: string | number | null, forceReload?: boolean) => Promise<void>;
}

export const useShopStore = create<ShopState>((set, get) => ({
    products: [],
    categories: [],
    selectedCategoryId: null,
    initialLoaded: false,

    setSelectedCategoryId: (categoryId) => {
        set({ selectedCategoryId: categoryId });
        get().loadShopData(categoryId, true); // reload products for this category
    },

    loadShopData: async (categoryId = null, forceReload = false) => {
        // If categories are already loaded, just load products
        try {
            let currentCats = get().categories;
            if (currentCats.length === 0) {
                currentCats = await fetchCategories();
            }

            // Only fetch products if forced or not loaded yet
            const productsData = await fetchProducts(categoryId);

            set({
                categories: currentCats,
                products: productsData,
                selectedCategoryId: categoryId,
                initialLoaded: true
            });
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu cửa hàng:", error);
        }
    }
}));
