import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import readline from "readline";

import Company, { type ICompany } from "../models/Company";
import Vacancy, { vacancyLevelSalaryBands } from "../models/Vacancy";
import User from "../models/User";
import Application from "../models/Application";
import Post from "../models/Post";
import Profile from "../models/Profile";
import { generateUniqueSlugForProfile } from "../lib/slug";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Dados fictícios
const companiesData = [
  {
    name: "TechCorp Brasil",
    industry: "Tecnologia",
    size: "large",
    location: "São Paulo, SP",
  },
  {
    name: "Inovação Digital",
    industry: "Tecnologia",
    size: "medium",
    location: "Rio de Janeiro, RJ",
  },
  {
    name: "StartupLab",
    industry: "Tecnologia",
    size: "startup",
    location: "Belo Horizonte, MG",
  },
  {
    name: "Cloud Solutions",
    industry: "Tecnologia",
    size: "medium",
    location: "Curitiba, PR",
  },
  {
    name: "FinTech Brasil",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "HealthTech Innovations",
    industry: "Tecnologia",
    size: "small",
    location: "Brasília, DF",
  },
  {
    name: "EduTech Solutions",
    industry: "Tecnologia",
    size: "medium",
    location: "Porto Alegre, RS",
  },
  {
    name: "RetailMax",
    industry: "Tecnologia",
    size: "large",
    location: "São Paulo, SP",
  },
  {
    name: "ManufacturingPro",
    industry: "Tecnologia",
    size: "large",
    location: "Campinas, SP",
  },
  {
    name: "Consulting Experts",
    industry: "Tecnologia",
    size: "small",
    location: "Rio de Janeiro, RJ",
  },
  {
    name: "Data Analytics Co",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "MobileFirst",
    industry: "Tecnologia",
    size: "startup",
    location: "Florianópolis, SC",
  },
  {
    name: "Blockchain Brasil",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "AI Solutions",
    industry: "Tecnologia",
    size: "medium",
    location: "Recife, PE",
  },
  {
    name: "Cyber Security Pro",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "DevOps Experts",
    industry: "Tecnologia",
    size: "startup",
    location: "São Paulo, SP",
  },
  {
    name: "Full Stack Agency",
    industry: "Tecnologia",
    size: "medium",
    location: "Belo Horizonte, MG",
  },
  {
    name: "Game Studios BR",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "E-commerce Solutions",
    industry: "Tecnologia",
    size: "large",
    location: "São Paulo, SP",
  },
  {
    name: "Marketing Digital",
    industry: "Tecnologia",
    size: "medium",
    location: "Rio de Janeiro, RJ",
  },
  {
    name: "UX Design Studio",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "Backend Solutions",
    industry: "Tecnologia",
    size: "medium",
    location: "Campinas, SP",
  },
  {
    name: "Frontend Masters",
    industry: "Tecnologia",
    size: "startup",
    location: "São Paulo, SP",
  },
  {
    name: "Cloud Infrastructure",
    industry: "Tecnologia",
    size: "medium",
    location: "Curitiba, PR",
  },
  {
    name: "Machine Learning BR",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "Bank Innovation",
    industry: "Tecnologia",
    size: "large",
    location: "São Paulo, SP",
  },
  {
    name: "Insurance Tech",
    industry: "Tecnologia",
    size: "medium",
    location: "Rio de Janeiro, RJ",
  },
  {
    name: "Payment Solutions",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "Hospital Management",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "Telemedicine Pro",
    industry: "Tecnologia",
    size: "startup",
    location: "Brasília, DF",
  },
  {
    name: "Online Education",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "EdTech Platform",
    industry: "Tecnologia",
    size: "small",
    location: "Rio de Janeiro, RJ",
  },
  {
    name: "Retail Chain",
    industry: "Tecnologia",
    size: "large",
    location: "São Paulo, SP",
  },
  {
    name: "E-commerce Giant",
    industry: "Tecnologia",
    size: "enterprise",
    location: "São Paulo, SP",
  },
  {
    name: "Factory Solutions",
    industry: "Tecnologia",
    size: "large",
    location: "Campinas, SP",
  },
  {
    name: "Industrial Tech",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "Business Consulting",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "IT Consulting",
    industry: "Tecnologia",
    size: "small",
    location: "Rio de Janeiro, RJ",
  },
  {
    name: "Strategy Partners",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "React Specialists",
    industry: "Tecnologia",
    size: "startup",
    location: "São Paulo, SP",
  },
  {
    name: "Next.js Experts",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "Node.js Solutions",
    industry: "Tecnologia",
    size: "medium",
    location: "Rio de Janeiro, RJ",
  },
  {
    name: "Python Power",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "Java Enterprise",
    industry: "Tecnologia",
    size: "large",
    location: "São Paulo, SP",
  },
  {
    name: "DevOps Cloud",
    industry: "Tecnologia",
    size: "medium",
    location: "Belo Horizonte, MG",
  },
  {
    name: "Mobile Dev Studio",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
  {
    name: "QA Automation",
    industry: "Tecnologia",
    size: "startup",
    location: "São Paulo, SP",
  },
  {
    name: "Infrastructure Team",
    industry: "Tecnologia",
    size: "medium",
    location: "São Paulo, SP",
  },
  {
    name: "Agile Consulting",
    industry: "Tecnologia",
    size: "small",
    location: "São Paulo, SP",
  },
];

const jobTitles = [
  "Desenvolvedor Front-end",
  "Desenvolvedor Back-end",
  "Desenvolvedor Full Stack",
  "Desenvolvedor React",
  "Desenvolvedor Next.js",
  "Desenvolvedor Node.js",
  "Desenvolvedor Python",
  "Desenvolvedor Java",
  "Desenvolvedor .NET",
  "Desenvolvedor Mobile",
  "Desenvolvedor Flutter",
  "Desenvolvedor React Native",
  "Arquiteto de Software",
  "Engenheiro de Dados",
  "Cientista de Dados",
  "Desenvolvedor DevOps",
  "Especialista em Cloud",
  "Analista de Sistemas",
  "Product Manager",
  "Scrum Master",
  "QA Engineer",
  "UI/UX Designer",
  "Designer Gráfico",
  "Web Designer",
  "Gerente de Projetos",
  "Analista de Negócios",
  "Engenheiro de Machine Learning",
  "Especialista em Segurança",
  "Analista de Marketing Digital",
  "Content Manager",
  "Gerente de TI",
  "Suporte Técnico",
  "Analista de Banco de Dados",
  "Desenvolvedor Salesforce",
  "Especialista em E-commerce",
  "Product Owner",
  "Tech Lead",
  "CTO",
  "Desenvolvedor Angular",
  "Desenvolvedor Vue.js",
];

const skills = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "C#",
  ".NET",
  "Angular",
  "Vue.js",
  "Flutter",
  "React Native",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "GraphQL",
  "REST API",
  "Git",
  "CI/CD",
  "Jenkins",
  "Terraform",
  "Ansible",
  "Linux",
  "Microservices",
  "Scrum",
  "Agile",
  "Jira",
  "Figma",
  "Adobe XD",
  "Photoshop",
  "Illustrator",
  "SEO",
  "Google Analytics",
  "Marketing Digital",
  "Machine Learning",
  "Deep Learning",
  "TensorFlow",
  "PyTorch",
  "Data Science",
  "Power BI",
  "Tableau",
  "Salesforce",
  "Shopify",
  "WordPress",
  "Magento",
];

