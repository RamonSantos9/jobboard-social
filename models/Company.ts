import mongoose, { Document, Schema } from "mongoose";

export interface ICompany extends Document {
  _id: string;
  admins: mongoose.Types.ObjectId[];
  recruiters: mongoose.Types.ObjectId[];
  name: string;
  cnpj: string;
  industry: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description: string;
  size: "startup" | "small" | "medium" | "large" | "enterprise";
  location: string;
  foundedYear?: number;
  followersCount: number;
  jobsCount: number;
  isVerified: boolean;
  benefits: string[];
  culture?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    recruiters: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    name: {
      type: String,
      required: [true, "Nome da empresa é obrigatório"],
      trim: true,
    },
    cnpj: {
      type: String,
      required: [true, "CNPJ é obrigatório"],
      unique: true,
      trim: true,
    },
    industry: {
      type: String,
      required: [true, "Indústria é obrigatória"],
    },
    website: String,
    logoUrl: String,
    bannerUrl: String,
    description: {
      type: String,
      required: [true, "Descrição é obrigatória"],
      maxlength: [1000, "Descrição deve ter no máximo 1000 caracteres"],
    },
    size: {
      type: String,
      enum: ["startup", "small", "medium", "large", "enterprise"],
      required: true,
    },
    location: {
      type: String,
      required: [true, "Localização é obrigatória"],
    },
    foundedYear: Number,
    followersCount: {
      type: Number,
      default: 0,
    },
    jobsCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    benefits: [String],
    culture: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Company ||
  mongoose.model<ICompany>("Company", CompanySchema);
