import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// Tránh lỗi Next.js re-compile tạo lại Model nhiều lần
const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
export default Category;