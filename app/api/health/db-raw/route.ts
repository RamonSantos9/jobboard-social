import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

/**
 * Rota de diagnóstico RAW - mostra o erro REAL sem classificação
 * Use esta rota para ver o erro original do MongoDB sem interpretação
 */
export async function GET(request: NextRequest) {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      return NextResponse.json(
        {
          error: "MONGODB_URI não configurada",
          message: "A variável de ambiente MONGODB_URI não está definida",
        },
        { status: 500 }
      );
    }

    // Tentar conectar diretamente sem usar connectDB() para ver o erro real
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      });
      
      return NextResponse.json(
        {
          success: true,
          message: "Conexão bem-sucedida",
          connection: {
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name,
          },
        },
        { status: 200 }
      );
    } catch (error: any) {
      // Retornar o erro REAL completo sem classificação
      return NextResponse.json(
        {
          success: false,
          error: {
            // Informações básicas do erro
            name: error?.name,
            message: error?.message,
            code: error?.code,
            codeName: error?.codeName,
            
            // Stack trace completo
            stack: error?.stack,
            
            // Informações adicionais do MongoDB
            ...(error?.reason && { reason: error.reason }),
            ...(error?.cause && { cause: error.cause }),
            ...(error?.topologyVersion && { topologyVersion: error.topologyVersion }),
            ...(error?.generation && { generation: error.generation }),
            ...(error?.maxWireVersion && { maxWireVersion: error.maxWireVersion }),
            
            // Propriedades adicionais
            ...(error?.hostname && { hostname: error.hostname }),
            ...(error?.port && { port: error.port }),
            ...(error?.addresses && { addresses: error.addresses }),
          },
          diagnostic: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || "unknown",
            platform: process.env.VERCEL ? "Vercel" : "local",
            vercel_url: process.env.VERCEL_URL || null,
          },
          note: "Este é o erro REAL do MongoDB sem classificação. Use estas informações para identificar o problema real.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        },
      },
      { status: 500 }
    );
  }
}

