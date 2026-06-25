import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description?: string;
    image?: string;
    price: number;
    stock: number;
    category_id: mongoose.Types.ObjectId; // Khóa ngoại liên kết tới Category
}

const ProductSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        image: { type: String, default: null },
        price: { type: Number, required: true, default: 0 },
        stock: { type: Number, required: true, default: 0 },
        category_id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    },
    { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export default Product;