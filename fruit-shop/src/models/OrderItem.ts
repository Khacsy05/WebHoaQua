import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem extends Document {
    order_id: mongoose.Types.ObjectId;
    product_id: mongoose.Types.ObjectId;
    quantity: number;
    unit_price: number;
    addons?: string;
}

const OrderItemSchema = new Schema<IOrderItem>(
    {
        order_id: { type: Schema.Types.ObjectId, ref: "ShopOrder", required: true },
        product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, default: 1 },
        unit_price: { type: Number, required: true, default: 0 },
        addons: { type: [String], default: [] }
    },
    { timestamps: true }
);

const OrderItem = mongoose.models.OrderItem || mongoose.model<IOrderItem>("OrderItem", OrderItemSchema);
export default OrderItem;