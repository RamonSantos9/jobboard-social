import mongoose from "mongoose";

// Obter a URI do MongoDB das variáveis de ambiente
const MONGODB_URI = process.env.MONGODB_URI;

// Log para debug (sem expor a senha)
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI não está definida nas variáveis de ambiente");
  console.error("Por favor, configure a variável MONGODB_URI no arquivo .env.local (desenvolvimento) ou nas configurações de ambiente da plataforma (produção)");
} else {
  // Log parcial da URI (sem credenciais) para debug
  const uriParts = MONGODB_URI.split("@");
  if (uriParts.length > 1) {
    console.log("✅ MONGODB_URI configurada:", `mongodb://***@${uriParts[1].split("/")[0]}/...`);
  } else {
    console.log("✅ MONGODB_URI configurada:", MONGODB_URI.substring(0, 20) + "...");
  }
}

declare global {
  var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // Verificar se já existe uma conexão estabelecida
  if (cached.conn) {
    // Verificar se a conexão ainda está ativa
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    } else {
      // Se a conexão não está ativa, limpar o cache
      cached.conn = null;
      cached.promise = null;
    }
  }

  // Se já existe uma promise de conexão em andamento, aguardar ela
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      // Se a conexão falhou, limpar a promise para tentar novamente
      cached.promise = null;
      throw e;
    }
  }

  // Criar nova promise de conexão
  try {
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI não está definida. Configure a variável de ambiente MONGODB_URI."
      );
    }

    console.log("Tentando conectar ao MongoDB...");
    
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Aumentado para 10s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      // Configurações adicionais para ambientes serverless
      maxIdleTimeMS: 30000,
      minPoolSize: 1,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ Conectado ao MongoDB com sucesso");
      return mongoose;
    }).catch((error) => {
      console.error("❌ Erro ao conectar ao MongoDB:", {
        message: error?.message,
        name: error?.name,
        code: (error as any)?.code,
      });
      cached.promise = null;
      throw error;
    });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: any) {
    cached.promise = null;
    console.error("Erro crítico ao conectar ao MongoDB:", {
      message: e?.message,
      name: e?.name,
      code: e?.code,
      stack: e?.stack,
    });
    throw e;
  }
}

export default connectDB;
