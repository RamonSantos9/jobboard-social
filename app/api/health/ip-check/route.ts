import { NextRequest, NextResponse } from "next/server";

/**
 * Rota para verificar se o IP atual está na whitelist do MongoDB Atlas
 * Compara o IP atual com uma lista de IPs conhecidos (você pode manter essa lista atualizada)
 */
export async function GET(request: NextRequest) {
  try {
    // Obter IP atual
    let currentIp: string | null = null;
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000),
      });
      const ipData = await ipResponse.json();
      currentIp = ipData.ip;
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível obter o IP atual",
        },
        { status: 500 }
      );
    }

    // Lista de IPs conhecidos da Vercel (você pode atualizar esta lista manualmente)
    // Adicione aqui os IPs que você já adicionou no MongoDB Atlas
    const knownIps = process.env.KNOWN_VERCEL_IPS 
      ? process.env.KNOWN_VERCEL_IPS.split(",").map(ip => ip.trim())
      : [];

    const isKnown = knownIps.includes(currentIp);

    return NextResponse.json(
      {
        success: true,
        currentIp: currentIp,
        isKnown: isKnown,
        knownIps: knownIps,
        action: isKnown 
          ? "✅ Este IP já está na sua lista de IPs conhecidos. Se ainda houver erro, verifique se ele está realmente no MongoDB Atlas."
          : "⚠️ Este IP NÃO está na sua lista de IPs conhecidos. Adicione este IP no MongoDB Atlas Network Access.",
        instructions: {
          step1: "Acesse MongoDB Atlas → Network Access",
          step2: "Clique em 'Add IP Address'",
          step3: `Adicione o IP: ${currentIp}`,
          step4: "Comentário: 'Vercel - " + new Date().toISOString().split('T')[0] + "'",
          step5: "Clique em 'Confirm'",
          step6: "Aguarde 2-5 minutos",
          step7: "Atualize a variável de ambiente KNOWN_VERCEL_IPS na Vercel com todos os IPs (separados por vírgula)",
        },
        note: "💡 DICA: Mantenha a variável de ambiente KNOWN_VERCEL_IPS na Vercel atualizada com todos os IPs que você adicionou no MongoDB Atlas. Isso ajuda a rastrear quais IPs já foram adicionados.",
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
          message: error?.message || "Erro ao verificar IP",
          name: error?.name,
        },
      },
      { status: 500 }
    );
  }
}

