export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + '₫';
}

export function showNotification(message: string): void {
    if (typeof window === 'undefined') return;

    const toast = document.createElement('div');
    toast.className = 'fixed top-6 right-6 bg-green-600 text-white px-6 py-3.5 rounded-xl shadow-lg z-50 transition-all duration-300 ease-out opacity-0 translate-y-[-20px] font-semibold text-sm';
    toast.innerText = message;

    document.body.appendChild(toast);

    // Kích hoạt animation
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-[-20px]');
        toast.classList.add('opacity-100', 'translate-y-0');
    }, 50);

    // Tự hủy sau 2.5s
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

export function getProductImage(imagePath: string | undefined | null): string {
    if (!imagePath) return '/images/default.png';
    if (imagePath.startsWith('/') || imagePath.startsWith('http')) return imagePath;
    return `/images/${imagePath}`;
}