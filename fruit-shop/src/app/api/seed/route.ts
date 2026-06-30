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
import Addon from "@/models/Addon";

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
        await Addon.deleteMany({});

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
            { name: "Trái Cây Nhập Khẩu", description: "Hoa quả cao cấp nhập khẩu từ Úc, Mỹ, New Zealand, Hàn Quốc" },
            { name: "Trái Cây Nội Địa", description: "Đặc sản trái cây vùng miền nổi tiếng Việt Nam, chuẩn VietGAP" },
            { name: "Hộp Quà Trái Cây", description: "Hộp quà, giỏ quà trái cây sang trọng thích hợp đi tặng, biếu" },
            { name: "Trái Cây Sấy & Khô", description: "Trái cây sấy khô tự nhiên, ăn nhẹ bổ dưỡng tốt cho sức khỏe" },
            { name: "Nước Ép Trái Cây", description: "Nước ép từ hoa quả tươi nguyên chất 100% không thêm đường" }
        ]);

        // 4. Tạo dữ liệu mẫu cho PRODUCTS (Cần lấy _id của Category tương ứng gắn vào)
        const products = await Product.create([
            // Trái Cây Nhập Khẩu
            { name: "Táo Envy New Zealand", description: "Táo giòn tan, ngọt đậm, hương thơm đặc trưng cực kỳ sang trọng", price: 150000, stock: 100, category_id: categories[0]._id },
            { name: "Nho Mẫu Đơn Hàn Quốc", description: "Nho trái siêu to, không hạt, vị ngọt đậm sữa tự nhiên cao cấp", price: 450000, stock: 50, category_id: categories[0]._id },
            { name: "Kiwi Vàng New Zealand", description: "Kiwi vàng mọng nước, giàu Vitamin C, vị chua ngọt thanh mát", price: 190000, stock: 80, category_id: categories[0]._id },
            { name: "Việt Quất Mỹ Hộp 125g", description: "Quả việt quất tươi ngon, giòn ngọt nhập khẩu trực tiếp từ Mỹ", price: 120000, stock: 150, category_id: categories[0]._id },
            { name: "Dâu Tây Hàn Quốc Hộp 330g", description: "Dâu tây đỏ mọng thơm ngào ngạt, vị ngọt thanh tự nhiên", price: 350000, stock: 40, category_id: categories[0]._id },
            { name: "Cherry Đỏ Mỹ Size 9.5", description: "Cherry đỏ sẫm giòn ngọt, mọng nước nhập khẩu chính ngạch", price: 490000, stock: 60, category_id: categories[0]._id },
            { name: "Cam Vàng Sunkist Mỹ", description: "Cam vàng vỏ thơm đậm vị, nhiều nước ngọt mát lạnh", price: 95000, stock: 120, category_id: categories[0]._id },
            { name: "Lê Hàn Quốc Premium", description: "Lê vàng quả to khổng lồ, giòn ngọt thanh tao và mọng nước", price: 140000, stock: 75, category_id: categories[0]._id },

            // Trái Cây Nội Địa
            { name: "Xoài Cát Hòa Lộc", description: "Xoài chín vàng ươm thơm ngát, thịt xoài dày dẻo ngọt lịm", price: 85000, stock: 120, category_id: categories[1]._id },
            { name: "Vải Thiều Lục Ngạn", description: "Vải thiều Bắc Giang chín mọng, cùi dày hạt nhỏ xíu, ngọt sắc", price: 45000, stock: 200, category_id: categories[1]._id },
            { name: "Bưởi Da Xanh Bến Tre", description: "Bưởi da xanh tép hồng căng mọng, vị ngọt thanh không đắng", price: 75000, stock: 90, category_id: categories[1]._id },
            { name: "Sầu Riêng Ri6 Đắk Lắk", description: "Sầu riêng cơm vàng hạt lép, béo ngậy ngọt đậm đà thơm phức", price: 150000, stock: 60, category_id: categories[1]._id },
            { name: "Măng Cụt Chợ Lách", description: "Măng Cụt vỏ mỏng, ruột trắng muốt ngọt chua cân bằng hài hòa", price: 90000, stock: 85, category_id: categories[1]._id },
            { name: "Dưa Hấu Không Hạt Long An", description: "Dưa hấu vỏ mỏng ruột đỏ tươi giòn ngọt lịm giải nhiệt cực tốt", price: 25000, stock: 150, category_id: categories[1]._id },
            { name: "Cam Sành Hàm Yên", description: "Cam sành đặc sản nhiều nước vị ngọt chua thanh mát, tự nhiên", price: 35000, stock: 180, category_id: categories[1]._id },
            { name: "Thanh Long Ruột Đỏ Bình Thuận", description: "Thanh long ngọt đậm vị, nhiều dưỡng chất, mát da giải nhiệt", price: 40000, stock: 140, category_id: categories[1]._id },

            // Hộp Quà Trái Cây
            { name: "Hộp Quà Phú Quý Nhập Khẩu", description: "Hộp quà sang trọng kết hợp Táo Envy, Kiwi vàng và Nho Mỹ", price: 850000, stock: 20, category_id: categories[2]._id },
            { name: "Giỏ Hoa Quả Sum Vầy", description: "Giỏ trái cây đầy ắp đặc sản nhập khẩu đi kèm hoa tươi trang trí", price: 1250000, stock: 15, category_id: categories[2]._id },
            { name: "Hộp Quà Tặng Táo Envy Premium", description: "Hộp quà chứa 9 quả táo Envy New Zealand đỏ mọng đều nhau", price: 650000, stock: 30, category_id: categories[2]._id },

            // Trái Cây Sấy & Khô
            { name: "Mít Sấy Giòn Xuất Khẩu", description: "Mít sấy giòn tự nhiên thơm phức không đường hóa học tốt cho sức khỏe", price: 65000, stock: 100, category_id: categories[3]._id },
            { name: "Xoài Sấy Dẻo Thượng Hạng", description: "Xoài cát sấy dẻo chua chua ngọt ngọt nhâm nhi cực thích", price: 85000, stock: 120, category_id: categories[3]._id },
            { name: "Nho Khô Nguyên Cành Úc", description: "Nho khô tự nhiên trên cành ngọt thanh dẻo thơm thượng hạng", price: 180000, stock: 70, category_id: categories[3]._id },

            // Nước Ép Trái Cây
            { name: "Nước Ép Cam Tươi Nguyên Chất", description: "Nước ép cam sành tươi vắt nguyên chất bổ sung năng lượng tức thì", price: 45000, stock: 60, category_id: categories[4]._id },
            { name: "Nước Ép Táo Cần Tây Detox", description: "Nước ép táo kết hợp cần tây tươi ngon thanh lọc cơ thể giảm cân hiệu quả", price: 55000, stock: 40, category_id: categories[4]._id }
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
            { order_id: order1._id, product_id: products[0]._id, quantity: 1, unit_price: 150000, addons: "Gọt vỏ & Cắt sẵn" },
            { order_id: order1._id, product_id: products[1]._id, quantity: 1, unit_price: 450000, addons: "Bọc thiệp & Hộp quà" }
        ]);

        // 8. Tạo dữ liệu mẫu cho ADDONS (Dịch vụ chọn thêm)
        await Addon.create([
            { name: "Gọt vỏ & Cắt sẵn", price: 20000, description: "Gọt sạch vỏ và thái lát vừa ăn, xếp khay gọn gàng kèm dĩa", active: true, allowed_categories: [categories[0]._id, categories[1]._id] },
            { name: "Bọc thiệp & Hộp quà", price: 50000, description: "Thiết kế thiệp viết tay theo yêu cầu và đóng hộp quà sang trọng", active: true, allowed_categories: [] },
            { name: "Hút chân không bảo quan", price: 15000, description: "Hút chân không túi chuyên dụng giúp hoa quả tươi lâu hơn", active: true, allowed_categories: [categories[0]._id, categories[1]._id, categories[3]._id] },
            { name: "Đá khô giữ lạnh", price: 15000, description: "Đá khô gel giữ mát tối ưu khi vận chuyển đi xa", active: true, allowed_categories: [categories[0]._id, categories[1]._id, categories[4]._id] }
        ]);

        return NextResponse.json({
            success: true,
            message: "🚀 Đã xóa sạch dữ liệu cũ và bơm thành công 8 bảng dữ liệu mẫu hoàn chỉnh!"
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}