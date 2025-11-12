import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    // Verificar se MONGODB_URI está configurada
    const hasMongoUri = !!process.env.MONGODB_URI;
    const mongoUriPreview = process.env.MONGODB_URI
      ? process.env.MONGODB_URI.split("@").length > 1
        ? `mongodb://***@${process.env.MONGODB_URI.split("@")[1].split("/")[0]}`
        : process.env.MONGODB_URI.substring(0, 30) + "..."
      : "Não configurada";

    // Tentar conectar ao banco de dados
    let connectionStatus = "unknown";
    let connectionError = null;
    let connectionDetails = null;

    try {
      await connectDB();
      connectionStatus = "connected";
      connectionDetails = {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port,
      };
    } catch (error: any) {
      connectionStatus = "error";
      connectionError = {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        codeName: error?.codeName,
        type: error?.details?.type,
      };
    }

    return NextResponse.json(
      {
        status: connectionStatus === "connected" ? "ok" : "error",
        database: {
          uri_configured: hasMongoUri,
          uri_preview: mongoUriPreview,
          connection_status: connectionStatus,
          connection_details: connectionDetails,
          error: connectionError,
        },
        environment: {
          node_env: process.env.NODE_ENV,
          vercel: process.env.VERCEL ? "true" : "false",
        },
      },
      { status: connectionStatus === "connected" ? 200 : 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          message: error?.message,
          name: error?.name,
        },
      },
      { status: 500 }
    );
  }
}

