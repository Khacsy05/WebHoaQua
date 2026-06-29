import { CartData, CartItem, Product } from "@/types/shop";

function getCartKey(username?: string | null): string {
    return username ? `fruit_shop_cart_${username}` : "fruit_shop_cart_guest";
}

export function getCart(username?: string | null): CartData {
    if (typeof window === "undefined") {
        return { items: [], total: 0, discount: 0, payable: 0, totalItems: 0 };
    }
    const cartKey = getCartKey(username);
    const cartStr = localStorage.getItem(cartKey);
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

export function addToCart(product: Product, quantity: number, addonsList: { name: string; price: number }[], username?: string | null) {
    if (typeof window === "undefined") return;
    const cartKey = getCartKey(username);
    const cartData = getCart(username);
    const items = cartData.items;

    // Generate a unique key based on productId and selected addons
    const productId = product.id || product._id;
    const addonKey = addonsList.map(a => a.name).sort().join("-");
    const itemCartKey = productId + (addonKey ? "_" + addonKey : "");

    // Calculate item price with addons
    const basePrice = Number(product.price);
    let finalUnitPrice = basePrice;
    addonsList.forEach(addon => {
        finalUnitPrice += addon.price;
    });

    const existingIndex = items.findIndex(item => item.cartKey === itemCartKey);
    if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
    } else {
        items.push({
            cartKey: itemCartKey,
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

    localStorage.setItem(cartKey, JSON.stringify(items));
}

export function removeAddonFromCartItem(cartKey: string, addonName: string, username?: string | null) {
    if (typeof window === "undefined") return;
    const storageKey = getCartKey(username);
    const cartData = getCart(username);
    const items = cartData.items;

    const item = items.find(i => i.cartKey === cartKey);
    if (item && item.addons) {
        const addonIndex = item.addons.findIndex(a => a.name === addonName);
        if (addonIndex > -1) {
            const removedAddon = item.addons[addonIndex];
            // Khấu trừ tiền dịch vụ bị xóa khỏi đơn giá
            item.price -= removedAddon.price;
            // Xóa dịch vụ khỏi mảng
            item.addons.splice(addonIndex, 1);
            
            // Tính toán lại cartKey mới do danh sách dịch vụ thay đổi
            const productId = item.id || item._id;
            const addonKey = item.addons.map(a => a.name).sort().join("-");
            const newCartKey = productId + (addonKey ? "_" + addonKey : "");
            
            // Nếu trùng cartKey mới với phần tử đã có sẵn, tiến hành gộp số lượng
            const duplicateIndex = items.findIndex(i => i.cartKey === newCartKey && i !== item);
            if (duplicateIndex > -1) {
                items[duplicateIndex].quantity += item.quantity;
                const currentIdx = items.indexOf(item);
                items.splice(currentIdx, 1);
            } else {
                item.cartKey = newCartKey;
            }
        }
    }

    localStorage.setItem(storageKey, JSON.stringify(items));
}

export function updateCartQuantity(cartKey: string, quantity: number, username?: string | null) {
    if (typeof window === "undefined") return;
    const storageKey = getCartKey(username);
    const cartData = getCart(username);
    let items = cartData.items;

    if (quantity <= 0) {
        items = items.filter(item => item.cartKey !== cartKey);
    } else {
        const item = items.find(item => item.cartKey === cartKey);
        if (item) {
            item.quantity = quantity;
        }
    }

    localStorage.setItem(storageKey, JSON.stringify(items));
}

export function removeFromCart(cartKey: string, username?: string | null) {
    if (typeof window === "undefined") return;
    const storageKey = getCartKey(username);
    const cartData = getCart(username);
    const items = cartData.items.filter(item => item.cartKey !== cartKey);
    localStorage.setItem(storageKey, JSON.stringify(items));
}

export function clearCart(username?: string | null) {
    if (typeof window === "undefined") return;
    const storageKey = getCartKey(username);
    localStorage.removeItem(storageKey);
}
