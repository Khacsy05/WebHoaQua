import mongoose, { Schema, Document } from "mongoose";

export interface IAddon extends Document {
    name: string;
    price: number;
    description?: string;
    active: boolean;
    allowed_categories?: mongoose.Types.ObjectId[];
}

const AddonSchema = new Schema<IAddon>(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, default: 0 },
        description: { type: String, trim: true },
        active: { type: Boolean, default: true },
        allowed_categories: {
            type: [Schema.Types.ObjectId],
            ref: "Category",
            default: []
        }
    },
    { timestamps: true }
);

if (mongoose.models.Addon && !mongoose.models.Addon.schema.paths.allowed_categories) {
    delete mongoose.models.Addon;
}

const Addon = mongoose.models.Addon || mongoose.model<IAddon>("Addon", AddonSchema);
export default Addon;
