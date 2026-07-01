// src/models/DashboardStat.ts
import mongoose from "mongoose";

const DashboardStatSchema = new mongoose.Schema({
    // Dùng một field cố định để đảm bảo bảng này luôn chỉ có duy nhất 1 dòng
    stat_id: { type: String, default: "global_stat", unique: true },
    totalOrders: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
});

export default mongoose.models.DashboardStat || mongoose.model("DashboardStat", DashboardStatSchema);