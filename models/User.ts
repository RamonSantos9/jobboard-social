import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  companyId?: mongoose.Types.ObjectId;
  isRecruiter: boolean;
  status: "active" | "pending" | "suspended";
  onboardingCompleted: boolean;
  isActive: boolean;
  profile?: mongoose.Types.ObjectId;
  config?: {
    username?: string;
  };
  dashboardAccess?: boolean; // Acesso ao dashboard liberado pelo admin master
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
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
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isRecruiter: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      default: null,
    },
    config: {
      username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        validate: {
          validator: function(v: string) {
            if (!v) return true; // Allow empty
            // Username must be alphanumeric, underscores, and hyphens only, no spaces
            return /^[a-z0-9_-]+$/.test(v);
          },
          message: "Username deve conter apenas letras, números, underscores e hífens, sem espaços",
        },
      },
    },
    dashboardAccess: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
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
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
