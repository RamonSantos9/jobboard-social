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
      console.error("Erro ao fazer parse do body:", parseError);
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

    console.log("[Login API] Iniciando conexão com banco de dados...");
    
    try {
      await connectDB();
      console.log("[Login API] ✅ Conexão com banco de dados estabelecida com sucesso");
    } catch (dbError: any) {
      // Log do erro ORIGINAL completo antes de processar (crítico para diagnóstico)
      console.error("[Login API] ❌ Erro original capturado:", {
        message: dbError?.message,
        name: dbError?.name,
        code: dbError?.code,
        codeName: dbError?.codeName,
        stack: dbError?.stack, // Stack completo para diagnóstico
        // Incluir erro original se disponível
        originalError: dbError?.originalError ? {
          message: dbError.originalError?.message,
          name: dbError.originalError?.name,
          code: dbError.originalError?.code,
          codeName: dbError.originalError?.codeName,
        } : null,
        // Informações adicionais do MongoDB se disponíveis
        ...(dbError?.originalError?.reason && { reason: dbError.originalError.reason }),
        ...(dbError?.originalError?.cause && { cause: dbError.originalError.cause }),
      });
      
      // Extrair detalhes do erro
      const errorDetails = dbError?.details || {};
      const errorType = errorDetails.type || "UNKNOWN_ERROR";
      const errorMessage = errorDetails.message || dbError?.message || "Erro de conexão com o servidor. Tente novamente mais tarde.";
      const errorSuggestion = errorDetails.suggestion || null;

      console.error("[Login API] ❌ Erro analisado:", {
        type: errorType,
        message: errorMessage,
        code: errorDetails.code || dbError?.code,
        codeName: errorDetails.codeName || dbError?.codeName,
        suggestion: errorSuggestion,
        originalMessage: dbError?.originalError?.message || dbError?.message,
        originalName: dbError?.originalError?.name || dbError?.name,
        originalCode: dbError?.originalError?.code || dbError?.code,
        originalCodeName: dbError?.originalError?.codeName || dbError?.codeName,
      });

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
          "1. Acesse Vercel Dashboard → Deployments → Functions → Logs",
          "2. Procure pelo erro original do MongoDB (sem classificação)",
          "3. OU acesse /api/health/db-raw para ver o erro real",
          "4. Identifique o IP real usado pela Vercel nos logs",
          "5. Acesse MongoDB Atlas → Network Access",
          "6. Adicione o IP específico encontrado nos logs",
          "7. OU considere usar MongoDB Atlas Private Endpoint para maior segurança",
        ];
        response.importantNote = "⚠️ IMPORTANTE: O erro pode não ser realmente de IP não autorizado. Verifique os logs do servidor para ver o erro REAL. Acesse /api/health/db-raw para ver o erro original sem classificação.";
        response.troubleshooting = [
          "Para diagnosticar o problema real:",
          "- Acesse /api/health/db-raw para ver o erro original completo",
          "- Verifique os logs em Vercel Dashboard → Deployments → Functions → Logs",
          "- Procure por '[MongoDB Error Analysis] Erro original completo' nos logs",
          "- O erro real pode ser diferente de IP não autorizado",
          "- Considere usar MongoDB Atlas Private Endpoint se precisar de maior segurança",
        ];
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
      console.error("Modelos não estão disponíveis:", { UserModel: !!UserModel, CompanyModel: !!CompanyModel });
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
    console.log("Buscando usuário e empresa para email:", normalizedEmail);

    // Buscar usuário e empresa em paralelo
    let user, company;
    try {
      [user, company] = await Promise.all([
        UserModel.findOne({ email: normalizedEmail }),
        CompanyModel.findOne({ email: normalizedEmail }),
      ]);
      console.log("Busca concluída - User encontrado:", !!user, "Company encontrada:", !!company);
    } catch (findError: any) {
      console.error("Erro ao buscar usuário/empresa:", {
        message: findError?.message,
        stack: findError?.stack,
        name: findError?.name,
      });
      return NextResponse.json(
        {
          error: "DATABASE_QUERY_ERROR",
          message: "Erro ao buscar dados. Tente novamente mais tarde.",
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
        console.error("Usuário não tem senha definida");
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
          console.error("comparePassword não é uma função no modelo User");
          return NextResponse.json(
            {
              error: "AUTH_ERROR",
              message: "Erro interno ao verificar senha. Tente novamente mais tarde.",
            },
            { status: 500 }
          );
        }
        isPasswordValid = await user.comparePassword(password);
        console.log("Validação de senha concluída para usuário:", isPasswordValid);
      } catch (passwordError: any) {
        console.error("Erro ao verificar senha do usuário:", {
          message: passwordError?.message,
          stack: passwordError?.stack,
          name: passwordError?.name,
        });
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
        console.error("Empresa não tem senha definida");
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
          console.error("comparePassword não é uma função no modelo Company");
          return NextResponse.json(
            {
              error: "AUTH_ERROR",
              message: "Erro interno ao verificar senha. Tente novamente mais tarde.",
            },
            { status: 500 }
          );
        }
        isPasswordValid = await company.comparePassword(password);
        console.log("Validação de senha concluída para empresa:", isPasswordValid);
      } catch (passwordError: any) {
        console.error("Erro ao verificar senha da empresa:", {
          message: passwordError?.message,
          stack: passwordError?.stack,
          name: passwordError?.name,
        });
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
    console.error("Login API error - Detalhes completos:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      error: error,
    });
    
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
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "AUTH_ERROR",
        message: error?.message || "Erro ao processar login. Tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}

