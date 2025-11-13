import mongoose from "mongoose";

// Obter a URI do MongoDB das variáveis de ambiente
const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

type ErrorDetails = {
  type: string;
  code?: string | number;
  codeName?: string;
  message: string;
  suggestion?: string;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

// Cache da conexão para ambientes serverless
let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Valida o formato da URI do MongoDB
 */
function validateMongoUri(uri: string): { valid: boolean; error?: string } {
  if (!uri || typeof uri !== "string" || uri.trim().length === 0) {
    return {
      valid: false,
      error: "URI do MongoDB está vazia ou inválida",
    };
  }

  // Verificar se começa com mongodb:// ou mongodb+srv://
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    return {
      valid: false,
      error: "URI do MongoDB deve começar com 'mongodb://' ou 'mongodb+srv://'",
    };
  }

  // Verificar se contém @ (credenciais)
  if (!uri.includes("@")) {
    return {
      valid: false,
      error: "URI do MongoDB deve conter credenciais (usuário:senha@host)",
    };
  }

  // Verificar se contém hostname
  try {
    const urlParts = uri.split("@");
    if (urlParts.length < 2) {
      return {
        valid: false,
        error: "URI do MongoDB está mal formatada",
      };
    }
    const hostPart = urlParts[1].split("/")[0];
    if (!hostPart || hostPart.trim().length === 0) {
      return {
        valid: false,
        error: "URI do MongoDB deve conter um hostname válido",
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: "URI do MongoDB está mal formatada",
    };
  }

  return { valid: true };
}

/**
 * Analisa o erro e retorna detalhes estruturados
 */
function analyzeError(error: any): ErrorDetails {
  const errorMessage = error?.message || "Erro desconhecido";
  const errorCode = error?.code;
  const errorCodeName = error?.codeName;
  const errorName = error?.name;
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL;

  // Detectar erros de DNS/Hostname (prioridade alta)
  if (
    errorCode === "ENOTFOUND" ||
    errorMessage.includes("ENOTFOUND") ||
    errorMessage.includes("getaddrinfo") ||
    errorMessage.includes("ENOTFOUND")
  ) {
    return {
      type: "HOST_NOT_FOUND",
      code: errorCode,
      codeName: errorCodeName,
      message: "Não foi possível resolver o hostname do MongoDB",
      suggestion:
        "Verifique se a URI do MongoDB está correta e se o hostname existe. Para MongoDB Atlas, verifique se o cluster está ativo e se a URI usa o formato mongodb+srv://.",
    };
  }

  // Detectar erros de autenticação (prioridade alta - aparece antes de timeout)
  if (
    errorCode === 18 ||
    errorCode === "EAUTH" ||
    errorMessage.toLowerCase().includes("authentication failed") ||
    errorMessage.toLowerCase().includes("bad auth") ||
    errorMessage.toLowerCase().includes("auth failed") ||
    errorMessage.toLowerCase().includes("invalid credentials") ||
    (errorCodeName === "MongoServerError" &&
      errorMessage.includes("authentication"))
  ) {
    return {
      type: "AUTH_FAILED",
      code: errorCode,
      codeName: errorCodeName,
      message: "Falha na autenticação do MongoDB",
      suggestion:
        "Verifique se o usuário e senha estão corretos. Certifique-se de que caracteres especiais na senha estão codificados (ex: @ vira %40). Verifique também se o usuário tem as permissões adequadas no MongoDB Atlas.",
    };
  }

  // Detectar erros específicos do MongoDB Atlas
  const isAtlas =
    MONGODB_URI?.includes("mongodb+srv://") || MONGODB_URI?.includes("atlas");

  // Detectar erro específico: MongooseServerSelectionError com mensagem sobre IP whitelist
  const isServerSelectionError =
    errorName === "MongooseServerSelectionError" ||
    errorCodeName === "MongooseServerSelectionError" ||
    errorCodeName === "MongoServerSelectionError" ||
    errorName === "MongoServerSelectionError";

  // Verificar se a mensagem menciona explicitamente IP whitelist
  const mentionsIPWhitelist =
    errorMessage.toLowerCase().includes("ip that isn't whitelisted") ||
    errorMessage.toLowerCase().includes("ip address is not whitelisted") ||
    errorMessage.toLowerCase().includes("ip whitelist") ||
    errorMessage.toLowerCase().includes("atlas cluster's ip whitelist");

  // Verificar se é ReplicaSetNoPrimary (indica que não conseguiu conectar a nenhum servidor)
  const isReplicaSetNoPrimary =
    error?.reason?.type === "ReplicaSetNoPrimary" ||
    error?.cause?.type === "ReplicaSetNoPrimary";

  // Se for ServerSelectionError E mencionar IP whitelist OU for ReplicaSetNoPrimary com servidores Unknown
  if (
    isServerSelectionError &&
    (mentionsIPWhitelist || (isReplicaSetNoPrimary && isAtlas))
  ) {
    // Verificar se todos os servidores estão como "Unknown" (indica que não conseguiu fazer handshake)
    const servers = error?.reason?.servers || error?.cause?.servers || {};
    const allServersUnknown = Object.values(servers).every(
      (server: any) =>
        server?.type === "Unknown" && server?.roundTripTime === -1
    );

    if (allServersUnknown || mentionsIPWhitelist) {
      return {
        type: "IP_NOT_AUTHORIZED",
        code: errorCode,
        codeName: errorCodeName,
        message:
          "IP não autorizado - não foi possível conectar a nenhum servidor do MongoDB Atlas",
        suggestion:
          "O erro confirma que o IP da Vercel não está na whitelist. SOLUÇÕES: 1) Acesse /api/health/vercel-ip para obter o IP atual da Vercel, 2) Adicione esse IP no MongoDB Atlas Network Access, 3) OU use MongoDB Atlas Private Endpoint (recomendado para produção - mais seguro e não precisa liberar IPs).",
      };
    }
  }

  // Detectar erros de timeout
  const isTimeoutError =
    errorCode === "ETIMEDOUT" ||
    errorCode === "ESOCKETTIMEDOUT" ||
    errorMessage.includes("timeout") ||
    errorCodeName === "ServerSelectionTimeoutError";

  if (isTimeoutError) {
    // Não assumir automaticamente que timeout = IP não autorizado
    // Timeout pode ser causado por vários fatores: latência de rede, problemas temporários, etc.
    // Só classificar como IP_NOT_AUTHORIZED se houver indicações explícitas
    const hasExplicitIPError =
      errorMessage.toLowerCase().includes("not authorized") ||
      errorMessage.toLowerCase().includes("ip address") ||
      errorMessage.toLowerCase().includes("whitelist") ||
      errorMessage.toLowerCase().includes("access denied") ||
      errorMessage.toLowerCase().includes("network access");

    // Se houver indicações explícitas de problema de IP E estiver em produção com Atlas
    if (hasExplicitIPError && isProduction && isAtlas) {
      return {
        type: "IP_NOT_AUTHORIZED",
        code: errorCode,
        codeName: errorCodeName,
        message: "IP não autorizado para acessar o MongoDB",
        suggestion:
          "O erro indica que o IP não está autorizado. Para Vercel: 1) Verifique os logs em Vercel Dashboard para ver o IP real usado, 2) Adicione esse IP específico no MongoDB Atlas Network Access, 3) OU considere usar MongoDB Atlas Private Endpoint para maior segurança. Acesse /api/health/db-raw para ver o erro original completo.",
      };
    }

    // Caso contrário, classificar como timeout genérico
    return {
      type: "TIMEOUT",
      code: errorCode,
      codeName: errorCodeName,
      message: "Timeout ao conectar ao MongoDB",
      suggestion:
        "Timeout pode ter várias causas. Verifique: 1) Se o cluster está ativo e acessível, 2) Se há problemas de rede ou firewall, 3) Se a URI está correta, 4) Verifique os logs do servidor para ver o erro original. Acesse /api/health/db-raw para ver o erro real sem classificação.",
    };
  }

  // Detectar erros de conexão recusada
  if (
    errorCode === "ECONNREFUSED" ||
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("connection refused")
  ) {
    // NÃO assumir que ECONNREFUSED = IP não autorizado
    // Só classificar como IP_NOT_AUTHORIZED se houver indicações explícitas na mensagem
    const hasExplicitIPError =
      errorMessage.toLowerCase().includes("not authorized") ||
      errorMessage.toLowerCase().includes("ip address") ||
      errorMessage.toLowerCase().includes("whitelist") ||
      errorMessage.toLowerCase().includes("access denied") ||
      errorMessage.toLowerCase().includes("network access") ||
      errorMessage.toLowerCase().includes("ip whitelist");

    // Se houver indicações explícitas de problema de IP E estiver em produção com Atlas
    if (
      hasExplicitIPError &&
      isProduction &&
      MONGODB_URI?.includes("mongodb+srv://")
    ) {
      return {
        type: "IP_NOT_AUTHORIZED",
        code: errorCode,
        codeName: errorCodeName,
        message: "Conexão recusada - IP não autorizado para acessar o MongoDB",
        suggestion:
          "Conexão recusada pode indicar IP não autorizado. Verifique os logs do servidor para ver o IP real usado. Para Vercel: Verifique os logs em Vercel Dashboard → Deployments → Functions → Logs. Acesse /api/health/db-raw para ver o erro original completo.",
      };
    }

    // Caso contrário, classificar como conexão recusada genérica
    return {
      type: "CONNECTION_REFUSED",
      code: errorCode,
      codeName: errorCodeName,
      message: "Conexão recusada pelo servidor MongoDB",
      suggestion:
        "Verifique: 1) Se o servidor MongoDB está ativo, 2) Se a porta está correta, 3) Se não há problemas de firewall, 4) Para MongoDB Atlas, verifique se o IP está na whitelist (Network Access) e se o cluster está rodando.",
    };
  }

  // Detectar erros de SSL/TLS
  if (
    errorMessage.includes("SSL") ||
    errorMessage.includes("TLS") ||
    errorMessage.includes("certificate") ||
    errorMessage.includes("certificate")
  ) {
    return {
      type: "SSL_ERROR",
      code: errorCode,
      codeName: errorCodeName,
      message: "Erro de SSL/TLS ao conectar ao MongoDB",
      suggestion:
        "Verifique se o MongoDB Atlas está configurado corretamente para conexões SSL. Certifique-se de que a URI usa 'mongodb+srv://' para conexões Atlas.",
    };
  }

  // Detectar erros explícitos de IP não autorizado ou whitelist
  // Tornar a detecção mais precisa - verificar se realmente indica problema de IP/whitelist
  const lowerMessage = errorMessage.toLowerCase();
  const hasExplicitIPWhitelistError =
    // Verificações mais específicas para erros de IP/whitelist
    lowerMessage.includes("not authorized to access") ||
    lowerMessage.includes("ip address is not whitelisted") ||
    lowerMessage.includes("ip whitelist") ||
    (lowerMessage.includes("network access") &&
      (lowerMessage.includes("denied") ||
        lowerMessage.includes("not allowed"))) ||
    (lowerMessage.includes("access denied") &&
      (lowerMessage.includes("ip") || lowerMessage.includes("network"))) ||
    // Verificar se é um MongoNetworkError com mensagem específica sobre IP/access
    (errorCodeName === "MongoNetworkError" &&
      ((lowerMessage.includes("ip") &&
        (lowerMessage.includes("denied") ||
          lowerMessage.includes("not authorized") ||
          lowerMessage.includes("whitelist"))) ||
        (lowerMessage.includes("network access") &&
          lowerMessage.includes("denied"))));

  if (hasExplicitIPWhitelistError) {
    return {
      type: "IP_NOT_AUTHORIZED",
      code: errorCode,
      codeName: errorCodeName,
      message: "IP não autorizado para acessar o MongoDB",
      suggestion:
        "Erro indica IP não autorizado. Para Vercel: Verifique os logs em Vercel Dashboard para ver o IP real usado e adicione-o no MongoDB Atlas Network Access. Acesse /api/health/db-raw para ver o erro original completo.",
    };
  }

  // Erro genérico - mas ainda fornecer informações úteis
  return {
    type: "UNKNOWN_ERROR",
    code: errorCode,
    codeName: errorCodeName,
    message: errorMessage || "Erro desconhecido ao conectar ao MongoDB",
    suggestion: `Erro: ${
      errorCodeName || errorName || "Desconhecido"
    }. Verifique: 1) Se a URI do MongoDB está correta, 2) Se o IP está na whitelist do MongoDB Atlas (0.0.0.0/0), 3) Se as credenciais estão corretas, 4) Se o cluster está ativo. Acesse /api/health/db para diagnóstico detalhado.`,
  };
}

/**
 * Retry logic com backoff exponencial
 */
async function connectWithRetry(
  uri: string,
  opts: mongoose.ConnectOptions,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<typeof mongoose> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await mongoose.connect(uri, opts);
      return connection;
    } catch (error: any) {
      lastError = error;
      const errorDetails = analyzeError(error);

      // Não tentar novamente para erros que não são temporários
      // IP_NOT_AUTHORIZED foi removido da lista para permitir retry caso o IP tenha sido liberado recentemente
      const nonRetryableErrors = ["HOST_NOT_FOUND", "AUTH_FAILED", "SSL_ERROR"];
      if (nonRetryableErrors.includes(errorDetails.type)) {
        throw error;
      }

      // Para erros de IP_NOT_AUTHORIZED, usar delay maior entre tentativas
      // pois pode levar alguns minutos para a propagação no MongoDB Atlas
      if (errorDetails.type === "IP_NOT_AUTHORIZED" && attempt < maxRetries) {
        const delay = Math.max(initialDelay * Math.pow(2, attempt - 1), 5000); // Mínimo de 5 segundos
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Continuar para próxima tentativa
      }

      // Se não for a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Backoff exponencial
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function connectDB() {
  // Se não houver URI, lançar erro imediatamente
  if (!MONGODB_URI) {
    const errorDetails: ErrorDetails = {
      type: "MISSING_URI",
      message: "MONGODB_URI não está definida nas variáveis de ambiente",
      suggestion:
        "Configure a variável MONGODB_URI no arquivo .env.local (desenvolvimento) ou nas configurações de ambiente da plataforma (produção, ex: Vercel).",
    };
    const error = new Error(errorDetails.message);
    (error as any).details = errorDetails;
    throw error;
  }

  // Validar formato da URI
  const validation = validateMongoUri(MONGODB_URI);
  if (!validation.valid) {
    const errorDetails: ErrorDetails = {
      type: "INVALID_URI",
      message: validation.error || "URI do MongoDB inválida",
      suggestion:
        "Verifique se a URI está no formato correto: mongodb+srv://usuario:senha@cluster.mongodb.net/banco?retryWrites=true&w=majority",
    };
    const error = new Error(errorDetails.message);
    (error as any).details = errorDetails;
    throw error;
  }

  // Verificar se já existe uma conexão estabelecida e ativa
  if (cached.conn) {
    try {
      // Verificar se a conexão ainda está ativa
      const readyState = mongoose.connection.readyState;
      if (readyState === 1) {
        // Conexão está conectada - fazer ping para verificar se está realmente ativa
        try {
          // Verificar se db existe antes de fazer ping
          if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            return cached.conn;
          } else {
            // Se db não existe, a conexão não está realmente ativa
            cached.conn = null;
            cached.promise = null;
          }
        } catch (pingError) {
          // Se o ping falhar, a conexão não está realmente ativa
          cached.conn = null;
          cached.promise = null;
          // Fechar a conexão antiga se possível
          try {
            await mongoose.connection.close();
          } catch (closeError) {
            // Ignorar erros ao fechar
          }
        }
      } else if (readyState === 2 || readyState === 3) {
        // Conexão está conectando ou desconectando, aguardar
      } else {
        // Conexão não está ativa, limpar cache
        cached.conn = null;
        cached.promise = null;
        // Fechar a conexão antiga se possível
        try {
          if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
          }
        } catch (closeError) {
          // Ignorar erros ao fechar
        }
      }
    } catch (error) {
      // Se houver erro ao verificar, limpar cache
      cached.conn = null;
      cached.promise = null;
      // Tentar fechar a conexão antiga
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close();
        }
      } catch (closeError) {
        // Ignorar erros ao fechar
      }
    }
  }

  // Se já existe uma promise de conexão em andamento, aguardar ela
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      // Se a conexão falhou, limpar a promise para tentar novamente
      cached.promise = null;
      throw error;
    }
  }

  // Criar nova promise de conexão
  try {
    // Opções otimizadas para ambientes serverless (Vercel, etc)
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 1, // Reduzido para serverless
      minPoolSize: 0,
      serverSelectionTimeoutMS: 30000, // 30 segundos (aumentado para dar mais tempo)
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // 30 segundos (aumentado para dar mais tempo)
      // Removido family: 4 para permitir que o MongoDB escolha automaticamente IPv4 ou IPv6
      retryWrites: true,
      retryReads: true,
      // Desabilitar algumas opções que podem causar problemas em serverless
      autoIndex: false,
    };

    // Adicionar parâmetros à URI se necessário
    let connectionUri = MONGODB_URI;
    if (!connectionUri.includes("retryWrites")) {
      const separator = connectionUri.includes("?") ? "&" : "?";
      connectionUri += `${separator}retryWrites=true&w=majority`;
    }

    const isAtlas = connectionUri.includes("mongodb+srv://");
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.VERCEL;

    // Tentar conectar com retry logic
    cached.promise = connectWithRetry(connectionUri, opts)
      .then((mongooseConnection) => {
        return mongooseConnection;
      })
      .catch((error: any) => {
        const errorDetails = analyzeError(error);

        // Limpar cache completamente quando há erro
        cached.promise = null;
        cached.conn = null;

        // Criar erro aprimorado
        const enhancedError = new Error(errorDetails.message);
        (enhancedError as any).details = errorDetails;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: any) {
    cached.promise = null;
    cached.conn = null;

    // Se o erro já tem detalhes, apenas re-lançar
    if (error.details) {
      throw error;
    }

    // Analisar erro e criar detalhes
    const errorDetails = analyzeError(error);

    // Criar erro com informações detalhadas
    const enhancedError = new Error(errorDetails.message);
    (enhancedError as any).originalError = error;
    (enhancedError as any).details = errorDetails;

    throw enhancedError;
  }
}

export default connectDB;
