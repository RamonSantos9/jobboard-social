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
let cached: MongooseCache = 
  global.mongoose ?? { conn: null, promise: null };

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

  // Detectar erros de DNS/Hostname
  if (errorCode === "ENOTFOUND" || errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
    return {
      type: "HOST_NOT_FOUND",
      code: errorCode,
      codeName: errorCodeName,
      message: "Não foi possível resolver o hostname do MongoDB",
      suggestion: "Verifique se a URI do MongoDB está correta e se o hostname existe. Para MongoDB Atlas, verifique se o cluster está ativo.",
    };
  }

  // Detectar erros de conexão recusada
  if (errorCode === "ECONNREFUSED" || errorMessage.includes("ECONNREFUSED")) {
    return {
      type: "CONNECTION_REFUSED",
      code: errorCode,
      codeName: errorCodeName,
      message: "Conexão recusada pelo servidor MongoDB",
      suggestion: "Verifique se o servidor MongoDB está ativo e se a porta está correta. Para MongoDB Atlas, verifique se o IP está na whitelist (Network Access).",
    };
  }

  // Detectar erros de autenticação
  if (errorCode === 18 || errorCode === "EAUTH" || errorMessage.includes("authentication failed") || errorMessage.includes("bad auth")) {
    return {
      type: "AUTH_FAILED",
      code: errorCode,
      codeName: errorCodeName,
      message: "Falha na autenticação do MongoDB",
      suggestion: "Verifique se o usuário e senha estão corretos. Certifique-se de que caracteres especiais na senha estão codificados (ex: @ vira %40).",
    };
  }

  // Detectar erros de timeout
  if (errorCode === "ETIMEDOUT" || errorCode === "ESOCKETTIMEDOUT" || errorMessage.includes("timeout") || errorCodeName === "ServerSelectionTimeoutError") {
    return {
      type: "TIMEOUT",
      code: errorCode,
      codeName: errorCodeName,
      message: "Timeout ao conectar ao MongoDB",
      suggestion: "Verifique se o cluster está acessível, se o IP está na whitelist do MongoDB Atlas (use 0.0.0.0/0 para permitir todos os IPs), e se não há problemas de rede ou firewall.",
    };
  }

  // Detectar erros de SSL/TLS
  if (errorMessage.includes("SSL") || errorMessage.includes("TLS") || errorMessage.includes("certificate")) {
    return {
      type: "SSL_ERROR",
      code: errorCode,
      codeName: errorCodeName,
      message: "Erro de SSL/TLS ao conectar ao MongoDB",
      suggestion: "Verifique se o MongoDB Atlas está configurado corretamente para conexões SSL. Certifique-se de que a URI usa 'mongodb+srv://' para conexões Atlas.",
    };
  }

  // Detectar erros de IP não autorizado (whitelist)
  if (errorMessage.includes("not authorized") || errorMessage.includes("IP") || errorMessage.includes("whitelist")) {
    return {
      type: "IP_NOT_AUTHORIZED",
      code: errorCode,
      codeName: errorCodeName,
      message: "IP não autorizado para acessar o MongoDB",
      suggestion: "Adicione o IP do servidor (ou 0.0.0.0/0 para permitir todos) na Network Access do MongoDB Atlas.",
    };
  }

  // Erro genérico
  return {
    type: "UNKNOWN_ERROR",
    code: errorCode,
    codeName: errorCodeName,
    message: errorMessage,
    suggestion: "Verifique os logs do servidor para mais detalhes. Certifique-se de que a URI do MongoDB está correta e que todas as configurações estão adequadas.",
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
      console.log(`[MongoDB] Tentativa ${attempt}/${maxRetries} de conexão...`);
      const connection = await mongoose.connect(uri, opts);
      console.log(`[MongoDB] ✅ Conectado com sucesso na tentativa ${attempt}`);
      return connection;
    } catch (error: any) {
      lastError = error;
      const errorDetails = analyzeError(error);
      
      // Não tentar novamente para erros que não são temporários
      const nonRetryableErrors = ["HOST_NOT_FOUND", "AUTH_FAILED", "SSL_ERROR", "IP_NOT_AUTHORIZED"];
      if (nonRetryableErrors.includes(errorDetails.type)) {
        console.error(`[MongoDB] ❌ Erro não recuperável: ${errorDetails.type}`);
        throw error;
      }

      // Se não for a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Backoff exponencial
        console.log(`[MongoDB] ⚠️ Tentativa ${attempt} falhou, aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`[MongoDB] ❌ Todas as ${maxRetries} tentativas falharam`);
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
      suggestion: "Configure a variável MONGODB_URI no arquivo .env.local (desenvolvimento) ou nas configurações de ambiente da plataforma (produção, ex: Vercel).",
    };
    console.error("[MongoDB] ❌", errorDetails.message);
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
      suggestion: "Verifique se a URI está no formato correto: mongodb+srv://usuario:senha@cluster.mongodb.net/banco?retryWrites=true&w=majority",
    };
    console.error("[MongoDB] ❌", errorDetails.message);
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
        // Conexão está conectada
        console.log("[MongoDB] ✅ Usando conexão existente");
        return cached.conn;
      } else if (readyState === 2 || readyState === 3) {
        // Conexão está conectando ou desconectando, aguardar
        console.log(`[MongoDB] ⏳ Conexão em estado ${readyState}, aguardando...`);
      } else {
        // Conexão não está ativa, limpar cache
        console.log("[MongoDB] 🔄 Conexão não está ativa, limpando cache...");
        cached.conn = null;
        cached.promise = null;
      }
    } catch (error) {
      // Se houver erro ao verificar, limpar cache
      console.error("[MongoDB] ⚠️ Erro ao verificar conexão:", error);
      cached.conn = null;
      cached.promise = null;
    }
  }

  // Se já existe uma promise de conexão em andamento, aguardar ela
  if (cached.promise) {
    try {
      console.log("[MongoDB] ⏳ Aguardando conexão em andamento...");
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      // Se a conexão falhou, limpar a promise para tentar novamente
      console.error("[MongoDB] ❌ Promise de conexão falhou, limpando...");
      cached.promise = null;
      throw error;
    }
  }

  // Criar nova promise de conexão
  try {
    console.log("[MongoDB] 🔌 Iniciando nova conexão...");
    
    // Opções otimizadas para ambientes serverless (Vercel, etc)
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 1, // Reduzido para serverless
      minPoolSize: 0,
      serverSelectionTimeoutMS: 15000, // 15 segundos
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      family: 4, // Forçar IPv4
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

    // Tentar conectar com retry logic
    cached.promise = connectWithRetry(connectionUri, opts)
      .then((mongooseConnection) => {
        console.log("[MongoDB] ✅ Conectado com sucesso");
        console.log(`[MongoDB]    Estado: ${mongooseConnection.connection.readyState}`);
        console.log(`[MongoDB]    Host: ${mongooseConnection.connection.host}`);
        console.log(`[MongoDB]    Database: ${mongooseConnection.connection.name}`);
        return mongooseConnection;
      })
      .catch((error: any) => {
        const errorDetails = analyzeError(error);
        console.error("[MongoDB] ❌ Erro ao conectar:", {
          type: errorDetails.type,
          code: errorDetails.code,
          codeName: errorDetails.codeName,
          message: errorDetails.message,
          suggestion: errorDetails.suggestion,
        });
        cached.promise = null;
        
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
    console.error("[MongoDB] ❌ Erro crítico:", {
      type: errorDetails.type,
      code: errorDetails.code,
      codeName: errorDetails.codeName,
      message: errorDetails.message,
      suggestion: errorDetails.suggestion,
    });
    
    // Criar erro com informações detalhadas
    const enhancedError = new Error(errorDetails.message);
    (enhancedError as any).originalError = error;
    (enhancedError as any).details = errorDetails;
    
    throw enhancedError;
  }
}

export default connectDB;
