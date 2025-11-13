import { NextRequest, NextResponse } from "next/server";

/**
 * Rota para obter o IP real usado pela Vercel
 * Use este IP para adicionar na whitelist do MongoDB Atlas
 */
export async function GET(request: NextRequest) {
  try {
    // Obter IP do cliente (Vercel passa isso nos headers)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    
    // Tentar obter IP de um serviço externo para confirmar
    let externalIp: string | null = null;
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      });
      const ipData = await ipResponse.json();
      externalIp = ipData.ip;
    } catch (error) {
      // Ignorar erro ao obter IP externo
    }
    
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfConnectingIp || "Não disponível";
    
    return NextResponse.json(
      {
        success: true,
        ip: {
          // IP do cliente (pode ser o IP da Vercel ou do usuário)
          clientIp: clientIp,
          // IP externo confirmado (IP real do servidor Vercel)
          externalIp: externalIp,
          // IP recomendado para adicionar na whitelist
          recommendedIp: externalIp || clientIp,
        },
        headers: {
          "x-forwarded-for": forwardedFor,
          "x-real-ip": realIp,
          "cf-connecting-ip": cfConnectingIp,
        },
        instructions: {
          step1: "Copie o IP mostrado em 'recommendedIp' ou 'externalIp'",
          step2: "Acesse MongoDB Atlas → Network Access",
          step3: "Clique em 'Add IP Address'",
          step4: "Cole o IP copiado",
          step5: "Adicione um comentário: 'Vercel - [data atual]'",
          step6: "Clique em 'Confirm'",
          step7: "Aguarde 2-5 minutos para propagação",
          note: "⚠️ IMPORTANTE: O IP da Vercel pode mudar a cada deploy. Para produção, considere usar MongoDB Atlas Private Endpoint para maior segurança e estabilidade.",
        },
        alternative: {
          title: "Alternativa Segura: MongoDB Atlas Private Endpoint",
          description: "Para produção, recomenda-se usar Private Endpoint que conecta via rede privada, sem necessidade de liberar IPs públicos.",
          link: "https://www.mongodb.com/docs/atlas/security-vpc-peering/",
        },
        diagnostic: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "unknown",
          platform: process.env.VERCEL ? "Vercel" : "local",
          vercel_url: process.env.VERCEL_URL || null,
        },
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error?.message || "Erro ao obter IP",
          name: error?.name,
        },
      },
      { status: 500 }
    );
  }
}


