import mongoose, { Document, Schema } from "mongoose";

export type VacancyType = "full-time" | "part-time" | "contract" | "internship";
export type VacancyLevel = "junior" | "mid" | "senior" | "lead" | "executive";
export type VacancyStatus = "draft" | "published" | "paused" | "closed";

export interface IVacancy extends Document {
  _id: string;
  companyId: mongoose.Types.ObjectId;
  postedBy?: mongoose.Types.ObjectId | null;
  title: string;
  slug?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  location: string;
  remote: boolean;
  type: VacancyType;
  level: VacancyLevel;
  category: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  tags: string[];
  status: VacancyStatus;
  publishedAt?: Date;
  expiresAt?: Date;
  applicationsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const baseSalaryByLevel: Record<VacancyLevel, { min: number; max: number }> = {
  junior: { min: 3000, max: 6000 },
  mid: { min: 6000, max: 12000 },
  senior: { min: 12000, max: 20000 },
  lead: { min: 20000, max: 30000 },
  executive: { min: 30000, max: 50000 },
};

const VacancySchema = new Schema<IVacancy>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Título da vaga é obrigatório"],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
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
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
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
      trim: true,
    },
    salaryRange: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "BRL",
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "paused", "closed"],
      default: "published",
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
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

VacancySchema.index({ createdAt: -1 });
VacancySchema.index({ companyId: 1, status: 1, createdAt: -1 });

VacancySchema.pre<IVacancy>("save", function (next) {
  if (
    this.isModified("level") &&
    this.salaryRange?.min &&
    this.salaryRange?.max
  ) {
    const band = baseSalaryByLevel[this.level];
    if (band) {
      if (this.salaryRange.min < band.min || this.salaryRange.max > band.max) {
        return next(
          new Error(
            `Faixa salarial deve estar entre R$${band.min} e R$${band.max} para o nível ${this.level}.`
          )
        );
      }
      if (this.salaryRange.min > this.salaryRange.max) {
        return next(
          new Error("Salário mínimo não pode ser maior que o máximo")
        );
      }
    }
  }

  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  return next();
});

export const vacancyLevelSalaryBands = baseSalaryByLevel;

export default mongoose.models.Vacancy ||
  mongoose.model<IVacancy>("Vacancy", VacancySchema);
