import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    user_id?: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, trim: true },
        phone: { type: String, default: null },
        address: { type: String, default: null },
        user_id: { type: Schema.Types.ObjectId, ref: "UserAccount", default: null },
    },
    { timestamps: true }
);

const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export default Customer;