const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Schema do Profile (copiado do modelo)
const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    headline: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experience: [
      {
        title: {
          type: String,
          required: true,
        },
        company: {
          type: String,
          required: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          default: null,
        },
        current: {
          type: Boolean,
          default: false,
        },
        description: {
          type: String,
          default: "",
        },
      },
    ],
    education: [
      {
        institution: {
          type: String,
          required: true,
        },
        degree: {
          type: String,
          required: true,
        },
        fieldOfStudy: {
          type: String,
          required: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          default: null,
        },
        current: {
          type: Boolean,
          default: false,
        },
        description: {
          type: String,
          default: "",
        },
      },
    ],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Profile =
  mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);

async function debugProfile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Buscar todos os perfis
    const profiles = await Profile.find({});
    console.log("All profiles:", profiles);

    // Buscar perfis sem slug
    const profilesWithoutSlug = await Profile.find({
      slug: { $exists: false },
    });
    console.log("Profiles without slug:", profilesWithoutSlug);

    // Buscar perfis com slug null
    const profilesWithNullSlug = await Profile.find({ slug: null });
    console.log("Profiles with null slug:", profilesWithNullSlug);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

debugProfile();
