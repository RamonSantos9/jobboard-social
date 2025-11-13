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
        solutionForFlex: {
          title: "Solução para MongoDB Atlas Flex (sem Private Endpoint)",
          description: "Como você está usando MongoDB Atlas Flex, o Private Endpoint não está disponível. Use esta solução:",
          steps: [
            "1. Adicione o IP mostrado acima no MongoDB Atlas Network Access",
            "2. Após cada deploy na Vercel, verifique se o IP mudou acessando esta rota novamente",
            "3. Se o IP mudar, adicione o novo IP no MongoDB Atlas",
            "4. Mantenha os IPs antigos por alguns dias antes de remover (caso precise fazer rollback)",
          ],
          tip: "💡 DICA: Crie um bookmark desta rota (/api/health/vercel-ip) para verificar rapidamente o IP após cada deploy.",
        },
        alternative: {
          title: "Alternativa: Upgrade para M10+ (se possível)",
          description: "Se você puder fazer upgrade para M10 ou superior, poderá usar Private Endpoint que resolve este problema permanentemente.",
          link: "https://www.mongodb.com/docs/atlas/security-vpc-peering/",
          note: "Esta é uma solução paga, mas oferece maior segurança e estabilidade.",
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


