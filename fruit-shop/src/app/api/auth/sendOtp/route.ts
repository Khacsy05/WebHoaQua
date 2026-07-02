import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserAccount from "@/models/UserAccount";
import { getKafkaProducer } from "@/lib/kafka";
export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { email } = body;
        if (!email) {
            return NextResponse.json(
                { success: false, error: "Please provide an email" },
                { status: 400 }
            );
        }
        const emailExists = await UserAccount.findOne({ email });
        if (!emailExists) {
            return NextResponse.json(
                { success: false, message: "Email no exists" },
                { status: 400 }
            )
        }
        // 6 số
        const otpCode = Math.floor(Math.random() * 900000 + 100000);
        const expireIn = "5 phút";
        const producer = await getKafkaProducer();

        const emailPayload = {
            emailType: "RESET_PASSWORD_OTP",
            to: email,
            subject: "🔒 Mã OTP khôi phục mật khẩu FruitShop của bạn",
            orderInfo: {
                otpCode,
                expireIn
            }
        }
        await producer.send({
            topic: "fruit-emails-topic",
            messages: [{ value: JSON.stringify(emailPayload) }]
        })
        return NextResponse.json({
            success: true,
            message: `Mã OTP đã được gửi tới email ${email}. Mã này sẽ hết hạn sau ${expireIn}`,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}