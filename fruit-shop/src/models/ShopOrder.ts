import mongoose, { Schema, Document } from "mongoose";

export interface IShopOrder extends Document {
    customer_id: mongoose.Types.ObjectId;
    status: "NEW" | "PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
    total_amount: number;
    discount_amount: number;
    payable_amount: number;
}

const ShopOrderSchema = new Schema<IShopOrder>(
    {
        customer_id: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
        status: {
            type: String,
            required: true,
            enum: ["NEW", "PENDING", "SHIPPING", "DELIVERED", "CANCELLED"],
            default: "NEW"
        },
        total_amount: { type: Number, required: true, default: 0 },
        discount_amount: { type: Number, required: true, default: 0 },
        payable_amount: { type: Number, required: true, default: 0 },
    },
    { timestamps: true } // Thay thế cho cột created_at tự động
);

const ShopOrder = mongoose.models.ShopOrder || mongoose.model<IShopOrder>("ShopOrder", ShopOrderSchema);
export default ShopOrder;