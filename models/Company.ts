import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface ICompany extends Document {
  _id: string;
  admins: mongoose.Types.ObjectId[];
  recruiters: mongoose.Types.ObjectId[];
  name: string;
  cnpj: string;
  email: string;
  password: string;
  username?: string;
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
  sidebarTitle?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Senha é obrigatória"],
      minlength: [6, "Senha deve ter pelo menos 6 caracteres"],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty
          return /^[a-z0-9_-]+$/.test(v);
        },
        message: "Username deve conter apenas letras, números, underscores e hífens, sem espaços",
      },
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
    sidebarTitle: {
      type: String,
      trim: true,
      maxlength: [50, "Título do sidebar deve ter no máximo 50 caracteres"],
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
CompanySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Verificar se a senha já está hasheada (começa com $2a$, $2b$ ou $2y$)
  // Se já estiver hasheada, não fazer hash novamente (evitar double hash)
  if (this.password && /^\$2[ayb]\$.{56}$/.test(this.password)) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
CompanySchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Performance indexes
CompanySchema.index({ isVerified: 1 }); // Para buscar empresas verificadas
CompanySchema.index({ isActive: 1 }); // Para buscar empresas ativas
CompanySchema.index({ industry: 1 }); // Para buscar por setor
CompanySchema.index({ isVerified: 1, isActive: 1 }); // Para buscar empresas verificadas e ativas

export default mongoose.models.Company ||
  mongoose.model<ICompany>("Company", CompanySchema);
