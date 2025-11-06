const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const Company = require("../models/Company").default;
const Job = require("../models/Job").default;
const User = require("../models/User").default;

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

async function seedDatabase() {
  try {
    console.log("Conectando ao MongoDB...");
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI não encontrada nas variáveis de ambiente");
    }

    await mongoose.connect(mongoUri);
    console.log("Conectado ao MongoDB");

    // Criar empresas
    console.log("Criando empresas...");
    const companies = [];
    const adminUser = await User.findOne().lean();

    for (const companyData of companiesData) {
      const company = new Company({
        admins: adminUser ? [adminUser._id] : [],
        name: companyData.name,
        cnpj: `00.000.000/0001-${Math.floor(Math.random() * 99)
          .toString()
          .padStart(2, "0")}`,
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
      await company.save();
      companies.push(company);
      console.log(`Empresa criada: ${company.name}`);
    }

    console.log(`\n${companies.length} empresas criadas`);

    // Criar vagas
    console.log("\nCriando vagas...");
    let jobCount = 0;
    const jobTypesList = ["full-time", "part-time", "contract", "internship"];
    const levelsList = ["junior", "mid", "senior", "lead", "executive"];

    while (jobCount < 500) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
      const jobType =
        jobTypesList[Math.floor(Math.random() * jobTypesList.length)];
      const level = levelsList[Math.floor(Math.random() * levelsList.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const isRemote = location === "Remoto" || location.includes("Híbrido");
      const jobSkills = getRandomArray(skills, 3, 8);

      // Salário baseado no nível
      const baseSalary = {
        junior: { min: 3000, max: 6000 },
        mid: { min: 6000, max: 12000 },
        senior: { min: 12000, max: 20000 },
        lead: { min: 20000, max: 30000 },
        executive: { min: 30000, max: 50000 },
      }[level] || { min: 5000, max: 10000 };

      const salaryRange =
        Math.random() > 0.3
          ? {
              min: baseSalary.min + Math.floor(Math.random() * 1000),
              max: baseSalary.max + Math.floor(Math.random() * 2000),
              currency: "BRL",
            }
          : undefined;

      const job = new Job({
        companyId: company._id,
        title,
        description:
          descriptions[Math.floor(Math.random() * descriptions.length)],
        requirements: getRandomArray(
          requirementsList[Math.floor(Math.random() * requirementsList.length)],
          2,
          5
        ),
        responsibilities: [],
        salaryRange,
        location,
        remote: isRemote,
        type: jobType,
        level,
        category: company.industry,
        skills: jobSkills,
        benefits: getRandomArray(
          benefitsList[Math.floor(Math.random() * benefitsList.length)],
          2,
          4
        ),
        status: "active",
        applicationsCount: Math.floor(Math.random() * 50),
        viewsCount: Math.floor(Math.random() * 500),
      });

      await job.save();
      jobCount++;

      if (jobCount % 50 === 0) {
        console.log(`${jobCount} vagas criadas...`);
      }
    }

    // Atualizar contadores de vagas nas empresas
    for (const company of companies) {
      const jobsCount = await Job.countDocuments({ companyId: company._id });
      await Company.findByIdAndUpdate(company._id, { jobsCount });
    }

    console.log(`\n${jobCount} vagas criadas`);
    console.log("\nSeed concluído com sucesso!");

    await mongoose.disconnect();
    console.log("Desconectado do MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao fazer seed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();
