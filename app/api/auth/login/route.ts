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

    console.log("Iniciando conexão com banco de dados...");
    // Verificar se a variável de ambiente está definida
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI não está definida nas variáveis de ambiente");
      return NextResponse.json(
        {
          error: "DATABASE_CONFIG_ERROR",
          message: "Erro de configuração do servidor. Entre em contato com o suporte.",
        },
        { status: 500 }
      );
    }

    try {
      await connectDB();
      console.log("Conexão com banco de dados estabelecida");
    } catch (dbError: any) {
      console.error("Erro ao conectar com banco de dados:", {
        message: dbError?.message,
        name: dbError?.name,
        code: dbError?.code,
        stack: dbError?.stack,
      });

      // Verificar o tipo específico de erro
      let errorMessage = "Erro de conexão com o servidor. Tente novamente mais tarde.";
      let errorCode = "DATABASE_CONNECTION_ERROR";

      if (dbError?.message?.includes("ENOTFOUND") || dbError?.code === "ENOTFOUND") {
        errorMessage = "Não foi possível encontrar o servidor de banco de dados. Verifique a configuração.";
        errorCode = "DATABASE_HOST_ERROR";
      } else if (dbError?.message?.includes("authentication failed") || dbError?.code === 18) {
        errorMessage = "Falha na autenticação do banco de dados. Verifique as credenciais.";
        errorCode = "DATABASE_AUTH_ERROR";
      } else if (dbError?.message?.includes("timeout") || dbError?.code === "ETIMEDOUT") {
        errorMessage = "Tempo de conexão com o banco de dados expirou. Tente novamente.";
        errorCode = "DATABASE_TIMEOUT_ERROR";
      } else if (dbError?.message?.includes("ECONNREFUSED") || dbError?.code === "ECONNREFUSED") {
        errorMessage = "Conexão com o banco de dados foi recusada. Verifique se o servidor está ativo.";
        errorCode = "DATABASE_REFUSED_ERROR";
      }

      return NextResponse.json(
        {
          error: errorCode,
          message: errorMessage,
        },
        { status: 500 }
      );
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