const locations = [
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Curitiba, PR",
  "Porto Alegre, RS",
  "Brasília, DF",
  "Salvador, BA",
  "Recife, PE",
  "Fortaleza, CE",
  "Manaus, AM",
  "Campinas, SP",
  "Florianópolis, SC",
  "Vitória, ES",
  "Goiânia, GO",
  "Santos, SP",
  "Remoto",
  "Híbrido - São Paulo",
  "Híbrido - Rio de Janeiro",
];

const descriptions = [
  "Estamos buscando um profissional talentoso para integrar nosso time de desenvolvimento. Oportunidade de trabalhar em projetos inovadores e desafiadores.",
  "Vaga para profissional experiente em desenvolvimento de software. Ambiente colaborativo e oportunidades de crescimento.",
  "Empresa em crescimento busca desenvolvedor para atuar em projetos de grande impacto. Trabalho remoto disponível.",
  "Oportunidade única para trabalhar com tecnologias de ponta em uma equipe multicultural e inovadora.",
  "Buscamos profissional comprometido para integrar nosso time de tecnologia. Excelente ambiente de trabalho e benefícios.",
];

const requirementsList = [
  ["Experiência comprovada", "Conhecimento sólido", "Boa comunicação"],
  [
    "3+ anos de experiência",
    "Graduação em área relacionada",
    "Inglês intermediário",
  ],
  [
    "Conhecimento em metodologias ágeis",
    "Experiência com versionamento",
    "Capacidade de trabalhar em equipe",
  ],
  ["Portfólio relevante", "Disponibilidade imediata", "Vontade de aprender"],
];

const benefitsList = [
  ["Vale refeição", "Vale transporte", "Plano de saúde"],
  ["Trabalho remoto", "Horário flexível", "Auxílio home office"],
  ["Participação nos lucros", "Vale alimentação", "Gympass"],
  ["Bônus semestral", "Programa de capacitação", "Ambiente descontraído"],
];

function getRandomArray(array: any[], min = 1, max = 3) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return array.sort(() => 0.5 - Math.random()).slice(0, count);
}

