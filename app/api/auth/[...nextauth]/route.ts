import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
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

          const user = await User.findOne({ email: credentials.email });

          if (!user || !user.isActive) {
            return null;
          }

          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isRecruiter: user.isRecruiter,
            companyId: user.companyId?.toString(),
            status: user.status,
            onboardingCompleted: user.onboardingCompleted,
          };
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
        token.name = user.name;
        token.role = user.role;
        token.isRecruiter = user.isRecruiter;
        token.companyId = user.companyId;
        token.status = user.status;
        token.onboardingCompleted = user.onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.isRecruiter = token.isRecruiter as boolean;
        session.user.companyId = token.companyId as string;
        session.user.status = token.status as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
