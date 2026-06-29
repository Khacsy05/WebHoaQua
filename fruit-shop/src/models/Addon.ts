import mongoose, { Schema, Document } from "mongoose";

export interface IAddon extends Document {
    name: string;
    price: number;
    description?: string;
    active: boolean;
}

const AddonSchema = new Schema<IAddon>(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, default: 0 },
        description: { type: String, trim: true },
        active: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const Addon = mongoose.models.Addon || mongoose.model<IAddon>("Addon", AddonSchema);
export default Addon;
