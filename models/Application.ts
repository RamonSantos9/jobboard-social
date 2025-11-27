import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  _id: string;
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  resumeUrl?: string;
  coverLetter?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  additionalInfo?: string;
  profileSnapshot?: {
    headline?: string;
    location?: string;
    currentTitle?: string;
    currentCompany?: string;
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      startDate: Date;
      endDate?: Date;
      current: boolean;
      description?: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: Date;
      endDate?: Date;
      current: boolean;
    }>;
  };
  status: "pending" | "reviewed" | "accepted" | "rejected";
  notes?: string;
  appliedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeUrl: String,
    coverLetter: {
      type: String,
      maxlength: [
        1000,
        "Carta de apresentação deve ter no máximo 1000 caracteres",
      ],
    },
    candidateName: String,
    candidateEmail: String,
    candidatePhone: String,
    additionalInfo: {
      type: String,
      maxlength: [2000, "Informações adicionais devem ter no máximo 2000 caracteres"],
    },
    profileSnapshot: {
      headline: String,
      location: String,
      currentTitle: String,
      currentCompany: String,
      skills: [String],
      experience: [
        {
          title: String,
          company: String,
          startDate: Date,
          endDate: Date,
          current: Boolean,
          description: String,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          fieldOfStudy: String,
          startDate: Date,
          endDate: Date,
          current: Boolean,
        },
      ],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    notes: String,
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

// Performance indexes
ApplicationSchema.index({ status: 1 }); // Para buscar por status (pending, reviewed, etc)
ApplicationSchema.index({ appliedAt: -1 }); // Para buscar candidaturas recentes
ApplicationSchema.index({ candidateId: 1, appliedAt: -1 }); // Para buscar candidaturas de um candidato ordenadas por data
ApplicationSchema.index({ jobId: 1, status: 1 }); // Para buscar candidaturas de uma vaga por status

export default mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