// Função para mapear título da vaga para categoria normalizada (4 categorias principais)
function getCategoryFromTitle(title: string): string {
  const normalizedTitle = title.toLowerCase();

  // Front-end
  if (
    normalizedTitle.includes("front-end") ||
    normalizedTitle.includes("frontend") ||
    normalizedTitle.includes("react") ||
    normalizedTitle.includes("vue") ||
    normalizedTitle.includes("angular") ||
    normalizedTitle.includes("ui/ux") ||
    normalizedTitle.includes("ui ") ||
    normalizedTitle.includes("ux ") ||
    normalizedTitle.includes("designer") ||
    normalizedTitle.includes("web designer")
  ) {
    return "Desenvolvedor Front-end";
  }

  // Back-end (inclui Analista de Negócio e outros)
  if (
    normalizedTitle.includes("back-end") ||
    normalizedTitle.includes("backend") ||
    normalizedTitle.includes("node") ||
    normalizedTitle.includes("python") ||
    normalizedTitle.includes("java") ||
    normalizedTitle.includes(".net") ||
    normalizedTitle.includes("c#") ||
    normalizedTitle.includes("analista") ||
    normalizedTitle.includes("negócio") ||
    normalizedTitle.includes("negocio") ||
    normalizedTitle.includes("business") ||
    normalizedTitle.includes("arquiteto") ||
    normalizedTitle.includes("engenheiro de dados") ||
    normalizedTitle.includes("cientista de dados") ||
    normalizedTitle.includes("dados")
  ) {
    return "Desenvolvedor Back-end";
  }

  // Full Stack
  if (
    normalizedTitle.includes("full stack") ||
    normalizedTitle.includes("fullstack") ||
    normalizedTitle.includes("full-stack")
  ) {
    return "Desenvolvedor Full Stack";
  }

  // DevOps
  if (
    normalizedTitle.includes("devops") ||
    normalizedTitle.includes("dev-ops") ||
    normalizedTitle.includes("cloud") ||
    normalizedTitle.includes("infrastructure") ||
    normalizedTitle.includes("sre") ||
    normalizedTitle.includes("especialista em cloud") ||
    normalizedTitle.includes("infraestrutura")
  ) {
    return "Desenvolvedor DevOps";
  }

  // Default: se não houver match, atribuir aleatoriamente a uma das 4 categorias
  const categories = [
    "Desenvolvedor Back-end",
    "Desenvolvedor Front-end",
    "Desenvolvedor Full Stack",
    "Desenvolvedor DevOps",
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Função para gerar data aleatória nos últimos 6 meses
function getRandomDateLast6Months(): Date {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  
  // Distribuir uniformemente nos últimos 6 meses (com leve preferência por meses mais recentes)
  const daysDiff = Math.floor((now.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
  // Usar distribuição exponencial invertida para favorecer meses recentes
  const randomDays = Math.floor(Math.random() * Math.random() * daysDiff);
  const randomDate = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  
  return randomDate;
}

// Função para confirmação interativa
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      // Default é 's' (sim) se Enter for pressionado ou resposta vazia
      resolve(normalized === "" || normalized === "s" || normalized === "sim" || normalized === "y" || normalized === "yes");
    });
  });
}

const jobTypesList = [
  "full-time",
  "part-time",
  "contract",
  "internship",
] as const;
const levelsList = ["junior", "mid", "senior", "lead", "executive"] as const;

type Level = (typeof levelsList)[number];

function generateSalaryRange(level: Level) {
  const base = vacancyLevelSalaryBands[level] ?? { min: 5000, max: 10000 };
  if (Math.random() <= 0.3) {
    return undefined;
  }

  // Garantir que os valores fiquem dentro da faixa permitida
  const range = base.max - base.min;

  // Se a faixa for muito pequena (menos de 1000), usar os valores base
  if (range < 1000) {
    return {
      min: base.min,
      max: base.max,
      currency: "BRL",
    } as const;
  }

  // Calcular min: entre base.min e base.max - 1000 (garantindo espaço para max)
  const minRange = Math.max(0, range - 1000);
  const minOffset = Math.floor(Math.random() * (minRange + 1));
  const min = base.min + minOffset;

  // Calcular max: entre min + 1000 e base.max
  const maxMin = min + 1000;

  // Se maxMin ultrapassar base.max, ajustar
  if (maxMin > base.max) {
    // Usar valores base se não houver espaço suficiente
    return {
      min: base.min,
      max: base.max,
      currency: "BRL",
    } as const;
  }

  const maxRange = Math.max(0, base.max - maxMin);
  const maxOffset = Math.floor(Math.random() * (maxRange + 1));
  const max = maxMin + maxOffset;

  // Validação final: garantir que está dentro dos limites
  const finalMin = Math.max(base.min, Math.min(min, base.max - 100));
  const finalMax = Math.min(base.max, Math.max(max, finalMin + 100));

  return {
    min: finalMin,
    max: finalMax,
    currency: "BRL",
  } as const;
}

// Função para gerar nomes aleatórios
const firstNames = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Juliana", "Fernando", "Patricia",
  "Ricardo", "Camila", "Lucas", "Mariana", "Rafael", "Beatriz", "Thiago", "Gabriela",
  "Bruno", "Larissa", "Felipe", "Isabela", "Gustavo", "Amanda", "Rodrigo", "Carolina",
  "André", "Renata", "Marcos", "Vanessa", "Paulo", "Tatiana", "Daniel", "Priscila",
  "Eduardo", "Fernanda", "Roberto", "Juliana", "Vinicius", "Natália", "Diego", "Bianca"
];

const lastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
  "Lima", "Gomes", "Ribeiro", "Carvalho", "Almeida", "Martins", "Lopes", "Soares",
  "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Monteiro", "Mendes", "Freitas",
  "Cardoso", "Araújo", "Costa", "Nunes", "Moraes", "Teixeira", "Ramos", "Machado"
];

