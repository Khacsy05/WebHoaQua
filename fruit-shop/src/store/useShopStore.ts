import { create } from 'zustand';
import { Product, Category } from '@/types/shop';
import { fetchProducts } from '@/services/productService';
import { fetchCategories } from '@/services/categoriesService';

interface ShopState {
    products: Product[];
    categories: Category[];
    selectedCategoryId: string | number | null;
    initialLoaded: boolean;
    setSelectedCategoryId: (categoryId: string | number | null) => void;
    loadShopData: (categoryId?: string | number | null, forceReload?: boolean, forceReloadCategories?: boolean, search?: string | null) => Promise<void>;
}

export const useShopStore = create<ShopState>((set, get) => ({
    products: [],
    categories: [],
    selectedCategoryId: null,
    initialLoaded: false,

    setSelectedCategoryId: (categoryId) => {
        set({ selectedCategoryId: categoryId });
        get().loadShopData(categoryId, true, false, null); // reload products for this category
    },

    loadShopData: async (categoryId = null, forceReload = false, forceReloadCategories = false, search = null) => {
        try {
            let currentCats = get().categories;
            if (currentCats.length === 0 || forceReloadCategories) {
                currentCats = await fetchCategories();
            }

            const productsData = await fetchProducts(categoryId, search);

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
