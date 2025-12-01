const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI não definida");
  process.exit(1);
}

const jobs = [
  {
    title: "Desenvolvedor Frontend React",
    description:
      "Estamos procurando um desenvolvedor React experiente para se juntar à nossa equipe. Você trabalhará em projetos desafiadores e inovadores.",
    requirements: [
      "Experiência com React.js",
      "Conhecimento em Next.js",
      "Familiaridade com Tailwind CSS",
    ],
    responsibilities: [
      "Desenvolver interfaces de usuário",
      "Colaborar com designers e backend",
      "Otimizar performance",
    ],
    location: "São Paulo, SP",
    remote: true,
    type: "full-time",
    level: "mid",
    category: "Tecnologia",
    skills: ["React", "JavaScript", "TypeScript", "Next.js", "Git"],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Designer UI/UX Senior",
    description:
      "Buscamos um designer criativo para liderar nossos projetos de design de produto. Domínio de ferramentas como Figma e Adobe Suite é essencial.",
    requirements: [
      "Portfólio forte",
      "Experiência com Figma",
      "Conhecimento em Design Systems",
    ],
    responsibilities: [
      "Criar protótipos de alta fidelidade",
      "Realizar pesquisas com usuários",
      "Definir diretrizes visuais",
    ],
    location: "Rio de Janeiro, RJ",
    remote: true,
    type: "contract",
    level: "senior",
    category: "Design",
    skills: ["Figma", "Photoshop", "Illustrator", "UI Design", "UX Research"],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Engenheiro de Software Backend",
    description:
      "Vaga para desenvolvedor backend com foco em Node.js e arquitetura de microsserviços.",
    requirements: [
      "Node.js avançado",
      "Experiência com MongoDB",
      "Conhecimento em Docker",
    ],
    responsibilities: [
      "Desenvolver APIs RESTful",
      "Gerenciar bancos de dados",
      "Garantir escalabilidade",
    ],
    location: "Belo Horizonte, MG",
    remote: false,
    type: "full-time",
    level: "senior",
    category: "Engenharia",
    skills: ["Node.js", "MongoDB", "Docker", "AWS", "API REST"],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Analista de Marketing Digital",
    description:
      "Procuramos um profissional para gerenciar nossas campanhas de marketing e redes sociais.",
    requirements: [
      "Experiência com Google Ads",
      "Conhecimento em SEO",
      "Habilidade com Analytics",
    ],
    responsibilities: [
      "Criar campanhas de anúncios",
      "Monitorar métricas",
      "Produzir conteúdo",
    ],
    location: "Curitiba, PR",
    remote: true,
    type: "full-time",
    level: "junior",
    category: "Marketing",
    skills: [
      "Marketing Digital",
      "SEO",
      "Google Analytics",
      "Social Media",
      "Copywriting",
    ],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Desenvolvedor Fullstack Junior",
    description:
      "Oportunidade para iniciantes com vontade de aprender. Trabalhe com React e Node.js.",
    requirements: [
      "Lógica de programação",
      "Básico de React",
      "Vontade de aprender",
    ],
    responsibilities: [
      "Auxiliar no desenvolvimento de features",
      "Corrigir bugs",
      "Aprender novas tecnologias",
    ],
    location: "Remoto",
    remote: true,
    type: "internship",
    level: "junior",
    category: "Tecnologia",
    skills: ["JavaScript", "HTML", "CSS", "React", "Git"],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedJobs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB");

    // Buscar uma empresa existente para associar as vagas
    // Como não temos o model Company aqui, vamos buscar na coleção companies diretamente
    const company = await mongoose.connection.db
      .collection("companies")
      .findOne({});

    if (!company) {
      console.error(
        "Nenhuma empresa encontrada para associar as vagas. Crie uma empresa primeiro."
      );
      // Tentar buscar um usuário para usar como companyId temporariamente se não houver empresas
      // (Isso é apenas para teste, idealmente deve ser uma empresa)
      const user = await mongoose.connection.db.collection("users").findOne({});
      if (!user) {
        console.error("Nenhum usuário encontrado também.");
        process.exit(1);
      }
      console.log(`Usando usuário ${user._id} como companyId para teste`);

      const jobsWithCompany = jobs.map((job) => ({
        ...job,
        companyId: user._id,
      }));

      await mongoose.connection.db
        .collection("jobs")
        .insertMany(jobsWithCompany);
    } else {
      console.log(
        `Associando vagas à empresa: ${company.name} (${company._id})`
      );

      const jobsWithCompany = jobs.map((job) => ({
        ...job,
        companyId: company._id,
      }));

      await mongoose.connection.db
        .collection("jobs")
        .insertMany(jobsWithCompany);
    }

    console.log(`${jobs.length} vagas criadas com sucesso!`);
  } catch (error) {
    console.error("Erro ao criar vagas:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedJobs();