function generateRandomName(): { firstName: string; lastName: string; fullName: string } {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`
  };
}

// Função para calcular dígitos verificadores do CNPJ
function calculateCNPJDigits(base: string): string {
  // Remove formatação se houver
  const digits = base.replace(/\D/g, "");
  
  if (digits.length !== 12) {
    throw new Error("Base do CNPJ deve ter 12 dígitos");
  }

  // Pesos para o primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  // Calcular primeiro dígito
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  // Pesos para o segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  // Calcular segundo dígito (incluindo o primeiro dígito verificador)
  sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  sum += digit1 * weights2[12];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return `${digit1}${digit2}`;
}

// Função para formatar CNPJ
function formatCNPJ(digits: string): string {
  // Remove formatação se houver
  const cleanDigits = digits.replace(/\D/g, "");
  
  if (cleanDigits.length !== 14) {
    throw new Error("CNPJ deve ter 14 dígitos");
  }

  // Formato: XX.XXX.XXX/XXXX-XX
  return `${cleanDigits.slice(0, 2)}.${cleanDigits.slice(2, 5)}.${cleanDigits.slice(5, 8)}/${cleanDigits.slice(8, 12)}-${cleanDigits.slice(12, 14)}`;
}

// Função para gerar CNPJ válido e único
async function generateUniqueCNPJ(
  usedCnpjs: Set<string>,
  maxAttempts: number = 10000
): Promise<string> {
  let attempts = 0;
  let sequentialCounter = Date.now() % 100000000; // Usar timestamp como base inicial

  while (attempts < maxAttempts) {
    // Gerar 8 dígitos da raiz (00000001 a 99999999)
    const root = Math.floor(Math.random() * 99999999) + 1;
    const rootStr = root.toString().padStart(8, "0");

    // Gerar 4 dígitos da filial (preferencialmente 0001 para matriz)
    const branch = Math.random() > 0.3 ? "0001" : Math.floor(Math.random() * 9999 + 1).toString().padStart(4, "0");

    // Combinar raiz + filial (12 dígitos)
    const base = rootStr + branch;

    // Calcular dígitos verificadores
    const verificationDigits = calculateCNPJDigits(base);

    // Combinar todos os dígitos (14 dígitos)
    const fullCnpj = base + verificationDigits;

    // Formatar CNPJ
    const formattedCnpj = formatCNPJ(fullCnpj);

    // Verificar se já existe
    if (!usedCnpjs.has(formattedCnpj)) {
      usedCnpjs.add(formattedCnpj);
      return formattedCnpj;
    }

    attempts++;
    
    // Se muitas tentativas, usar contador sequencial como fallback
    if (attempts > maxAttempts * 0.8) {
      const rootSequential = (sequentialCounter % 99999999 + 1).toString().padStart(8, "0");
      const baseSequential = rootSequential + "0001";
      const verificationDigitsSequential = calculateCNPJDigits(baseSequential);
      const fullCnpjSequential = baseSequential + verificationDigitsSequential;
      const formattedCnpjSequential = formatCNPJ(fullCnpjSequential);
      
      if (!usedCnpjs.has(formattedCnpjSequential)) {
        usedCnpjs.add(formattedCnpjSequential);
        sequentialCounter++;
        return formattedCnpjSequential;
      }
      sequentialCounter++;
    }
  }

  // Se ainda não encontrou, usar contador sequencial puro
  let fallbackCounter = Date.now() % 100000000;
  while (attempts < maxAttempts * 2) {
    const rootFallback = (fallbackCounter % 99999999 + 1).toString().padStart(8, "0");
    const baseFallback = rootFallback + "0001";
    const verificationDigitsFallback = calculateCNPJDigits(baseFallback);
    const fullCnpjFallback = baseFallback + verificationDigitsFallback;
    const formattedCnpjFallback = formatCNPJ(fullCnpjFallback);
    
    if (!usedCnpjs.has(formattedCnpjFallback)) {
      usedCnpjs.add(formattedCnpjFallback);
      return formattedCnpjFallback;
    }
    fallbackCounter++;
    attempts++;
  }

  throw new Error(`Não foi possível gerar um CNPJ único após ${maxAttempts * 2} tentativas`);
}

// Função para gerar empresas em lotes
async function generateCompanies(
  count: number,
  adminUserId: mongoose.Types.ObjectId | null
): Promise<mongoose.HydratedDocument<ICompany>[]> {
  console.log(`\nCriando ${count.toLocaleString()} empresas...`);
  const batchSize = 1000;
  const companies: mongoose.HydratedDocument<ICompany>[] = [];
  let totalCreated = 0;

  const industries = [
    "Tecnologia",
    "Fintech",
    "E-commerce",
    "Saúde",
    "Educação",
    "Consultoria",
    "Marketing Digital",
    "Gaming",
    "Mobilidade",
    "Agronegócio",
  ];

  const sizes: Array<"startup" | "small" | "medium" | "large" | "enterprise"> = [
    "startup",
    "small",
    "medium",
    "large",
    "enterprise",
  ];

  const companyNamePrefixes = [
    "Tech", "Digital", "Cloud", "Data", "Smart", "Global", "Prime", "Elite",
    "Pro", "Advanced", "Innovation", "Solutions", "Systems", "Services",
    "Group", "Corp", "Labs", "Studio", "Works", "Hub", "Network", "Platform",
  ];

  const companyNameSuffixes = [
    "Brasil", "Solutions", "Tech", "Digital", "Innovation", "Systems",
    "Services", "Group", "Corp", "Labs", "Studio", "Works", "Hub",
    "Network", "Platform", "Consulting", "Partners", "Enterprise",
  ];

  try {
    // Buscar todos os CNPJs existentes do banco uma vez
    const existingCompanies = await Company.find({}).select("cnpj").lean();
    const usedCnpjs = new Set<string>();

    // Adicionar todos os CNPJs existentes ao Set (já formatados)
    for (const company of existingCompanies) {
      if (company.cnpj) {
        usedCnpjs.add(company.cnpj);
      }
    }

    for (let batch = 0; batch < count; batch += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - batch);
      const companiesBatch = [];

      for (let i = 0; i < currentBatchSize; i++) {
        // Gerar nome único
        const prefix = companyNamePrefixes[Math.floor(Math.random() * companyNamePrefixes.length)];
        const suffix = companyNameSuffixes[Math.floor(Math.random() * companyNameSuffixes.length)];
        const number = Math.floor(Math.random() * 9999);
        const companyName = `${prefix} ${suffix} ${number}`;

        // Gerar CNPJ válido e único usando a nova função
        const cnpj = await generateUniqueCNPJ(usedCnpjs);

        const industry = industries[Math.floor(Math.random() * industries.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];

        companiesBatch.push({
          admins: adminUserId ? [adminUserId] : [],
          recruiters: adminUserId ? [adminUserId] : [],
          name: companyName,
          cnpj,
          industry,
          description: `${companyName} é uma empresa líder em ${industry.toLowerCase()}, oferecendo soluções inovadoras para o mercado brasileiro.`,
          size,
          location,
          followersCount: Math.floor(Math.random() * 10000),
          jobsCount: 0,
          isVerified: Math.random() > 0.7,
          benefits: getRandomArray(benefitsList).flat(),
          website: `https://${companyName.toLowerCase().replace(/\s+/g, "")}.com.br`,
        });
      }

      try {
        // Tentar inserir em lote, mas se falhar, inserir uma por uma
        try {
          const createdCompanies = await Company.insertMany(companiesBatch, { ordered: false });
          
          for (const company of createdCompanies) {
            companies.push(company as mongoose.HydratedDocument<ICompany>);
            totalCreated++;
            // Adicionar CNPJ ao set de usados (já está formatado)
            if (company.cnpj) {
              usedCnpjs.add(company.cnpj);
            }
          }

          if (totalCreated % 1000 === 0 || totalCreated === currentBatchSize) {
            console.log(`${totalCreated.toLocaleString()} empresas criadas...`);
          }
        } catch (bulkError: any) {
          // Se inserção em lote falhar, tentar inserir individualmente
          console.log(`Inserção em lote falhou, tentando inserir individualmente...`);
          
          for (const companyData of companiesBatch) {
            try {
              // Verificar se CNPJ já existe antes de inserir
              const existing = await Company.findOne({ cnpj: companyData.cnpj });
              if (existing) {
                // Gerar novo CNPJ válido e único se já existir
                companyData.cnpj = await generateUniqueCNPJ(usedCnpjs);
              }
              
              const company = new Company(companyData);
              await company.save();
              companies.push(company as mongoose.HydratedDocument<ICompany>);
              totalCreated++;
              
              // Adicionar CNPJ ao set de usados (já está formatado)
              if (company.cnpj) {
                usedCnpjs.add(company.cnpj);
              }
            } catch (individualError: any) {
              // Ignorar erros individuais e continuar
              console.error(`Erro ao criar empresa individual:`, individualError.message);
            }
          }
          
          if (totalCreated > 0) {
            console.log(`${totalCreated.toLocaleString()} empresas criadas...`);
          }
        }
      } catch (error: any) {
        console.error(`Erro ao criar lote de empresas (batch ${batch}):`, error.message);
        // Continuar com próximo lote
      }
    }

    console.log(`\nTotal de ${totalCreated.toLocaleString()} empresas criadas com sucesso`);
    return companies;
  } catch (error: any) {
    console.error("Erro geral ao criar empresas:", error.message);
    return companies; // Retornar as que foram criadas
  }
}

