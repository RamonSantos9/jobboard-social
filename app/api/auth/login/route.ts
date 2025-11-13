import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import CompanyModel from "@/models/Company";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Formato de requisição inválido." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Validar dados obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        { error: "EMAIL_PASSWORD_REQUIRED", message: "Por favor, preencha email e senha." },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError: any) {
      // Extrair detalhes do erro
      const errorDetails = dbError?.details || {};
      const errorType = errorDetails.type || "UNKNOWN_ERROR";
      const errorMessage = errorDetails.message || dbError?.message || "Erro de conexão com o servidor. Tente novamente mais tarde.";
      const errorSuggestion = errorDetails.suggestion || null;

      // Mapear código de erro baseado no tipo
      let errorCode = "DATABASE_CONNECTION_ERROR";
      switch (errorType) {
        case "MISSING_URI":
          errorCode = "DATABASE_CONFIG_ERROR";
          break;
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

      // Preparar resposta com informações úteis
      const response: any = {
        error: errorCode,
        message: errorMessage,
        type: errorType,
      };

      // Sempre incluir sugestão se disponível (útil para diagnóstico)
      if (errorSuggestion) {
        response.suggestion = errorSuggestion;
      }

      // Para erros de IP não autorizado, incluir instruções detalhadas
      if (errorType === "IP_NOT_AUTHORIZED") {
        response.fixSteps = [
          "1. Acesse /api/health/vercel-ip para obter o IP atual da Vercel",
          "2. Copie o IP mostrado em 'recommendedIp' ou 'externalIp'",
          "3. Acesse MongoDB Atlas → Network Access",
          "4. Clique em 'Add IP Address'",
          "5. Cole o IP copiado",
          "6. Adicione um comentário: 'Vercel - [data atual]'",
          "7. Clique em 'Confirm' e aguarde 2-5 minutos",
          "8. Após cada deploy, verifique se o IP mudou acessando /api/health/vercel-ip novamente",
        ];
        response.importantNote = "⚠️ IMPORTANTE: Como você está usando MongoDB Atlas Flex, o Private Endpoint não está disponível. Você precisará adicionar o IP manualmente após cada deploy se o IP mudar. Crie um bookmark de /api/health/vercel-ip para verificar rapidamente.";
        response.troubleshooting = [
          "Solução para MongoDB Atlas Flex:",
          "- Acesse /api/health/vercel-ip para ver o IP atual",
          "- Adicione esse IP no MongoDB Atlas Network Access",
          "- Após cada deploy, verifique se o IP mudou",
          "- Mantenha IPs antigos por alguns dias antes de remover (caso precise fazer rollback)",
          "- Considere fazer upgrade para M10+ se precisar de Private Endpoint (solução permanente)",
        ];
        response.quickLinks = {
          getCurrentIp: "/api/health/vercel-ip",
          checkIpStatus: "/api/health/ip-check",
          rawError: "/api/health/db-raw",
        };
      }

      // Incluir informações adicionais de diagnóstico em produção também
      // (mas sem expor dados sensíveis)
      response.diagnostic = {
        errorType: errorType,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "unknown",
        platform: process.env.VERCEL ? "Vercel" : "local",
        // Incluir código se disponível (não é sensível)
        ...(errorDetails.code && { code: errorDetails.code }),
        ...(errorDetails.codeName && { codeName: errorDetails.codeName }),
        // Incluir informações do erro original para diagnóstico
        originalErrorName: dbError?.originalError?.name || dbError?.name,
        originalErrorCode: dbError?.originalError?.code || dbError?.code,
        originalErrorCodeName: dbError?.originalError?.codeName || dbError?.codeName,
        originalErrorMessage: dbError?.originalError?.message || dbError?.message,
        // Informações adicionais do MongoDB se disponíveis
        ...(dbError?.originalError?.reason && { originalReason: dbError.originalError.reason }),
        ...(dbError?.originalError?.cause && { originalCause: dbError.originalError.cause }),
      };

      // Em desenvolvimento, incluir mais detalhes
      if (process.env.NODE_ENV === "development") {
        response.debug = {
          originalError: dbError?.originalError?.message,
          originalErrorFull: dbError?.originalError,
          stack: dbError?.stack,
          fullError: dbError,
        };
      } else {
        // Em produção, incluir informações úteis mas não sensíveis
        response.debug = {
          originalErrorName: dbError?.originalError?.name || dbError?.name,
          originalErrorCode: dbError?.originalError?.code || dbError?.code,
          originalErrorCodeName: dbError?.originalError?.codeName || dbError?.codeName,
        };
      }

      return NextResponse.json(response, { status: 500 });
    }

    // Verificar se os modelos estão disponíveis
    if (!UserModel || !CompanyModel) {
      return NextResponse.json(
        {
          error: "MODEL_ERROR",
          message: "Erro interno do servidor. Entre em contato com o suporte.",
        },
        { status: 500 }
      );
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuário e empresa em paralelo
    let user, company;
    try {
      [user, company] = await Promise.all([
        UserModel.findOne({ email: normalizedEmail }),
        CompanyModel.findOne({ email: normalizedEmail }),
      ]);
    } catch (findError: any) {
      // Verificar se é um erro de conexão
      const isConnectionError = 
        findError?.message?.includes("connection") ||
        findError?.message?.includes("timeout") ||
        findError?.message?.includes("Mongo") ||
        findError?.name?.includes("Mongo");
      
      return NextResponse.json(
        {
          error: isConnectionError ? "DATABASE_CONNECTION_ERROR" : "DATABASE_QUERY_ERROR",
          message: isConnectionError 
            ? "Erro de conexão com o banco de dados. Tente novamente mais tarde."
            : "Erro ao buscar dados. Tente novamente mais tarde.",
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              errorName: findError?.name,
              errorMessage: findError?.message,
            },
          }),
        },
        { status: 500 }
      );
    }

    // Se encontrou usuário
    if (user) {
      // Verificar se a conta está ativa
      if (!user.isActive) {
        return NextResponse.json(
          {
            error: "ACCOUNT_INACTIVE",
            message: "Sua conta está inativa. Entre em contato com o suporte para mais informações.",
          },
          { status: 403 }
        );
      }

      // Verificar status da conta
      if (user.status === "suspended") {
        return NextResponse.json(
          {
            error: "ACCOUNT_SUSPENDED",
            message: "Sua conta foi suspensa. Entre em contato com o suporte para mais informações.",
          },
          { status: 403 }
        );
      }

      if (user.status === "pending") {
        return NextResponse.json(
          {
            error: "ACCOUNT_PENDING",
            message: "Sua conta está pendente de aprovação. Aguarde a ativação ou entre em contato com o suporte.",
          },
          { status: 403 }
        );
      }

      // Verificar se o usuário tem senha
      if (!user.password) {
        return NextResponse.json(
          {
            error: "AUTH_ERROR",
            message: "Erro interno ao verificar senha. Tente novamente mais tarde.",
          },
          { status: 500 }
        );
      }

      // Verificar senha
      let isPasswordValid;
      try {
        if (typeof user.comparePassword !== "function") {
          return NextResponse.json(
            {
              error: "AUTH_ERROR",
              message: "Erro interno ao verificar senha. Tente novamente mais tarde.",
            },
            { status: 500 }
          );
        }
        isPasswordValid = await user.comparePassword(password);
      } catch (passwordError: any) {
        return NextResponse.json(
          {
            error: "AUTH_ERROR",
            message: "Erro ao verificar senha. Tente novamente mais tarde.",
          },
          { status: 500 }
        );
      }

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            error: "INVALID_PASSWORD",
            message: "Senha incorreta. Tente novamente ou recupere sua senha.",
          },
          { status: 401 }
        );
      }

      // Login válido - retornar sucesso (o NextAuth fará a autenticação real)
      return NextResponse.json(
        {
          success: true,
          message: "Credenciais válidas. Redirecionando...",
        },
        { status: 200 }
      );
    }

    // Se encontrou empresa
    if (company) {
      // Verificar se a conta está ativa
      if (!company.isActive) {
        return NextResponse.json(
          {
            error: "ACCOUNT_INACTIVE",
            message: "Sua conta está inativa. Entre em contato com o suporte para mais informações.",
          },
          { status: 403 }
        );
      }

      // Verificar se a empresa tem senha
      if (!company.password) {
        return NextResponse.json(
          {
            error: "AUTH_ERROR",
            message: "Erro interno ao verificar senha. Tente novamente mais tarde.",
          },
          { status: 500 }
        );
      }

      // Verificar senha
      let isPasswordValid;
      try {
        if (typeof company.comparePassword !== "function") {
          return NextResponse.json(
            {
              error: "AUTH_ERROR",
              message: "Erro interno ao verificar senha. Tente novamente mais tarde.",
            },
            { status: 500 }
          );
        }
        isPasswordValid = await company.comparePassword(password);
      } catch (passwordError: any) {
        return NextResponse.json(
          {
            error: "AUTH_ERROR",
            message: "Erro ao verificar senha. Tente novamente mais tarde.",
          },
          { status: 500 }
        );
      }

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            error: "INVALID_PASSWORD",
            message: "Senha incorreta. Tente novamente ou recupere sua senha.",
          },
          { status: 401 }
        );
      }

      // Login válido - retornar sucesso (o NextAuth fará a autenticação real)
      return NextResponse.json(
        {
          success: true,
          message: "Credenciais válidas. Redirecionando...",
        },
        { status: 200 }
      );
    }

    // Email não encontrado
    return NextResponse.json(
      {
        error: "EMAIL_NOT_FOUND",
        message: "Email não encontrado. Verifique se o email está correto ou crie uma conta.",
      },
      { status: 404 }
    );
  } catch (error: any) {
    // Verificar se é um erro de conexão com o banco de dados
    if (
      error instanceof Error &&
      (error.message.includes("MongoServerError") ||
        error.message.includes("Mongoose") ||
        error.message.includes("connection") ||
        error.message.includes("timeout") ||
        error.message.includes("MongoNetworkError"))
    ) {
      return NextResponse.json(
        {
          error: "DATABASE_CONNECTION_ERROR",
          message: "Erro de conexão com o servidor. Tente novamente mais tarde.",
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              errorName: error?.name,
              errorMessage: error?.message,
            },
          }),
        },
        { status: 500 }
      );
    }

    // Verificar se é um erro de modelo não encontrado
    if (
      error instanceof Error &&
      (error.message.includes("Model") || error.message.includes("is not a function"))
    ) {
      return NextResponse.json(
        {
          error: "MODEL_ERROR",
          message: "Erro interno do servidor. Entre em contato com o suporte.",
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              errorName: error?.name,
              errorMessage: error?.message,
            },
          }),
        },
        { status: 500 }
      );
    }

    // Verificar se é um erro com detalhes estruturados (de connectDB)
    if (error instanceof Error && (error as any).details) {
      const errorDetails = (error as any).details;
      const errorType = errorDetails.type || "UNKNOWN_ERROR";
      
      return NextResponse.json(
        {
          error: "DATABASE_CONNECTION_ERROR",
          message: errorDetails.message || "Erro de conexão com o banco de dados. Tente novamente mais tarde.",
          type: errorType,
          ...(errorDetails.suggestion && { suggestion: errorDetails.suggestion }),
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              errorName: error?.name,
              errorMessage: error?.message,
              errorDetails: errorDetails,
            },
          }),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "AUTH_ERROR",
        message: error?.message || "Erro ao processar login. Tente novamente mais tarde.",
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            errorName: error?.name,
            errorMessage: error?.message,
            stack: error?.stack,
          },
        }),
      },
      { status: 500 }
    );
  }
}

