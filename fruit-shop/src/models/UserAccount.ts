import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUserAccount extends Document {
    username: string;
    password: string;
    full_name?: string;
    email: string;
    role: "ROLE_ADMIN" | "ROLE_CUSTOMER";
    active: boolean;
    comparePassword(password: string): Promise<boolean>;
}

const UserAccountSchema = new Schema<IUserAccount>(
    {
        username: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        full_name: { type: String, default: null },
        email: { type: String, required: true, unique: true, trim: true },
        role: { type: String, required: true, enum: ["ROLE_ADMIN", "ROLE_CUSTOMER"] },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

UserAccountSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
        throw error;
    }
});

UserAccountSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

const UserAccount = mongoose.models.UserAccount || mongoose.model<IUserAccount>("UserAccount", UserAccountSchema);
export default UserAccount;