// Função para gerar usuários em lotes
async function generateUsers(count: number): Promise<mongoose.Types.ObjectId[]> {
  console.log(`\nCriando ${count.toLocaleString()} usuários...`);
  const batchSize = 1000;
  const userIds: mongoose.Types.ObjectId[] = [];
  const hashedPassword = await bcrypt.hash("123456", 10); // Senha padrão
  let totalCreated = 0;

  try {
    for (let batch = 0; batch < count; batch += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - batch);
      const usersBatch = [];
      const profilesBatch = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const { firstName, lastName, fullName } = generateRandomName();
        const email = `user${batch + i}${Date.now()}${Math.random().toString(36).substring(7)}@example.com`;

        usersBatch.push({
          name: fullName,
          email,
          password: hashedPassword,
          role: "user" as const,
          isRecruiter: false,
          status: "active" as const,
          onboardingCompleted: true,
          isActive: true,
        });
      }

      try {
        const createdUsers = await User.insertMany(usersBatch, { ordered: false });
        
        // Criar perfis para os usuários
        for (let i = 0; i < createdUsers.length; i++) {
          const user = createdUsers[i];
          const userData = usersBatch[i];
          const nameParts = userData.name.split(" ");
          const firstName = nameParts[0] || "Usuario";
          const lastName = nameParts.slice(1).join(" ") || "Teste";
          const slug = await generateUniqueSlugForProfile(firstName, lastName, Profile);
          
          profilesBatch.push({
            userId: user._id,
            firstName,
            lastName,
            slug,
            headline: `Desenvolvedor em busca de oportunidades`,
            location: locations[Math.floor(Math.random() * locations.length)],
            skills: getRandomArray(skills, 3, 6),
          });
        }

        if (profilesBatch.length > 0) {
          const createdProfiles = await Profile.insertMany(profilesBatch, { ordered: false });
          
          // Atualizar usuários com referência ao perfil
          for (let i = 0; i < createdUsers.length; i++) {
            try {
              await User.findByIdAndUpdate(createdUsers[i]._id, {
                profile: createdProfiles[i]._id,
              });
              userIds.push(createdUsers[i]._id);
              totalCreated++;
            } catch (error) {
              console.error(`Erro ao atualizar perfil do usuário ${createdUsers[i]._id}:`, error);
            }
          }
        }

        console.log(`${totalCreated.toLocaleString()} usuários criados...`);
      } catch (error: any) {
        console.error(`Erro ao criar lote de usuários (batch ${batch}):`, error.message);
        // Continuar com próximo lote mesmo se houver erro
      }
    }

    console.log(`\nTotal de ${totalCreated.toLocaleString()} usuários criados com sucesso`);
    return userIds;
  } catch (error: any) {
    console.error("Erro geral ao criar usuários:", error.message);
    return userIds; // Retornar os que foram criados
  }
}

