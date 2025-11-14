import Company from "@/models/Company";
import connectDB from "@/lib/db";

/**
 * Gera um username único para uma empresa baseado no nome
 * @param companyName Nome da empresa
 * @param cnpj CNPJ da empresa (opcional, usado como fallback)
 * @returns Promise<string> Username único gerado
 */
export async function generateCompanyUsername(
  companyName: string,
  cnpj?: string
): Promise<string> {
  await connectDB();

  // Normalizar nome: remover acentos, converter para lowercase, remover caracteres especiais
  const normalize = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais exceto espaços e hífens
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/-+/g, "-") // Remove hífens duplicados
      .replace(/^-|-$/g, ""); // Remove hífens no início e fim
  };

  let baseUsername = normalize(companyName);

  // Se o nome normalizado estiver vazio, usar CNPJ ou fallback
  if (!baseUsername || baseUsername.length < 3) {
    if (cnpj) {
      baseUsername = `empresa-${cnpj.replace(/\D/g, "").slice(-8)}`;
    } else {
      baseUsername = "empresa";
    }
  }

  // Limitar tamanho base
  if (baseUsername.length > 20) {
    baseUsername = baseUsername.substring(0, 20);
  }

  // Tentar usar o username base primeiro
  let username = baseUsername;
  let counter = 1;

  // Verificar se já existe e incrementar contador se necessário
  while (true) {
    const existing = await Company.findOne({ username }).lean();
    if (!existing) {
      return username;
    }

    // Adicionar sufixo numérico
    const suffix = counter.toString();
    const maxLength = 30; // Limite total do username
    const availableLength = maxLength - suffix.length - 1; // -1 para o hífen

    if (baseUsername.length > availableLength) {
      baseUsername = baseUsername.substring(0, availableLength);
    }

    username = `${baseUsername}-${suffix}`;
    counter++;

    // Proteção contra loop infinito (muito improvável)
    if (counter > 10000) {
      // Usar timestamp como fallback
      username = `empresa-${Date.now()}`;
      const finalCheck = await Company.findOne({ username }).lean();
      if (!finalCheck) {
        return username;
      }
      // Se ainda existir (extremamente improvável), adicionar random
      username = `empresa-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return username;
    }
  }
}

/**
 * Gera uma senha aleatória segura
 * @param length Tamanho da senha (padrão: 12)
 * @returns string Senha gerada
 */
export function generateCompanyPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  // Garantir pelo menos um de cada tipo
  let password =
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];

  // Preencher o resto aleatoriamente
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralhar a senha
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

