import mongoose, { Document, Schema } from "mongoose";

export interface IInvite extends Document {
  _id: string;
  companyId: mongoose.Types.ObjectId;
  email: string;
  role: "recruiter" | "admin";
  token: string;
  createdBy: mongoose.Types.ObjectId;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "ID da empresa é obrigatório"],
    },
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["recruiter", "admin"],
      default: "recruiter",
    },
    token: {
      type: String,
      required: [true, "Token é obrigatório"],
      unique: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Criador do convite é obrigatório"],
    },
    used: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: [true, "Data de expiração é obrigatória"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index composto para buscar convites válidos rapidamente
InviteSchema.index({ token: 1, used: 1, expiresAt: 1 });
InviteSchema.index({ email: 1, companyId: 1 });

export default mongoose.models.Invite ||
  mongoose.model<IInvite>("Invite", InviteSchema);

