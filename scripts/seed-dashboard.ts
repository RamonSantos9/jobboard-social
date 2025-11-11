import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import Company, { type ICompany } from "../models/Company";
import Vacancy, { vacancyLevelSalaryBands } from "../models/Vacancy";
import User from "../models/User";
import Post from "../models/Post";
import Application from "../models/Application";
import Profile from "../models/Profile";
import { generateUniqueSlugForProfile } from "../lib/slug";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Dados fictícios para empresas
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
  "Arquiteto de Software",
  "Engenheiro de Dados",
];

const skills = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "MongoDB",
  "PostgreSQL",
  "AWS",
];

const locations = [
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Curitiba, PR",
  "Remoto",
  "Híbrido - São Paulo",
];

const descriptions = [
  "Estamos buscando um profissional talentoso para integrar nosso time de desenvolvimento. Oportunidade de trabalhar em projetos inovadores e desafiadores.",
  "Vaga para profissional experiente em desenvolvimento de software. Ambiente colaborativo e oportunidades de crescimento.",
  "Empresa em crescimento busca desenvolvedor para atuar em projetos de grande impacto. Trabalho remoto disponível.",
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
];

const benefitsList = [
  ["Vale refeição", "Vale transporte", "Plano de saúde"],
  ["Trabalho remoto", "Horário flexível", "Auxílio home office"],
  ["Participação nos lucros", "Vale alimentação", "Gympass"],
];

function getRandomArray(array: any[], min = 1, max = 3) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return array.sort(() => 0.5 - Math.random()).slice(0, count);
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

  const range = base.max - base.min;
  if (range < 1000) {
    return {
      min: base.min,
      max: base.max,
      currency: "BRL",
    } as const;
  }

  const minRange = Math.max(0, range - 1000);
  const minOffset = Math.floor(Math.random() * (minRange + 1));
  const min = base.min + minOffset;

  const maxMin = min + 1000;
  if (maxMin > base.max) {
    return {
      min: base.min,
      max: base.max,
      currency: "BRL",
    } as const;
  }

  const maxRange = Math.max(0, base.max - maxMin);
  const maxOffset = Math.floor(Math.random() * (maxRange + 1));
  const max = maxMin + maxOffset;

  const finalMin = Math.max(base.min, Math.min(min, base.max - 100));
  const finalMax = Math.min(base.max, Math.max(max, finalMin + 100));

  return {
    min: finalMin,
    max: finalMax,
    currency: "BRL",
  } as const;
}

