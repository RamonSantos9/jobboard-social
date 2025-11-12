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
      // Extrair detalhes do erro
      const errorDetails = dbError?.details || {};
      const errorType = errorDetails.type || "UNKNOWN_ERROR";
      const errorMessage = errorDetails.message || dbError?.message || "Erro de conexão com o servidor. Tente novamente mais tarde.";
      const errorSuggestion = errorDetails.suggestion || null;

      console.error("[Login API] ❌ Erro ao conectar com banco de dados:", {
        type: errorType,
        message: errorMessage,
        code: errorDetails.code || dbError?.code,
        codeName: errorDetails.codeName || dbError?.codeName,
        suggestion: errorSuggestion,
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
          "1. Acesse https://cloud.mongodb.com/ e faça login na sua conta",
          "2. Selecione seu projeto (se houver múltiplos projetos)",
          "3. No menu lateral esquerdo, clique em 'Network Access'",
          "4. Verifique se já existe algum IP configurado",
          "5. Se NÃO existir '0.0.0.0/0', clique em 'Add IP Address'",
          "6. Na modal que abrir, clique no botão 'ALLOW ACCESS FROM ANYWHERE' (isso adiciona automaticamente 0.0.0.0/0)",
          "7. OU digite manualmente no campo: 0.0.0.0/0",
          "8. Adicione um comentário opcional: 'Vercel - All IPs'",
          "9. Clique em 'Confirm'",
          "10. AGUARDE 3-5 MINUTOS para a propagação das mudanças",
          "11. Verifique se o IP aparece na lista com status 'Active'",
          "12. Teste novamente a conexão",
        ];
        response.importantNote = "⚠️ IMPORTANTE: A Vercel usa IPs dinâmicos que mudam a cada deploy. Portanto, você DEVE usar 0.0.0.0/0 (permitir todos os IPs). Não é possível usar IPs específicos com a Vercel. Se você já adicionou 0.0.0.0/0, aguarde alguns minutos e verifique se o status está 'Active' no MongoDB Atlas.";
        response.troubleshooting = [
          "Se já adicionou 0.0.0.0/0 mas ainda dá erro:",
          "- Verifique se o status está 'Active' (não 'Pending')",
          "- Aguarde mais alguns minutos (pode levar até 10 minutos)",
          "- Verifique se não há outras regras de firewall bloqueando",
          "- Verifique se o cluster está ativo e rodando",
          "- Tente remover e adicionar novamente o IP 0.0.0.0/0",
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
      };

      // Em desenvolvimento, incluir mais detalhes
      if (process.env.NODE_ENV === "development") {
        response.debug = {
          originalError: dbError?.originalError?.message,
          stack: dbError?.stack,
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

