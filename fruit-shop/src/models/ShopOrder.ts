import mongoose, { Schema, Document } from "mongoose";

export interface IShopOrder extends Document {
    customer_id: mongoose.Types.ObjectId;
    status: "PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
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
            enum: ["PENDING", "SHIPPING", "DELIVERED", "CANCELLED"],
            default: "PENDING"
        },
        total_amount: { type: Number, required: true, default: 0 },
        discount_amount: { type: Number, required: true, default: 0 },
        payable_amount: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

if (mongoose.models.ShopOrder) {
    const enumValues = mongoose.models.ShopOrder.schema.paths.status.options.enum;
    if (enumValues && enumValues.includes("NEW")) {
        delete mongoose.models.ShopOrder;
    }
}

const ShopOrder = mongoose.models.ShopOrder || mongoose.model<IShopOrder>("ShopOrder", ShopOrderSchema);
export default ShopOrder;