async function ensureUniqueCnpj(
  name: string,
  used: Set<string>
): Promise<string> {
  let cnpjSuffix: string;
  const base = "00.000.000/0001-";
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    cnpjSuffix = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error(
        `Não foi possível gerar um CNPJ único após ${maxAttempts} tentativas`
      );
    }
  } while (
    used.has(cnpjSuffix) ||
    (await Company.exists({ cnpj: `${base}${cnpjSuffix}` }))
  );

  used.add(cnpjSuffix);
  return `${base}${cnpjSuffix}`;
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

    // Verificar se já existe um usuário admin
    let adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      console.log("Criando usuário admin...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      adminUser = new User({
        name: "Administrador",
        email: "admin@jobboard.com",
        password: hashedPassword,
        role: "admin",
        isRecruiter: true,
        isActive: true,
        onboardingCompleted: true,
      });
      await adminUser.save();
      console.log("Usuário admin criado: admin@jobboard.com / admin123");
    }

    // Verificar se já existe um perfil para o admin
    let adminProfile = await Profile.findOne({ userId: adminUser._id });
    if (!adminProfile) {
      const adminSlug = await generateUniqueSlugForProfile(
        "Administrador",
        "Sistema",
        Profile
      );
      adminProfile = new Profile({
        userId: adminUser._id,
        firstName: "Administrador",
        lastName: "Sistema",
        slug: adminSlug,
        headline: "Administrador do JobBoard Social",
      });
      await adminProfile.save();
      console.log("Perfil do admin criado");
    }

    // Buscar ou criar empresas
    console.log("\nVerificando empresas existentes...");
    const companies: mongoose.HydratedDocument<ICompany>[] = [];
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
        const companyDoc = await Company.findById(existingCompany._id);
        if (companyDoc) {
          companies.push(companyDoc);
          reusedCompaniesCount++;
          console.log(`Empresa reutilizada: ${companyDoc.name}`);
        }
      } else {
        const usedCnpjs = new Set<string>(
          existingCompanies
            .map((c) => {
              const parts = c.cnpj.split("-");
              return parts.length > 1 ? parts[1] : "";
            })
            .filter(Boolean)
        );
        const cnpj = await ensureUniqueCnpj(companyData.name, usedCnpjs);

        const companyDoc = new Company({
          admins: [adminUser._id],
          recruiters: [adminUser._id],
          name: companyData.name,
          cnpj,
          industry: companyData.industry,
          description: `${companyData.name} é uma empresa líder em tecnologia, oferecendo soluções inovadoras para o mercado brasileiro.`,
          size: companyData.size,
          location: companyData.location,
          followersCount: Math.floor(Math.random() * 1000),
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

    // Verificar quantas vagas já existem
    const existingVacanciesCount = await Vacancy.countDocuments({
      status: "published",
    });
    console.log(`\nVagas existentes no banco: ${existingVacanciesCount}`);

    // Criar vagas se não existirem suficientes (mínimo 50)
    if (existingVacanciesCount < 50) {
      console.log("\nCriando vagas...");
      const vacanciesToCreate = 50 - existingVacanciesCount;
      let vacancyCount = 0;

      while (vacancyCount < vacanciesToCreate) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        const level = levelsList[Math.floor(Math.random() * levelsList.length)];
        const location =
          locations[Math.floor(Math.random() * locations.length)];
        const isRemote = location === "Remoto" || location.includes("Híbrido");
        const jobSkills = getRandomArray(skills, 3, 8);

        // Criar data aleatória nos últimos 6 meses
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        await Vacancy.create({
          companyId: company._id,
          postedBy: adminUser._id,
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
          category: company.industry,
          salaryRange: generateSalaryRange(level),
          tags: [company.industry, ...jobSkills.slice(0, 2)],
          status: "published",
          publishedAt: createdAt,
          createdAt,
          applicationsCount: Math.floor(Math.random() * 50),
          viewsCount: Math.floor(Math.random() * 500),
        });

        vacancyCount++;

        if (vacancyCount % 10 === 0) {
          console.log(`${vacancyCount} vagas criadas...`);
        }
      }

      console.log(`${vacancyCount} novas vagas criadas`);
    }

    // Verificar quantos posts já existem
    const existingPostsCount = await Post.countDocuments();
    console.log(`\nPosts existentes no banco: ${existingPostsCount}`);

    // Criar posts se não existirem suficientes (mínimo 20)
    if (existingPostsCount < 20) {
      console.log("\nCriando posts...");
      const postsToCreate = 20 - existingPostsCount;
      const postContents = [
        "Acabei de completar um projeto incrível usando React e Next.js! 🚀",
        "Dicas para desenvolvedores iniciantes: nunca pare de aprender!",
        "Estamos contratando! Venha fazer parte do nosso time de tecnologia.",
        "Compartilhando minha experiência com TypeScript em projetos grandes.",
        "A importância do trabalho em equipe no desenvolvimento de software.",
      ];

      for (let i = 0; i < postsToCreate; i++) {
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        await Post.create({
          authorId: adminUser._id,
          content:
            postContents[Math.floor(Math.random() * postContents.length)],
          hashtags: ["#tecnologia", "#desenvolvimento", "#carreira"],
          createdAt,
        });
      }

      console.log(`${postsToCreate} novos posts criados`);
    }

    // Verificar quantas candidaturas já existem
    const existingApplicationsCount = await Application.countDocuments();
    console.log(
      `\nCandidaturas existentes no banco: ${existingApplicationsCount}`
    );

    // Criar candidaturas se não existirem suficientes (mínimo 30)
    if (existingApplicationsCount < 30) {
      console.log("\nCriando candidaturas...");
      const applicationsToCreate = 30 - existingApplicationsCount;

      // Buscar vagas publicadas
      const publishedVacancies = await Vacancy.find({ status: "published" })
        .limit(20)
        .lean();

      if (publishedVacancies.length > 0) {
        // Criar alguns usuários candidatos se não existirem
        let candidateUsers = await User.find({ role: { $ne: "admin" } })
          .limit(10)
          .lean();

        if (candidateUsers.length < 5) {
          console.log("Criando usuários candidatos...");
          for (let i = candidateUsers.length; i < 5; i++) {
            const hashedPassword = await bcrypt.hash("candidato123", 10);
            const newUser = new User({
              name: `Candidato ${i + 1}`,
              email: `candidato${i + 1}@jobboard.com`,
              password: hashedPassword,
              role: "user",
              isRecruiter: false,
              isActive: true,
              onboardingCompleted: true,
            });
            await newUser.save();

            // Criar perfil
            const candidateSlug = await generateUniqueSlugForProfile(
              "Candidato",
              `${i + 1}`,
              Profile
            );
            await Profile.create({
              userId: newUser._id,
              firstName: `Candidato`,
              lastName: `${i + 1}`,
              slug: candidateSlug,
              headline: "Desenvolvedor em busca de oportunidades",
            });

            candidateUsers.push(newUser.toObject());
            console.log(
              `Usuário candidato criado: candidato${
                i + 1
              }@jobboard.com / candidato123`
            );
          }
        }

        // Buscar usuários candidatos atualizados
        candidateUsers = await User.find({ role: { $ne: "admin" } })
          .limit(10)
          .lean();

        for (
          let i = 0;
          i < applicationsToCreate && i < publishedVacancies.length * 2;
          i++
        ) {
          const vacancy =
            publishedVacancies[
              Math.floor(Math.random() * publishedVacancies.length)
            ];
          const candidate =
            candidateUsers[Math.floor(Math.random() * candidateUsers.length)];

          if (!candidate || !vacancy) {
            console.log(
              `Pulando iteração ${i}: candidate ou vacancy undefined`
            );
            continue;
          }

          if (!candidate._id || !vacancy._id) {
            console.log(`Pulando iteração ${i}: IDs undefined`, {
              candidateId: candidate._id,
              vacancyId: vacancy._id,
            });
            continue;
          }

          // Verificar se já existe candidatura
          const existingApp = await Application.findOne({
            candidateId: candidate._id,
            jobId: vacancy._id,
          });

          if (existingApp) continue;

          const daysAgo = Math.floor(Math.random() * 90);
          const appliedAt = new Date();
          appliedAt.setDate(appliedAt.getDate() - daysAgo);

          const statuses = ["pending", "reviewed", "accepted", "rejected"];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          try {
            // Garantir que os IDs existam
            const jobId = vacancy._id;
            const candidateId = candidate._id;

            if (!jobId || !candidateId) {
              console.error(`IDs inválidos na iteração ${i}:`, {
                jobId: jobId ? jobId.toString() : "undefined",
                candidateId: candidateId ? candidateId.toString() : "undefined",
              });
              continue;
            }

            const applicationData = {
              jobId: jobId,
              candidateId: candidateId,
              status: status,
              coverLetter: `Carta de apresentação para a vaga ${vacancy.title}`,
              appliedAt: appliedAt,
            };

            console.log(`Criando candidatura ${i + 1}:`, {
              jobId: jobId.toString(),
              candidateId: candidateId.toString(),
              status,
            });

            await Application.create(applicationData);
          } catch (error: any) {
            console.error(`Erro ao criar candidatura ${i}:`, error.message);
            console.error("Dados:", {
              jobId: vacancy._id ? vacancy._id.toString() : "undefined",
              candidateId: candidate._id
                ? candidate._id.toString()
                : "undefined",
              status,
            });
            throw error;
          }
        }

        console.log(`${applicationsToCreate} novas candidaturas criadas`);
      }
    }

    // Atualizar contadores de vagas nas empresas
    console.log("\nAtualizando contadores de vagas por empresa...");
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
    const totalPosts = await Post.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalUsers = await User.countDocuments();

    console.log("\n=== Resumo do Seed ===");
    console.log(`Total de usuários: ${totalUsers}`);
    console.log(`Total de empresas: ${totalCompanies}`);
    console.log(`Total de vagas publicadas: ${totalVacancies}`);
    console.log(`Total de posts: ${totalPosts}`);
    console.log(`Total de candidaturas: ${totalApplications}`);
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
