import mongoose, { Schema, Document } from "mongoose";

export interface IPromotion extends Document {
    name: string;
    type: string;
    start_date: Date;
    end_date: Date;
    recurring_month?: number;
    recurring_day?: number;
    discount_percent: number;
    threshold_amount: number;
    active: boolean;
}

const PromotionSchema = new Schema<IPromotion>(
    {
        name: { type: String, required: true, trim: true },
        type: { type: String, required: true }, // bulk, holiday, sale,...
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },
        recurring_month: { type: Number, default: null },
        recurring_day: { type: Number, default: null },
        discount_percent: { type: Number, required: true }, // Ví dụ: 10.5 (tức là 10.5%)
        threshold_amount: { type: Number, required: true, default: 0 },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Promotion = mongoose.models.Promotion || mongoose.model<IPromotion>("Promotion", PromotionSchema);
export default Promotion;