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
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL;

  // Log completo do erro para diagnóstico
  console.error("[MongoDB Error Analysis]", {
    message: errorMessage,
    code: errorCode,
    codeName: errorCodeName,
    name: errorName,
    stack: error?.stack?.substring(0, 500), // Primeiros 500 caracteres do stack
  });

  // Detectar erros de DNS/Hostname (prioridade alta)
  if (errorCode === "ENOTFOUND" || errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo") || errorMessage.includes("ENOTFOUND")) {
    return {
      type: "HOST_NOT_FOUND",
      code: errorCode,
      codeName: errorCodeName,
      message: "Não foi possível resolver o hostname do MongoDB",
      suggestion: "Verifique se a URI do MongoDB está correta e se o hostname existe. Para MongoDB Atlas, verifique se o cluster está ativo e se a URI usa o formato mongodb+srv://.",
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
    errorCodeName === "MongoServerError" && errorMessage.includes("authentication")
  ) {
    return {
      type: "AUTH_FAILED",
      code: errorCode,
      codeName: errorCodeName,
      message: "Falha na autenticação do MongoDB",
      suggestion: "Verifique se o usuário e senha estão corretos. Certifique-se de que caracteres especiais na senha estão codificados (ex: @ vira %40). Verifique também se o usuário tem as permissões adequadas no MongoDB Atlas.",
    };
  }

  // Detectar erros de timeout
  // Em produção com MongoDB Atlas, timeout geralmente significa IP não autorizado
  // O MongoDB Atlas não responde a conexões de IPs não autorizados, resultando em timeout
  const isAtlas = MONGODB_URI?.includes("mongodb+srv://") || MONGODB_URI?.includes("atlas");
  const isTimeoutError = 
    errorCode === "ETIMEDOUT" || 
    errorCode === "ESOCKETTIMEDOUT" || 
    errorMessage.includes("timeout") || 
    errorCodeName === "ServerSelectionTimeoutError" ||
    errorCodeName === "MongoServerSelectionError" ||
    (errorName === "MongoServerSelectionError" && errorMessage.includes("timeout")) ||
    errorName === "MongoServerSelectionError";

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
        suggestion: "SOLUÇÃO RÁPIDA:\n1. Acesse https://cloud.mongodb.com/ e faça login\n2. Selecione seu projeto (se houver múltiplos)\n3. No menu lateral esquerdo, clique em 'Network Access'\n4. Clique no botão verde 'Add IP Address'\n5. Na modal, selecione 'Allow Access from Anywhere' (isso adiciona automaticamente 0.0.0.0/0)\n6. OU digite manualmente: 0.0.0.0/0\n7. Adicione um comentário opcional (ex: 'Vercel - All IPs')\n8. Clique em 'Confirm'\n9. AGUARDE 3-5 MINUTOS para a propagação\n10. Teste novamente\n\n⚠️ IMPORTANTE:\n- A Vercel usa IPs dinâmicos que mudam constantemente\n- Você DEVE usar 0.0.0.0/0 (permitir todos os IPs)\n- IPs específicos NÃO funcionam com a Vercel\n- Após adicionar, aguarde alguns minutos antes de testar",
      };
    }
    
    // Caso contrário, classificar como timeout genérico
    return {
      type: "TIMEOUT",
      code: errorCode,
      codeName: errorCodeName,
      message: "Timeout ao conectar ao MongoDB",
      suggestion: "Verifique: 1) Se o cluster está acessível, 2) Se o IP está na whitelist do MongoDB Atlas (use 0.0.0.0/0 para permitir todos os IPs), 3) Se não há problemas de rede ou firewall, 4) Se o cluster está ativo e rodando. Se o IP já foi liberado, aguarde alguns minutos e tente novamente.",
    };
  }

  // Detectar erros de conexão recusada
  if (errorCode === "ECONNREFUSED" || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("connection refused")) {
    // Em produção com Atlas, connection refused pode indicar IP não autorizado
    if (isProduction && MONGODB_URI?.includes("mongodb+srv://")) {
      return {
        type: "IP_NOT_AUTHORIZED",
        code: errorCode,
        codeName: errorCodeName,
        message: "Conexão recusada - IP provavelmente não está na whitelist do MongoDB Atlas",
        suggestion: "1. Acesse MongoDB Atlas → Network Access\n2. Clique em 'Add IP Address'\n3. Adicione '0.0.0.0/0' para permitir todos os IPs\n4. Aguarde 2-5 minutos para a propagação",
      };
    }
    return {
      type: "CONNECTION_REFUSED",
      code: errorCode,
      codeName: errorCodeName,
      message: "Conexão recusada pelo servidor MongoDB",
      suggestion: "Verifique se o servidor MongoDB está ativo e se a porta está correta. Para MongoDB Atlas, verifique se o IP está na whitelist (Network Access).",
    };
  }

  // Detectar erros de SSL/TLS
  if (errorMessage.includes("SSL") || errorMessage.includes("TLS") || errorMessage.includes("certificate") || errorMessage.includes("certificate")) {
    return {
      type: "SSL_ERROR",
      code: errorCode,
      codeName: errorCodeName,
      message: "Erro de SSL/TLS ao conectar ao MongoDB",
      suggestion: "Verifique se o MongoDB Atlas está configurado corretamente para conexões SSL. Certifique-se de que a URI usa 'mongodb+srv://' para conexões Atlas.",
    };
  }

  // Detectar erros explícitos de IP não autorizado ou whitelist
  if (
    errorMessage.toLowerCase().includes("not authorized") || 
    errorMessage.toLowerCase().includes("ip address") ||
    errorMessage.toLowerCase().includes("whitelist") ||
    errorMessage.toLowerCase().includes("access denied") ||
    errorMessage.toLowerCase().includes("network access") ||
    errorCodeName === "MongoNetworkError" && errorMessage.includes("access")
  ) {
    return {
      type: "IP_NOT_AUTHORIZED",
      code: errorCode,
      codeName: errorCodeName,
      message: "IP não autorizado para acessar o MongoDB",
      suggestion: "1. Acesse MongoDB Atlas → Network Access\n2. Clique em 'Add IP Address'\n3. Adicione '0.0.0.0/0' para permitir todos os IPs (recomendado para Vercel)\n4. Aguarde 2-5 minutos para a propagação das mudanças",
    };
  }

  // Erro genérico - mas ainda fornecer informações úteis
  return {
    type: "UNKNOWN_ERROR",
    code: errorCode,
    codeName: errorCodeName,
    message: errorMessage || "Erro desconhecido ao conectar ao MongoDB",
    suggestion: `Erro: ${errorCodeName || errorName || "Desconhecido"}. Verifique: 1) Se a URI do MongoDB está correta, 2) Se o IP está na whitelist do MongoDB Atlas (0.0.0.0/0), 3) Se as credenciais estão corretas, 4) Se o cluster está ativo. Acesse /api/health/db para diagnóstico detalhado.`,
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
      // IP_NOT_AUTHORIZED foi removido da lista para permitir retry caso o IP tenha sido liberado recentemente
      const nonRetryableErrors = ["HOST_NOT_FOUND", "AUTH_FAILED", "SSL_ERROR"];
      if (nonRetryableErrors.includes(errorDetails.type)) {
        console.error(`[MongoDB] ❌ Erro não recuperável: ${errorDetails.type}`);
        throw error;
      }
      
      // Para erros de IP_NOT_AUTHORIZED, usar delay maior entre tentativas
      // pois pode levar alguns minutos para a propagação no MongoDB Atlas
      if (errorDetails.type === "IP_NOT_AUTHORIZED" && attempt < maxRetries) {
        const delay = Math.max(initialDelay * Math.pow(2, attempt - 1), 5000); // Mínimo de 5 segundos
        console.log(`[MongoDB] ⚠️ Erro de IP não autorizado na tentativa ${attempt}, aguardando ${delay}ms antes de tentar novamente...`);
        console.log(`[MongoDB] 💡 Se você acabou de liberar o IP no MongoDB Atlas, aguarde alguns minutos para a propagação.`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Continuar para próxima tentativa
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
        // Conexão está conectada - fazer ping para verificar se está realmente ativa
        try {
          await mongoose.connection.db.admin().ping();
          console.log("[MongoDB] ✅ Usando conexão existente (verificada com ping)");
          return cached.conn;
        } catch (pingError) {
          // Se o ping falhar, a conexão não está realmente ativa
          console.log("[MongoDB] ⚠️ Ping falhou, conexão não está ativa. Limpando cache...");
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
        console.log(`[MongoDB] ⏳ Conexão em estado ${readyState}, aguardando...`);
      } else {
        // Conexão não está ativa, limpar cache
        console.log("[MongoDB] 🔄 Conexão não está ativa, limpando cache...");
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
      console.error("[MongoDB] ⚠️ Erro ao verificar conexão:", error);
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

    // Log informações de diagnóstico antes de tentar conectar
    const isAtlas = connectionUri.includes("mongodb+srv://");
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL;
    
    console.log("[MongoDB] 📋 Informações de diagnóstico:", {
      environment: isProduction ? "production" : "development",
      platform: process.env.VERCEL ? "Vercel" : "local",
      atlas: isAtlas ? "yes" : "no",
      uriFormat: connectionUri.substring(0, 20) + "...",
      serverSelectionTimeout: opts.serverSelectionTimeoutMS,
    });

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
        
        // Log completo do erro para diagnóstico
        console.error("[MongoDB] ❌ Erro detalhado ao conectar:", {
          type: errorDetails.type,
          code: errorDetails.code,
          codeName: errorDetails.codeName,
          message: errorDetails.message,
          originalMessage: error?.message,
          originalName: error?.name,
          originalCode: error?.code,
          stack: error?.stack?.substring(0, 300), // Primeiros 300 caracteres do stack
          suggestion: errorDetails.suggestion,
          environment: isProduction ? "production" : "development",
          atlas: isAtlas ? "yes" : "no",
        });
        
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
