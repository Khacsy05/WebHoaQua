import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, trim: true },
        phone: { type: String, default: null },
        address: { type: String, default: null },
    },
    { timestamps: true }
);

const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export default Customer;