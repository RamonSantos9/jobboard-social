import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import CompanyModel from "@/models/Company";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          
          // Primeiro, tentar encontrar como usuário
          const user = await UserModel.findOne({ email: credentials.email });

          if (user && user.isActive) {
            const isPasswordValid = await user.comparePassword(
              credentials.password as string
            );

            if (isPasswordValid) {
              return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isRecruiter: user.isRecruiter,
                companyId: user.companyId?.toString(),
                status: user.status,
                onboardingCompleted: user.onboardingCompleted,
                accountType: "user",
              };
            }
          }

          // Se não encontrou como usuário, tentar como empresa
          const company = await CompanyModel.findOne({ email: credentials.email });

          if (company && company.isActive) {
            const isPasswordValid = await company.comparePassword(
              credentials.password as string
            );

            if (isPasswordValid) {
              return {
                id: company._id.toString(),
                name: company.name,
                email: company.email,
                role: "company",
                isRecruiter: false,
                companyId: company._id.toString(),
                status: "active",
                onboardingCompleted: true,
                accountType: "company",
              };
            }
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role;
        token.isRecruiter = (user as any).isRecruiter;
        token.companyId = (user as any).companyId;
        token.status = (user as any).status;
        token.onboardingCompleted = (user as any).onboardingCompleted;
        token.accountType = (user as any).accountType || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.isRecruiter = token.isRecruiter as boolean;
        session.user.companyId = token.companyId as string;
        session.user.status = token.status as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        (session.user as any).accountType = token.accountType as string || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/feed/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});