// Função para gerar candidaturas
async function generateApplications(
  users: mongoose.Types.ObjectId[],
  vacancies: mongoose.Types.ObjectId[],
  count: number
): Promise<void> {
  console.log(`\nCriando ${count.toLocaleString()} candidaturas...`);
  
  // Validar se há dados suficientes
  if (!users || users.length === 0) {
    console.error("Erro: Nenhum usuário disponível para criar candidaturas");
    return;
  }
  
  if (!vacancies || vacancies.length === 0) {
    console.error("Erro: Nenhuma vaga disponível para criar candidaturas");
    return;
  }

  const batchSize = 5000;
  const statuses: Array<"pending" | "reviewed" | "accepted" | "rejected"> = [
    "pending",
    "reviewed",
    "accepted",
    "rejected",
  ];
  let totalCreated = 0;

  try {
    for (let batch = 0; batch < count; batch += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - batch);
      const applicationsBatch = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const candidateId = users[Math.floor(Math.random() * users.length)];
        const jobId = vacancies[Math.floor(Math.random() * vacancies.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const appliedAt = new Date(
          Date.now() - Math.floor(Math.random() * 90) * 86400000
        );

        applicationsBatch.push({
          jobId,
          candidateId,
          status,
          appliedAt,
          coverLetter: Math.random() > 0.5 ? "Tenho grande interesse nesta oportunidade..." : undefined,
          reviewedAt: status !== "pending" ? new Date(appliedAt.getTime() + Math.random() * 7 * 86400000) : undefined,
        });
      }

      try {
        await Application.insertMany(applicationsBatch, { ordered: false });
        totalCreated += currentBatchSize;
        console.log(`${totalCreated.toLocaleString()} candidaturas criadas...`);
      } catch (error: any) {
        console.error(`Erro ao criar lote de candidaturas (batch ${batch}):`, error.message);
        // Continuar com próximo lote
      }
    }

    console.log(`\nTotal de ${totalCreated.toLocaleString()} candidaturas criadas com sucesso`);
  } catch (error: any) {
    console.error("Erro geral ao criar candidaturas:", error.message);
  }
}

// Função para gerar posts
async function generatePosts(
  users: mongoose.Types.ObjectId[],
  companies: mongoose.HydratedDocument<ICompany>[],
  count: number
): Promise<void> {
  console.log(`\nCriando ${count.toLocaleString()} posts...`);
  
  // Validar se há dados suficientes
  if (!users || users.length === 0) {
    console.error("Erro: Nenhum usuário disponível para criar posts");
    return;
  }

  const batchSize = 5000;
  const postContents = [
    "Acabei de concluir um projeto incrível! Muito orgulho do resultado.",
    "Dicas para desenvolvedores iniciantes: nunca pare de aprender!",
    "Compartilhando algumas experiências do meu dia a dia como desenvolvedor.",
    "Novas tecnologias estão surgindo constantemente. É importante se manter atualizado.",
    "Trabalho em equipe é fundamental para o sucesso de qualquer projeto.",
    "Estou procurando novas oportunidades na área de desenvolvimento.",
    "Agradeço a todos que me ajudaram neste projeto desafiador.",
    "Dia produtivo! Consegui resolver vários problemas complexos hoje.",
  ];
  let totalCreated = 0;

  try {
    for (let batch = 0; batch < count; batch += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - batch);
      const postsBatch = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const isCompanyPost = Math.random() > 0.7;
        let authorId: mongoose.Types.ObjectId;
        
        if (isCompanyPost && companies && companies.length > 0) {
          const company = companies[Math.floor(Math.random() * companies.length)];
          authorId = (company.admins && company.admins.length > 0)
            ? company.admins[0]
            : users[Math.floor(Math.random() * users.length)];
        } else {
          authorId = users[Math.floor(Math.random() * users.length)];
        }

        postsBatch.push({
          authorId,
          content: postContents[Math.floor(Math.random() * postContents.length)],
          likes: [],
          commentsCount: Math.floor(Math.random() * 50),
          sharesCount: Math.floor(Math.random() * 20),
          isJobPost: false,
          hashtags: getRandomArray(["tech", "dev", "programming", "coding", "career"], 1, 3),
          mentions: [],
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 180) * 86400000
          ),
        });
      }

      try {
        await Post.insertMany(postsBatch, { ordered: false });
        totalCreated += currentBatchSize;
        console.log(`${totalCreated.toLocaleString()} posts criados...`);
      } catch (error: any) {
        console.error(`Erro ao criar lote de posts (batch ${batch}):`, error.message);
        // Continuar com próximo lote
      }
    }

    console.log(`\nTotal de ${totalCreated.toLocaleString()} posts criados com sucesso`);
  } catch (error: any) {
    console.error("Erro geral ao criar posts:", error.message);
  }
}


