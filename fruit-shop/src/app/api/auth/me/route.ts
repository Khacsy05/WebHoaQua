import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

export async function GET(request: Request) {
    const auth = verifyAuth(request, ["ROLE_ADMIN", "ROLE_CUSTOMER"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    let customerData = null;
    try {
        await connectDB();
        if (auth.user?.customerId) {
            customerData = await Customer.findById(auth.user.customerId);
        }
        // Fallback if not found or customerId is null
        if (!customerData && auth.user?.userId) {
            customerData = await Customer.findOne({ user_id: auth.user.userId });
            if (!customerData) {
                customerData = await Customer.create({
                    user_id: auth.user.userId,
                    name: auth.user.username,
                    email: auth.user.username + "@gmail.com",
                    phone: null,
                    address: null
                });
            }
        }
    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin khách hàng:", error);
    }

    return NextResponse.json({
        success: true,
        data: {
            name: auth.user?.username,
            role: auth.user?.role,
            customerId: customerData ? customerData._id : auth.user?.customerId,
            customer: customerData ? {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address
            } : null
        }
    });
}

export async function PUT(request: Request) {
    const auth = verifyAuth(request, ["ROLE_ADMIN", "ROLE_CUSTOMER"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { name, phone, address } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ success: false, message: "Tên không được để trống" }, { status: 400 });
        }

        await connectDB();
        
        let customerData = null;
        if (auth.user?.customerId) {
            customerData = await Customer.findById(auth.user.customerId);
        }
        
        if (!customerData && auth.user?.userId) {
            customerData = await Customer.findOne({ user_id: auth.user.userId });
        }

        if (!customerData) {
            customerData = await Customer.create({
                user_id: auth.user?.userId,
                name: name,
                email: auth.user?.username + "@gmail.com",
                phone: phone || null,
                address: address || null
            });
        } else {
            customerData.name = name;
            customerData.phone = phone || null;
            customerData.address = address || null;
            await customerData.save();
        }

        return NextResponse.json({
            success: true,
            message: "Cập nhật thông tin thành công",
            data: {
                name: auth.user?.username,
                role: auth.user?.role,
                customerId: customerData._id,
                customer: {
                    name: customerData.name,
                    email: customerData.email,
                    phone: customerData.phone,
                    address: customerData.address
                }
            }
        });
    } catch (error: any) {
        console.error("Lỗi khi cập nhật thông tin khách hàng:", error);
        return NextResponse.json({ success: false, message: error.message || "Lỗi server" }, { status: 500 });
    }
}

