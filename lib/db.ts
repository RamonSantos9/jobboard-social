import mongoose from "mongoose";

// Obter a URI do MongoDB das variáveis de ambiente
const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
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

export async function connectDB() {
  // Se não houver URI, lançar erro imediatamente
  if (!MONGODB_URI) {
    const error = new Error(
      "MONGODB_URI não está definida nas variáveis de ambiente. Configure a variável MONGODB_URI no arquivo .env.local (desenvolvimento) ou nas configurações de ambiente da plataforma (produção)."
    );
    console.error("❌", error.message);
    throw error;
  }

  // Verificar se já existe uma conexão estabelecida e ativa
  if (cached.conn) {
    try {
      // Verificar se a conexão ainda está ativa
      const readyState = mongoose.connection.readyState;
      if (readyState === 1) {
        // Conexão está conectada
        return cached.conn;
      } else if (readyState === 2 || readyState === 3) {
        // Conexão está conectando ou desconectando, aguardar
        console.log(`Conexão MongoDB em estado ${readyState}, aguardando...`);
      } else {
        // Conexão não está ativa, limpar cache
        console.log("Conexão MongoDB não está ativa, limpando cache...");
        cached.conn = null;
        cached.promise = null;
      }
    } catch (error) {
      // Se houver erro ao verificar, limpar cache
      console.error("Erro ao verificar conexão MongoDB:", error);
      cached.conn = null;
      cached.promise = null;
    }
  }

  // Se já existe uma promise de conexão em andamento, aguardar ela
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      // Se a conexão falhou, limpar a promise para tentar novamente
      console.error("Promise de conexão falhou, limpando...", error);
      cached.promise = null;
      throw error;
    }
  }

  // Criar nova promise de conexão
  try {
    console.log("🔌 Tentando conectar ao MongoDB...");
    
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

    cached.promise = mongoose
      .connect(connectionUri, opts)
      .then((mongoose) => {
        console.log("✅ Conectado ao MongoDB com sucesso");
        console.log(`   Estado: ${mongoose.connection.readyState}`);
        console.log(`   Host: ${mongoose.connection.host}`);
        console.log(`   Database: ${mongoose.connection.name}`);
        return mongoose;
      })
      .catch((error: any) => {
        console.error("❌ Erro ao conectar ao MongoDB:", {
          message: error?.message,
          name: error?.name,
          code: error?.code,
          codeName: error?.codeName,
        });
        cached.promise = null;
        throw error;
      });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: any) {
    cached.promise = null;
    cached.conn = null;
    
    // Melhorar mensagem de erro
    let errorMessage = "Erro ao conectar ao MongoDB";
    let errorDetails: any = {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      codeName: error?.codeName,
    };

    // Detectar tipos específicos de erro
    if (error?.code === "ENOTFOUND" || error?.message?.includes("ENOTFOUND")) {
      errorMessage = "Não foi possível resolver o hostname do MongoDB. Verifique se a URI está correta.";
      errorDetails.type = "HOST_NOT_FOUND";
    } else if (error?.code === "ECONNREFUSED" || error?.message?.includes("ECONNREFUSED")) {
      errorMessage = "Conexão recusada pelo servidor MongoDB. Verifique se o servidor está ativo e acessível.";
      errorDetails.type = "CONNECTION_REFUSED";
    } else if (error?.code === 18 || error?.message?.includes("authentication failed")) {
      errorMessage = "Falha na autenticação do MongoDB. Verifique as credenciais.";
      errorDetails.type = "AUTH_FAILED";
    } else if (error?.code === "ETIMEDOUT" || error?.message?.includes("timeout")) {
      errorMessage = "Timeout ao conectar ao MongoDB. Verifique sua conexão de rede e as configurações do firewall.";
      errorDetails.type = "TIMEOUT";
    } else if (error?.codeName === "ServerSelectionTimeoutError") {
      errorMessage = "Timeout ao selecionar servidor MongoDB. Verifique se o cluster está acessível e se o IP está na whitelist.";
      errorDetails.type = "SERVER_SELECTION_TIMEOUT";
    }

    console.error("❌ Erro crítico ao conectar ao MongoDB:", errorDetails);
    
    // Criar erro com informações detalhadas
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).details = errorDetails;
    
    throw enhancedError;
  }
}

export default connectDB;