async function seedDatabase() {
  try {
    console.log("Conectando ao MongoDB...");
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI não encontrada nas variáveis de ambiente");
    }

    await mongoose.connect(mongoUri);
    console.log("Conectado ao MongoDB");

    // Buscar ou criar empresas
    console.log("Verificando empresas existentes...");
    const companies: mongoose.HydratedDocument<ICompany>[] = [];
    const adminUser = (await User.findOne({ isRecruiter: true })
      .select("_id")
      .lean()) as { _id: mongoose.Types.ObjectId } | null;

    // Buscar empresas existentes
    const existingCompanies = await Company.find({}).lean();
    const existingCompanyNames = new Set(
      existingCompanies.map((c) => c.name.toLowerCase())
    );

    let newCompaniesCount = 0;
    let reusedCompaniesCount = 0;

    for (const companyData of companiesData) {
      const existingCompany = existingCompanies.find(
        (c) => c.name.toLowerCase() === companyData.name.toLowerCase()
      );

      if (existingCompany) {
        // Reutilizar empresa existente
        const companyDoc = await Company.findById(existingCompany._id);
        if (companyDoc) {
          companies.push(companyDoc);
          reusedCompaniesCount++;
          console.log(`Empresa reutilizada: ${companyDoc.name}`);
        }
      } else {
        // Criar nova empresa
        const usedCnpjs = new Set<string>(
          existingCompanies
            .map((c) => c.cnpj)
            .filter(Boolean)
        );
        const cnpj = await generateUniqueCNPJ(usedCnpjs);

        const companyDoc = new Company({
          admins: adminUser ? [adminUser._id] : [],
          recruiters: adminUser ? [adminUser._id] : [],
          name: companyData.name,
          cnpj,
          industry: companyData.industry,
          description: `${companyData.name} é uma empresa líder em tecnologia, oferecendo soluções inovadoras para o mercado brasileiro.`,
          size: companyData.size,
          location: companyData.location,
          followersCount: Math.floor(Math.random() * 10000),
          jobsCount: 0,
          isVerified: Math.random() > 0.5,
          benefits: getRandomArray(benefitsList).flat(),
          website: `https://${companyData.name
            .toLowerCase()
            .replace(/\s+/g, "")}.com.br`,
        });

        await companyDoc.save();
        companies.push(companyDoc as mongoose.HydratedDocument<ICompany>);
        newCompaniesCount++;
        console.log(`Empresa criada: ${companyDoc.name}`);
      }
    }

    console.log(
      `\n${companies.length} empresas disponíveis (${newCompaniesCount} novas, ${reusedCompaniesCount} reutilizadas)`
    );

    // Criar empresas adicionais em massa
    const companiesToCreate = 10000;
    const shouldCreateCompanies = await askConfirmation(
      `Você quer criar ${companiesToCreate.toLocaleString()} empresas adicionais? (s/n)`
    );

    if (!shouldCreateCompanies) {
      console.log("Criação de empresas adicionais pulada.");
    } else {
      const additionalCompanies = await generateCompanies(
        companiesToCreate,
        adminUser?._id ?? null
      );
      companies.push(...additionalCompanies);
      console.log(`\nTotal de ${companies.length.toLocaleString()} empresas disponíveis agora`);
    }

    // Criar vagas (collection vacancies)
    console.log("\nCriando vagas (collection vacancies)...");

    // Verificar quantas vagas já existem
    const existingVacanciesCount = await Vacancy.countDocuments({
      status: "published",
    });
    console.log(`Vagas existentes no banco: ${existingVacanciesCount}`);

    // Criar 200.000 vagas usando bulk inserts
    const vacanciesToCreate = 200000;
    let vacancyCount = 0;
    const shouldCreateVacancies = await askConfirmation(
      `Você quer criar ${vacanciesToCreate.toLocaleString()} vagas? (s/n)`
    );

    if (!shouldCreateVacancies) {
      console.log("Criação de vagas pulada.");
    } else {
      console.log(`\nCriando ${vacanciesToCreate.toLocaleString()} vagas...`);
      const batchSize = 5000; // Processar em lotes de 5000

      try {
        for (let batch = 0; batch < vacanciesToCreate; batch += batchSize) {
          const currentBatchSize = Math.min(batchSize, vacanciesToCreate - batch);
          const vacanciesBatch = [];

          for (let i = 0; i < currentBatchSize; i++) {
            const company = companies[Math.floor(Math.random() * companies.length)];
            const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
            const level = levelsList[Math.floor(Math.random() * levelsList.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            const isRemote = location === "Remoto" || location.includes("Híbrido");
            const jobSkills = getRandomArray(skills, 3, 8);
            const category = getCategoryFromTitle(title);

            vacanciesBatch.push({
              companyId: company._id,
              postedBy: adminUser?._id ?? null,
              title,
              description:
                descriptions[Math.floor(Math.random() * descriptions.length)],
              requirements: getRandomArray(
                requirementsList[
                  Math.floor(Math.random() * requirementsList.length)
                ],
                2,
                5
              ),
              responsibilities: [],
              benefits: getRandomArray(
                benefitsList[Math.floor(Math.random() * benefitsList.length)],
                2,
                4
              ),
              skills: jobSkills,
              location,
              remote: isRemote,
              type: jobTypesList[Math.floor(Math.random() * jobTypesList.length)],
              level,
              category,
              salaryRange: generateSalaryRange(level),
              tags: [category, ...jobSkills.slice(0, 2)],
              status: "published",
              publishedAt: getRandomDateLast6Months(),
              applicationsCount: Math.floor(Math.random() * 50),
              viewsCount: Math.floor(Math.random() * 500),
            });
          }

          try {
            await Vacancy.insertMany(vacanciesBatch, { ordered: false });
            vacancyCount += currentBatchSize;
            console.log(`${vacancyCount.toLocaleString()} vagas criadas...`);
          } catch (error: any) {
            console.error(`Erro ao criar lote de vagas (batch ${batch}):`, error.message);
            // Continuar com próximo lote
          }
        }

        console.log(`\nTotal de ${vacancyCount.toLocaleString()} vagas criadas com sucesso`);
      } catch (error: any) {
        console.error("Erro geral ao criar vagas:", error.message);
      }
    }

    // Atualizar contadores de vagas nas empresas
    console.log("Atualizando contadores de vagas por empresa...");
    const counts = await Vacancy.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      { $match: { status: "published" } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]);

    for (const company of companies) {
      const current = counts.find((item) => item._id.equals(company._id));
      await Company.findByIdAndUpdate(company._id, {
        jobsCount: current?.count ?? 0,
      });
    }

    const totalVacancies = await Vacancy.countDocuments({
      status: "published",
    });

    console.log(`\n${vacancyCount.toLocaleString()} novas vagas criadas nesta execução`);
    console.log(`Total de vagas no banco: ${totalVacancies.toLocaleString()}`);

    // Buscar IDs de todas as vagas criadas
    const allVacancies = await Vacancy.find({ status: "published" })
      .select("_id")
      .lean();
    const vacancyIds = allVacancies.map((v) => v._id);

    // Criar 10.000 usuários
    const usersToCreate = 10000;
    const shouldCreateUsers = await askConfirmation(
      `Você quer criar ${usersToCreate.toLocaleString()} usuários? (s/n)`
    );

    let userIds: mongoose.Types.ObjectId[] = [];
    if (!shouldCreateUsers) {
      console.log("Criação de usuários pulada.");
    } else {
      userIds = await generateUsers(usersToCreate);
    }

    // Criar 10.000 candidaturas
    const applicationsToCreate = 10000;
    const shouldCreateApplications = await askConfirmation(
      `Você quer criar ${applicationsToCreate.toLocaleString()} candidaturas? (s/n)`
    );

    if (!shouldCreateApplications) {
      console.log("Criação de candidaturas pulada.");
    } else {
      if (userIds.length === 0 || vacancyIds.length === 0) {
        console.error("Erro: É necessário ter usuários e vagas para criar candidaturas");
      } else {
        await generateApplications(userIds, vacancyIds, applicationsToCreate);
      }
    }

    // Criar 10.000 posts
    const postsToCreate = 10000;
    const shouldCreatePosts = await askConfirmation(
      `Você quer criar ${postsToCreate.toLocaleString()} posts? (s/n)`
    );

    if (!shouldCreatePosts) {
      console.log("Criação de posts pulada.");
    } else {
      if (userIds.length === 0) {
        console.error("Erro: É necessário ter usuários para criar posts");
      } else {
        await generatePosts(userIds, companies, postsToCreate);
      }
    }

    console.log("\n✅ Seed concluído com sucesso!");
    console.log(`\nResumo:`);
    console.log(`- Vagas: ${totalVacancies.toLocaleString()}`);
    console.log(`- Usuários: ${userIds.length.toLocaleString()}`);
    console.log(`- Candidaturas: ${applicationsToCreate.toLocaleString()}`);
    console.log(`- Posts: ${postsToCreate.toLocaleString()}`);

    await mongoose.disconnect();
    console.log("\nDesconectado do MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao fazer seed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();
