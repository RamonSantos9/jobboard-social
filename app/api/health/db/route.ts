import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    // Verificar se MONGODB_URI está configurada
    const hasMongoUri = !!process.env.MONGODB_URI;
    let uriPreview = "Não configurada";
    let uriFormat = "unknown";
    let uriValidation = { valid: false, error: null as string | null };

    if (hasMongoUri && process.env.MONGODB_URI) {
      const uri = process.env.MONGODB_URI;
      
      // Determinar formato da URI
      if (uri.startsWith("mongodb+srv://")) {
        uriFormat = "atlas";
      } else if (uri.startsWith("mongodb://")) {
        uriFormat = "standard";
      }

      // Criar preview da URI (sem expor credenciais)
      try {
        if (uri.includes("@")) {
          const parts = uri.split("@");
          if (parts.length > 1) {
            const hostPart = parts[1].split("/")[0];
            uriPreview = `mongodb${uri.includes("+srv") ? "+srv" : ""}://***@${hostPart}`;
          }
        } else {
          uriPreview = uri.substring(0, 30) + "...";
        }
      } catch (error) {
        uriPreview = "URI presente (formato inválido)";
      }

      // Validar formato da URI
      if (uri.trim().length === 0) {
        uriValidation = { valid: false, error: "URI está vazia" };
      } else if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
        uriValidation = { valid: false, error: "URI deve começar com 'mongodb://' ou 'mongodb+srv://'" };
      } else if (!uri.includes("@")) {
        uriValidation = { valid: false, error: "URI deve conter credenciais (usuário:senha@host)" };
      } else {
        try {
          const urlParts = uri.split("@");
          if (urlParts.length < 2) {
            uriValidation = { valid: false, error: "URI mal formatada" };
          } else {
            const hostPart = urlParts[1].split("/")[0];
            if (!hostPart || hostPart.trim().length === 0) {
              uriValidation = { valid: false, error: "URI deve conter um hostname válido" };
            } else {
              uriValidation = { valid: true, error: null };
            }
          }
        } catch (error) {
          uriValidation = { valid: false, error: "URI mal formatada" };
        }
      }
    }

    // Tentar conectar ao banco de dados
    let connectionStatus = "unknown";
    let connectionError: any = null;
    let connectionDetails: any = null;
    let connectionTiming = { start: Date.now(), end: null as number | null, duration: null as number | null };

    try {
      connectionTiming.start = Date.now();
      await connectDB();
      connectionTiming.end = Date.now();
      connectionTiming.duration = connectionTiming.end - connectionTiming.start;
      
      // Verificar se realmente está conectado (readyState 1 = connected)
      const readyState = mongoose.connection.readyState;
      if (readyState === 1) {
        connectionStatus = "connected";
      } else {
        // Se não está conectado, tratar como erro
        connectionStatus = "error";
        connectionError = {
          type: "CONNECTION_INCOMPLETE",
          message: `Conexão não completada. Estado atual: ${getReadyStateText(readyState)}`,
          readyState: readyState,
          readyStateText: getReadyStateText(readyState),
          suggestion: readyState === 2 
            ? "A conexão está tentando conectar mas não completou. Isso geralmente indica que o IP não está na whitelist do MongoDB Atlas. Acesse /api/health/vercel-ip para obter o IP atual e adicione-o no MongoDB Atlas Network Access."
            : "A conexão não está ativa. Verifique a configuração do MongoDB.",
        };
      }
      
      connectionDetails = {
        readyState: readyState,
        readyStateText: getReadyStateText(readyState),
        host: mongoose.connection.host || null,
        name: mongoose.connection.name || null,
        port: mongoose.connection.port || null,
        connectionTiming: connectionTiming.duration,
        isConnected: readyState === 1,
      };
    } catch (error: any) {
      connectionTiming.end = Date.now();
      connectionTiming.duration = connectionTiming.end - connectionTiming.start;
      
      connectionStatus = "error";
      
      // Incluir o erro ORIGINAL completo para diagnóstico real
      const originalError = error?.originalError || error;
      connectionError = {
        type: error?.details?.type || "UNKNOWN_ERROR",
        message: error?.details?.message || error?.message || "Erro desconhecido",
        code: error?.details?.code || error?.code,
        codeName: error?.details?.codeName || error?.codeName,
        suggestion: error?.details?.suggestion || null,
        connectionTiming: connectionTiming.duration,
        // ERRO ORIGINAL REAL (sem classificação) - importante para diagnóstico
        originalError: {
          name: originalError?.name,
          message: originalError?.message,
          code: originalError?.code,
          codeName: originalError?.codeName,
          ...(originalError?.reason && { reason: originalError.reason }),
          ...(originalError?.cause && { cause: originalError.cause }),
        },
      };
    }

    // Informações do ambiente
    const environmentInfo = {
      node_env: process.env.NODE_ENV || "unknown",
      vercel: !!process.env.VERCEL,
      vercel_env: process.env.VERCEL_ENV || null,
      vercel_url: process.env.VERCEL_URL || null,
      nextauth_url: process.env.NEXTAUTH_URL ? "configurada" : "não configurada",
    };

    // Determinar status HTTP baseado no estado real da conexão
    const httpStatus = connectionStatus === "connected" ? 200 : 500;
    const responseStatus = connectionStatus === "connected" ? "ok" : "error";
    
    return NextResponse.json(
      {
        success: connectionStatus === "connected",
        status: responseStatus,
        message: connectionStatus === "connected" 
          ? "Conexão bem-sucedida" 
          : connectionError?.message || "Erro na conexão",
        timestamp: new Date().toISOString(),
        database: {
          uri_configured: hasMongoUri,
          uri_format: uriFormat,
          uri_preview: uriPreview,
          uri_validation: uriValidation,
          connection_status: connectionStatus,
          connection_details: connectionDetails,
          error: connectionError,
        },
        environment: environmentInfo,
        recommendations: connectionStatus === "error" ? getRecommendations(connectionError) : null,
        ...(connectionStatus === "error" && connectionError?.type === "CONNECTION_INCOMPLETE" && {
          quickFix: {
            message: "A conexão não completou. O IP atual pode não estar na whitelist.",
            steps: [
              "1. Acesse /api/health/vercel-ip para obter o IP atual da Vercel",
              "2. Adicione esse IP no MongoDB Atlas Network Access",
              "3. Aguarde 2-5 minutos para propagação",
              "4. Verifique novamente este endpoint",
            ],
            currentIpEndpoint: "/api/health/vercel-ip",
          },
        }),
      },
      { 
        status: httpStatus,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: {
          type: "FATAL_ERROR",
          message: error?.message || "Erro desconhecido ao verificar saúde do banco de dados",
          name: error?.name,
        },
      },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

/**
 * Retorna texto descritivo para o estado da conexão
 */
function getReadyStateText(readyState: number): string {
  switch (readyState) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
}

/**
 * Retorna recomendações baseadas no tipo de erro
 */
function getRecommendations(error: any): string[] {
  if (!error || !error.type) {
    return ["Verifique os logs do servidor para mais detalhes"];
  }

  const recommendations: string[] = [];

  switch (error.type) {
    case "MISSING_URI":
      recommendations.push("Configure a variável de ambiente MONGODB_URI na Vercel");
      recommendations.push("Vá em Settings → Environment Variables → Adicione MONGODB_URI");
      break;
    case "INVALID_URI":
      recommendations.push("Verifique se a URI está no formato correto: mongodb+srv://usuario:senha@cluster.mongodb.net/banco");
      recommendations.push("Certifique-se de que caracteres especiais na senha estão codificados (ex: @ vira %40)");
      break;
    case "HOST_NOT_FOUND":
      recommendations.push("Verifique se a URI do MongoDB está correta");
      recommendations.push("Para MongoDB Atlas, verifique se o cluster está ativo");
      break;
    case "AUTH_FAILED":
      recommendations.push("Verifique se o usuário e senha estão corretos");
      recommendations.push("Certifique-se de que caracteres especiais na senha estão codificados");
      break;
    case "TIMEOUT":
    case "SERVER_SELECTION_TIMEOUT":
      recommendations.push("Verifique os logs do servidor para ver o erro real");
      recommendations.push("Timeout pode ser causado por: latência de rede, problemas temporários, ou configuração incorreta");
      recommendations.push("Para Vercel: Verifique os logs em Vercel Dashboard → Deployments → Functions → Logs");
      break;
    case "IP_NOT_AUTHORIZED":
      recommendations.push("Verifique os logs do servidor para confirmar se é realmente erro de IP");
      recommendations.push("Para Vercel: Os IPs mudam a cada deploy. Considere usar MongoDB Atlas Private Endpoint ou verificar os logs para ver o IP real");
      recommendations.push("Acesse Vercel Dashboard → Deployments → Functions → Logs para ver o erro original");
      break;
    case "CONNECTION_REFUSED":
      recommendations.push("Verifique se o servidor MongoDB está ativo");
      recommendations.push("Para MongoDB Atlas, verifique se o cluster está rodando");
      break;
    case "SSL_ERROR":
      recommendations.push("Certifique-se de que a URI usa 'mongodb+srv://' para conexões Atlas");
      recommendations.push("Verifique se o MongoDB Atlas está configurado para conexões SSL");
      break;
    default:
      recommendations.push("Verifique os logs do servidor para mais detalhes");
      recommendations.push("Certifique-se de que todas as variáveis de ambiente estão configuradas corretamente");
  }

  return recommendations;
}

