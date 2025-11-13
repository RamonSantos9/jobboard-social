import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import CompanyModel from "@/models/Company";

// Validação de variáveis de ambiente
// NEXTAUTH_SECRET e NEXTAUTH_URL são validados pelo NextAuth

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Necessário para produção na Vercel
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("EMAIL_PASSWORD_REQUIRED");
        }

        try {
          await connectDB();

          // Normalizar email
          const email = (credentials.email as string).toLowerCase().trim();
          const password = credentials.password as string;

          // Buscar usuário e empresa em paralelo para melhor performance
          const [user, company] = await Promise.all([
            UserModel.findOne({ email }),
            CompanyModel.findOne({ email }),
          ]);

          // Se encontrou usuário
          if (user) {
            // Verificar se a conta está ativa
            if (!user.isActive) {
              throw new Error("ACCOUNT_INACTIVE");
            }

            // Verificar status da conta
            if (user.status === "suspended") {
              throw new Error("ACCOUNT_SUSPENDED");
            }

            if (user.status === "pending") {
              throw new Error("ACCOUNT_PENDING");
            }

            // Verificar senha
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
              throw new Error("INVALID_PASSWORD");
            }

            // Login bem-sucedido
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

          // Se encontrou empresa
          if (company) {
            // Verificar se a conta está ativa
            if (!company.isActive) {
              throw new Error("ACCOUNT_INACTIVE");
            }

            // Verificar senha
            const isPasswordValid = await company.comparePassword(password);

            if (!isPasswordValid) {
              throw new Error("INVALID_PASSWORD");
            }

            // Login bem-sucedido
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

          // Email não encontrado (nem como usuário nem como empresa)
          throw new Error("EMAIL_NOT_FOUND");
        } catch (error: unknown) {
          // Verificar se é um erro de conexão com o banco de dados
          // O connectDB() lança erros com a propriedade 'details' contendo informações estruturadas
          if (error instanceof Error && (error as any).details) {
            const errorDetails = (error as any).details;
            const errorType = errorDetails.type || "UNKNOWN_ERROR";

            // Mapear tipo de erro para código de erro apropriado
            let errorCode = "DATABASE_CONNECTION_ERROR";
            switch (errorType) {
              case "MISSING_URI":
              case "INVALID_URI":
                errorCode = "DATABASE_CONFIG_ERROR";
                break;
              case "HOST_NOT_FOUND":
                errorCode = "DATABASE_HOST_ERROR";
                break;
              case "AUTH_FAILED":
                errorCode = "DATABASE_AUTH_ERROR";
                break;
              case "TIMEOUT":
              case "SERVER_SELECTION_TIMEOUT":
                errorCode = "DATABASE_TIMEOUT_ERROR";
                break;
              case "CONNECTION_REFUSED":
                errorCode = "DATABASE_REFUSED_ERROR";
                break;
              case "IP_NOT_AUTHORIZED":
                errorCode = "DATABASE_ACCESS_ERROR";
                break;
              case "SSL_ERROR":
                errorCode = "DATABASE_SSL_ERROR";
                break;
              default:
                errorCode = "DATABASE_CONNECTION_ERROR";
            }

            // Criar erro com informações detalhadas
            const dbError = new Error(
              errorDetails.message || "Erro de conexão com o banco de dados"
            );
            (dbError as any).code = errorCode;
            (dbError as any).type = errorType;
            (dbError as any).details = errorDetails;
            throw dbError;
          }

          // Verificar se é um erro de conexão com o banco de dados (detecção genérica)
          if (
            error instanceof Error &&
            (error.message.includes("MongoServerError") ||
              error.message.includes("Mongoose") ||
              error.message.includes("connection") ||
              error.message.includes("timeout") ||
              error.message.includes("MongoNetworkError"))
          ) {
            const dbError = new Error("Erro de conexão com o banco de dados");
            (dbError as any).code = "DATABASE_CONNECTION_ERROR";
            throw dbError;
          }

          // Se já é um erro que lançamos, re-lançar
          if (
            error instanceof Error &&
            error.message &&
            [
              "EMAIL_PASSWORD_REQUIRED",
              "ACCOUNT_INACTIVE",
              "ACCOUNT_SUSPENDED",
              "ACCOUNT_PENDING",
              "INVALID_PASSWORD",
              "EMAIL_NOT_FOUND",
              "DATABASE_CONNECTION_ERROR",
              "DATABASE_CONFIG_ERROR",
              "DATABASE_HOST_ERROR",
              "DATABASE_AUTH_ERROR",
              "DATABASE_TIMEOUT_ERROR",
              "DATABASE_REFUSED_ERROR",
              "DATABASE_ACCESS_ERROR",
              "DATABASE_SSL_ERROR",
            ].includes(error.message)
          ) {
            throw error;
          }

          // Para outros erros, lançar erro genérico
          throw new Error("AUTH_ERROR");
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
        (session.user as any).accountType =
          (token.accountType as string) || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/feed/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});
