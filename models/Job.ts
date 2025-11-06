import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  _id: string;
  companyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  remote: boolean;
  type: "full-time" | "part-time" | "contract" | "internship";
  level: "junior" | "mid" | "senior" | "lead" | "executive";
  category: string;
  skills: string[];
  benefits: string[];
  status: "active" | "paused" | "closed";
  applicationsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Título da vaga é obrigatório"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Descrição é obrigatória"],
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],
    salaryRange: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "BRL",
      },
    },
    location: {
      type: String,
      required: [true, "Localização é obrigatória"],
    },
    remote: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      required: true,
    },
    level: {
      type: String,
      enum: ["junior", "mid", "senior", "lead", "executive"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
