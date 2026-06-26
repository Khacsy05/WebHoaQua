import { CartData, CartItem, Product } from "@/types/shop";

const CART_KEY = "fruit_shop_cart";

export function getCart(): CartData {
    if (typeof window === "undefined") {
        return { items: [], total: 0, discount: 0, payable: 0, totalItems: 0 };
    }
    const cartStr = localStorage.getItem(CART_KEY);
    if (!cartStr) {
        return { items: [], total: 0, discount: 0, payable: 0, totalItems: 0 };
    }
    try {
        const items: CartItem[] = JSON.parse(cartStr);
        let total = 0;
        let totalItems = 0;
        
        items.forEach(item => {
            total += item.price * item.quantity;
            totalItems += item.quantity;
        });

        // Simple mock discount (e.g. 10% off for orders above 200k)
        const discount = total >= 200000 ? Math.round(total * 0.1) : 0;
        const payable = total - discount;

        return {
            items,
            total,
            discount,
            payable,
            totalItems
        };
    } catch (e) {
        return { items: [], total: 0, discount: 0, payable: 0, totalItems: 0 };
    }
}

export function addToCart(product: Product, quantity: number, addonsList: string[]) {
    if (typeof window === "undefined") return;
    const cartData = getCart();
    const items = cartData.items;

    // Generate a unique key based on productId and selected addons
    const productId = product.id || product._id;
    const addonKey = [...addonsList].sort().join("-");
    const cartKey = productId + (addonKey ? "_" + addonKey : "");

    // Calculate item price with addons
    const basePrice = Number(product.price);
    const addonPrices: Record<string, number> = { engrave: 50000, peel: 20000, wrap: 15000 };
    let finalUnitPrice = basePrice;
    addonsList.forEach(addon => {
        if (addonPrices[addon]) {
            finalUnitPrice += addonPrices[addon];
        }
    });

    const existingIndex = items.findIndex(item => item.cartKey === cartKey);
    if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
    } else {
        items.push({
            cartKey,
            id: product.id,
            _id: product._id,
            name: product.name + (addonsList.length > 0 ? " (Kèm dịch vụ)" : ""),
            price: finalUnitPrice,
            quantity,
            stock: product.stock,
            image: product.image,
            addons: addonsList
        });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function updateCartQuantity(cartKey: string, quantity: number) {
    if (typeof window === "undefined") return;
    const cartData = getCart();
    let items = cartData.items;

    if (quantity <= 0) {
        items = items.filter(item => item.cartKey !== cartKey);
    } else {
        const item = items.find(item => item.cartKey === cartKey);
        if (item) {
            item.quantity = quantity;
        }
    }

    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function removeFromCart(cartKey: string) {
    if (typeof window === "undefined") return;
    const cartData = getCart();
    const items = cartData.items.filter(item => item.cartKey !== cartKey);
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CART_KEY);
}
