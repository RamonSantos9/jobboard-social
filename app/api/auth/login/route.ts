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

    // Validar tipos
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Email e senha devem ser strings." },
        { status: 400 }
      );
    }

    await connectDB();

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
        findError?.name?.includes("Mongo") ||
        findError?.codeName?.includes("Mongo") ||
        findError?.codeName === "MongooseServerSelectionError" ||
        findError?.codeName === "MongoServerSelectionError";
      
      return NextResponse.json(
        {
          error: isConnectionError ? "DATABASE_CONNECTION_ERROR" : "DATABASE_QUERY_ERROR",
          message: isConnectionError 
            ? "Erro de conexão com o banco de dados. Tente novamente mais tarde."
            : "Erro ao buscar dados. Tente novamente mais tarde.",
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
        if (!user || typeof user.comparePassword !== "function") {
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
        if (!company || typeof company.comparePassword !== "function") {
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

    // Verificar se é um erro com detalhes estruturados (de connectDB)
    if (error instanceof Error && (error as any).details) {
      const errorDetails = (error as any).details;
      const errorType = errorDetails.type || "UNKNOWN_ERROR";
      
      // Mapear código de erro baseado no tipo
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
      }
      
      return NextResponse.json(
        {
          error: errorCode,
          message: errorDetails.message || "Erro de conexão com o banco de dados. Tente novamente mais tarde.",
          type: errorType,
        },
        { status: 500 }
      );
    }

    // Erro genérico
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === "string" 
        ? error 
        : "Erro ao processar login. Tente novamente mais tarde.";

    return NextResponse.json(
      {
        error: "AUTH_ERROR",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

