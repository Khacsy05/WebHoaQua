import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// Import tất cả các model của bạn
import UserAccount from "@/models/UserAccount";
import Customer from "@/models/Customer";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ShopOrder from "@/models/ShopOrder";
import OrderItem from "@/models/OrderItem";
import Promotion from "@/models/Promotion";

export async function GET() {
    try {
        await connectDB();

        // 🚨 XÓA SẠCH DỮ LIỆU CŨ TRƯỚC KHI BƠM (Để tránh bị trùng lặp lỗi UNIQUE)
        await UserAccount.deleteMany({});
        await Customer.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await ShopOrder.deleteMany({});
        await OrderItem.deleteMany({});
        await Promotion.deleteMany({});

        // 1. Tạo dữ liệu mẫu cho USER ACCOUNTS (Mật khẩu thô, Middleware tự băm bcrypt)
        const users = await UserAccount.create([
            { username: "admin_fruit", password: "adminpassword", email: "admin@fruit.com", full_name: "Quản Trị Viên", role: "ROLE_ADMIN" },
            { username: "khacsy_customer", password: "customerpassword", email: "khacsy.customer@gmail.com", full_name: "Khắc Sỹ Khách Hàng", role: "ROLE_CUSTOMER" }
        ]);

        // 2. Tạo dữ liệu mẫu cho CUSTOMERS
        const customers = await Customer.create([
            { name: "Nguyễn Văn A", email: "nguyenvana@gmail.com", phone: "0987654321", address: "175 Tây Sơn, Đống Đa, Hà Nội" },
            { name: "Trần Thị B", email: "tranthib@gmail.com", phone: "0123456789", address: "Chùa Bộc, Đống Đa, Hà Nội" }
        ]);

        // 3. Tạo dữ liệu mẫu cho CATEGORIES
        const categories = await Category.create([
            { name: "Trái Cây Nhập Khẩu", description: "Hoa quả cao cấp nhập khẩu từ Úc, Mỹ, New Zealand" },
            { name: "Trái Cây Nội Địa", description: "Đặc sản trái cây vùng miền Việt Nam, chuẩn VietGAP" }
        ]);

        // 4. Tạo dữ liệu mẫu cho PRODUCTS (Cần lấy _id của Category tương ứng gắn vào)
        const products = await Product.create([
            { name: "Táo Envy New Zealand", description: "Táo giòn, ngọt đậm, thơm đặc trưng", price: 150000, stock: 100, category_id: categories[0]._id },
            { name: "Nho Mẫu Đơn Hàn Quốc", description: "Nho trái to, không hạt, thơm mùi sữa", price: 450000, stock: 50, category_id: categories[0]._id },
            { name: "Xoài Cát Hòa Lộc", description: "Xoài chín vàng, thịt dày, ngọt lịm", price: 750000, stock: 120, category_id: categories[1]._id },
            { name: "Vải Thiều Lục Ngạn", description: "Vải thiều chín mọng, cùi dày hạt nhỏ", price: 45000, stock: 200, category_id: categories[1]._id }
        ]);

        // 5. Tạo dữ liệu mẫu cho PROMOTIONS
        const promotions = await Promotion.create([
            { name: "Chào Hè Rực Rỡ", type: "sale", start_date: new Date("2026-06-01"), end_date: new Date("2026-08-31"), discount_percent: 10, threshold_amount: 200000, active: true },
            { name: "Mừng Khai Trương", type: "holiday", start_date: new Date("2026-06-20"), end_date: new Date("2026-06-30"), discount_percent: 15, threshold_amount: 500000, active: true }
        ]);

        // 6. Tạo dữ liệu mẫu cho SHOP ORDERS (Đơn hàng)
        const order1 = await ShopOrder.create({
            customer_id: customers[0]._id,
            status: "NEW",
            total_amount: 600000,       // 1 Táo Envy (150k) + 1 Nho Mẫu Đơn (450k)
            discount_amount: 60000,     // Giảm 10% từ mã Chào Hè
            payable_amount: 540000
        });

        // 7. Tạo dữ liệu mẫu cho ORDER ITEMS (Chi tiết đơn hàng)
        await OrderItem.create([
            { order_id: order1._id, product_id: products[0]._id, quantity: 1, unit_price: 150000, addons: "Bọc lưới xốp chống dập" },
            { order_id: order1._id, product_id: products[1]._id, quantity: 1, unit_price: 450000, addons: "Đóng hộp quà tặng" }
        ]);

        return NextResponse.json({
            success: true,
            message: "🚀 Đã xóa sạch dữ liệu cũ và bơm thành công 7 bảng dữ liệu mẫu hoàn chỉnh!"
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}