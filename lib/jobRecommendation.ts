import { IProfile } from "@/models/Profile";
import { IVacancy } from "@/models/Vacancy";

export interface MatchScore {
  total: number;
  breakdown: {
    skills: number;
    location: number;
    level: number;
    sector: number;
  };
}

/**
 * Calcula o score de compatibilidade entre um perfil e uma vaga
 * @param profile Perfil do usuário
 * @param job Vaga a ser avaliada
 * @returns Score de 0 a 100 com breakdown detalhado
 */
export function calculateJobMatchScore(
  profile: Partial<IProfile>,
  job: Partial<IVacancy>
): MatchScore {
  const breakdown = {
    skills: 0,
    location: 0,
    level: 0,
    sector: 0,
  };

  // Skills matching (40% do peso)
  if (profile.skills && profile.skills.length > 0 && job.skills && job.skills.length > 0) {
    const profileSkillsLower = profile.skills.map((s) => s.toLowerCase());
    const jobSkillsLower = job.skills.map((s) => s.toLowerCase());

    const matchingSkills = profileSkillsLower.filter((skill) =>
      jobSkillsLower.some((jobSkill) =>
        jobSkill.includes(skill) || skill.includes(jobSkill)
      )
    );

    const matchPercentage =
      (matchingSkills.length / Math.max(profileSkillsLower.length, jobSkillsLower.length)) * 100;
    breakdown.skills = Math.min(matchPercentage, 100);
  }

  // Location matching (20% do peso)
  if (profile.preferredLocation && job.location) {
    const preferredLower = profile.preferredLocation.toLowerCase();
    const jobLocationLower = job.location.toLowerCase();

    // Remoto match
    if (
      preferredLower.includes("remoto") ||
      preferredLower.includes("remote")
    ) {
      if (job.remote) {
        breakdown.location = 100;
      }
    } else {
      // Match por cidade/estado
      const preferredParts = preferredLower.split(/[,\s]+/);
      const jobParts = jobLocationLower.split(/[,\s]+/);

      const hasMatch = preferredParts.some((part) =>
        jobParts.some((jobPart) => part.includes(jobPart) || jobPart.includes(part))
      );

      if (hasMatch) {
        breakdown.location = 80; // Match parcial
      }
    }
  } else if (profile.location && job.location) {
    // Fallback para location normal
    const profileLocationLower = profile.location.toLowerCase();
    const jobLocationLower = job.location.toLowerCase();

    if (profileLocationLower === jobLocationLower) {
      breakdown.location = 100;
    } else {
      const profileParts = profileLocationLower.split(/[,\s]+/);
      const jobParts = jobLocationLower.split(/[,\s]+/);
      const hasMatch = profileParts.some((part) =>
        jobParts.some((jobPart) => part.includes(jobPart))
      );
      if (hasMatch) {
        breakdown.location = 60;
      }
    }
  }

  // Level matching (20% do peso)
  if (profile.experience && profile.experience.length > 0 && job.level) {
    // Determinar nível do usuário baseado em experiência
    const yearsOfExperience = profile.experience.reduce((total, exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.current ? new Date() : new Date(exp.endDate || Date.now());
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    let userLevel = "junior";
    if (yearsOfExperience >= 5) userLevel = "senior";
    else if (yearsOfExperience >= 2) userLevel = "mid";

    const levelHierarchy: Record<string, number> = {
      junior: 1,
      mid: 2,
      senior: 3,
      lead: 4,
      executive: 5,
    };

    const userLevelNum = levelHierarchy[userLevel] || 1;
    const jobLevelNum = levelHierarchy[job.level] || 3;

    // Score baseado em proximidade (usuário pode estar 1 nível acima ou abaixo)
    const diff = Math.abs(userLevelNum - jobLevelNum);
    if (diff === 0) {
      breakdown.level = 100;
    } else if (diff === 1) {
      breakdown.level = 70;
    } else if (diff === 2) {
      breakdown.level = 40;
    } else {
      breakdown.level = 10;
    }
  }

  // Sector matching (20% do peso)
  if (profile.sector && job.category) {
    const profileSectorLower = profile.sector.toLowerCase();
    const jobCategoryLower = job.category.toLowerCase();

    if (profileSectorLower === jobCategoryLower) {
      breakdown.sector = 100;
    } else if (
      profileSectorLower.includes(jobCategoryLower) ||
      jobCategoryLower.includes(profileSectorLower)
    ) {
      breakdown.sector = 70;
    } else {
      // Verificar palavras-chave comuns
      const commonKeywords = [
        "tecnologia",
        "tech",
        "software",
        "ti",
        "it",
        "desenvolvimento",
        "development",
      ];
      const hasCommonKeyword = commonKeywords.some(
        (keyword) =>
          profileSectorLower.includes(keyword) &&
          jobCategoryLower.includes(keyword)
      );
      if (hasCommonKeyword) {
        breakdown.sector = 50;
      }
    }
  }

  // Calcular score total com pesos
  const total =
    breakdown.skills * 0.4 +
    breakdown.location * 0.2 +
    breakdown.level * 0.2 +
    breakdown.sector * 0.2;

  return {
    total: Math.round(total),
    breakdown,
  };
}
