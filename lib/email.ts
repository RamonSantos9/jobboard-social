/**
 * Função para enviar email de convite
 * DESENVOLVIMENTO: Apenas loga no console
 * PRODUÇÃO: Integrar com SendGrid, Mailgun ou Nodemailer
 */
export async function sendInviteEmail(
  to: string,
  companyName: string,
  role: string,
  acceptUrl: string
): Promise<boolean> {
  try {
    console.log("\n=== EMAIL DE CONVITE ===");
    console.log(`Para: ${to}`);
    console.log(`Empresa: ${companyName}`);
    console.log(`Cargo: ${role}`);
    console.log(`Link de aceite: ${acceptUrl}`);
    console.log("========================\n");

    // TODO: Em produção, integrar com serviço de email real
    // Exemplo com SendGrid:
    // await sgMail.send({
    //   to,
    //   from: process.env.EMAIL_FROM,
    //   subject: `Convite para ${companyName}`,
    //   html: `<p>Você foi convidado...</p><a href="${acceptUrl}">Aceitar convite</a>`
    // });

    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Template HTML para email de convite
 * Pode ser customizado conforme necessário
 */
export function getInviteEmailTemplate(
  companyName: string,
  role: string,
  acceptUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #0066cc; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { font-size: 12px; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Convite para ${companyName}</h2>
          <p>Você foi convidado para ser <strong>${role}</strong> na empresa <strong>${companyName}</strong>.</p>
          <p>Clique no botão abaixo para aceitar o convite:</p>
          <a href="${acceptUrl}" class="button">Aceitar Convite</a>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #0066cc;">${acceptUrl}</p>
          <div class="footer">
            <p>Este convite expira em 7 dias.</p>
            <p>Se você não solicitou este convite, pode ignorar este email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
