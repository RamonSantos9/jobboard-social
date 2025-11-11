import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          const user = await UserModel.findOne({ email: credentials.email });

          if (!user || !user.isActive) {
            return null;
          }

          const isPasswordValid = await user.comparePassword(
            credentials.password
          );
          if (!isPasswordValid) {
            return null;
          }

          // Retornando um objeto compatível com User
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          } as User;
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
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/feed/auth/login",
    // signUp não é suportado nativamente
    // Você pode criar manualmente a rota /auth/register sem precisar registrá-la aqui
  },
  session: {
    strategy: "jwt",
  },
};
