import { IProfile } from "@/models/Profile";
import { IVacancy } from "@/models/Vacancy";
import { IPost } from "@/models/Post";
import { calculateJobMatchScore, MatchScore } from "./jobRecommendation";
import mongoose from "mongoose";

export interface FeedRelevanceScore {
  total: number;
  breakdown: {
    skills?: number;
    location?: number;
    level?: number;
    sector?: number;
    interactionHistory?: number;
    jobProximity?: number;
    popularity?: number;
    recency?: number;
    followedAuthor?: number;
    engagement?: number;
    previousInteractions?: number;
  };
}

export interface UserInteractionHistory {
  views: number;
  saves: number;
  applies: number;
  companyViews: number;
  totalDuration: number; // em segundos
  liked: boolean;
  commented: boolean;
  shared: boolean;
}

/**
 * Calcula o score de relevância para uma vaga no feed
 */
export function calculateJobFeedScore(
  profile: Partial<IProfile>,
  job: Partial<IVacancy>,
  interactionHistory: UserInteractionHistory,
  jobCreatedAt: Date
): FeedRelevanceScore {
  const breakdown: FeedRelevanceScore["breakdown"] = {};

  // 1. Match de Skills (30% - reduzido de 40% para dar mais espaço para headline e localização)
  const jobMatch = calculateJobMatchScore(profile, job);
  breakdown.skills = jobMatch.breakdown.skills;
  breakdown.level = jobMatch.breakdown.level;
  breakdown.sector = jobMatch.breakdown.sector;

  const skillsScore = jobMatch.total * 0.3;

  // 2. Histórico de Interações (20% - reduzido de 25%)
  let interactionScore = 0;
  if (interactionHistory.views > 0) {
    interactionScore += Math.min(interactionHistory.views * 5, 15); // Max 15 pontos
  }
  if (interactionHistory.saves > 0) {
    interactionScore += 15;
  }
  if (interactionHistory.applies > 0) {
    interactionScore += 20;
  }
  if (interactionHistory.companyViews > 0) {
    interactionScore += 10;
  }
  // Tempo gasto: +1 ponto por 10 segundos (max 10 pontos)
  const durationScore = Math.min(Math.floor(interactionHistory.totalDuration / 10), 10);
  interactionScore += durationScore;

  breakdown.interactionHistory = Math.min(interactionScore, 20);
  interactionScore = breakdown.interactionHistory * 0.2;

  // 3. Proximidade de Cargo e Headline (20% - aumentado de 15%)
  let jobProximityScore = 0;
  
  // Priorizar headline do usuário (pode conter informações sobre vagas que procura)
  if (profile.headline && job.title) {
    const headlineLower = profile.headline.toLowerCase();
    const jobTitleLower = job.title.toLowerCase();
    const jobDescriptionLower = (job.description || "").toLowerCase();
    const jobCategoryLower = (job.category || "").toLowerCase();
    
    // Extrair palavras-chave do headline
    const headlineWords = headlineLower
      .split(/[,\s\-]+/)
      .filter((word) => word.length > 3); // Filtrar palavras muito curtas
    
    // Verificar match com título da vaga
    const titleMatches = headlineWords.filter((word) =>
      jobTitleLower.includes(word) || jobDescriptionLower.includes(word)
    );
    
    // Verificar match com categoria
    const categoryMatches = headlineWords.filter((word) =>
      jobCategoryLower.includes(word)
    );
    
    // Score baseado em matches
    if (titleMatches.length > 0 || categoryMatches.length > 0) {
      const matchRatio = (titleMatches.length + categoryMatches.length) / headlineWords.length;
      jobProximityScore = Math.min(matchRatio * 100, 100);
      
      // Bonus para match exato de palavras-chave importantes
      const importantKeywords = ["desenvolvedor", "developer", "engenheiro", "engineer", "analista", "analyst", "gerente", "manager", "especialista", "specialist"];
      const hasImportantMatch = headlineWords.some((word) =>
        importantKeywords.some((keyword) => word.includes(keyword) || keyword.includes(word)) &&
        (jobTitleLower.includes(word) || jobDescriptionLower.includes(word))
      );
      
      if (hasImportantMatch) {
        jobProximityScore = Math.min(jobProximityScore + 20, 100);
      }
    }
  }
  
  // Fallback: usar experiência atual se não houver headline ou se o score for baixo
  if (jobProximityScore < 50 && profile.experience && profile.experience.length > 0 && job.title) {
    const currentJob = profile.experience.find((exp) => exp.current);
    if (currentJob) {
      const currentTitleLower = currentJob.title.toLowerCase();
      const jobTitleLower = job.title.toLowerCase();
      const jobCategoryLower = (job.category || "").toLowerCase();

      // Match exato de título
      if (currentTitleLower === jobTitleLower) {
        jobProximityScore = Math.max(jobProximityScore, 100);
      } else if (
        currentTitleLower.includes(jobTitleLower) ||
        jobTitleLower.includes(currentTitleLower)
      ) {
        jobProximityScore = Math.max(jobProximityScore, 80);
      } else if (
        currentTitleLower.includes(jobCategoryLower) ||
        jobCategoryLower.includes(currentTitleLower)
      ) {
        jobProximityScore = Math.max(jobProximityScore, 60);
      }
    }
  }
  
  breakdown.jobProximity = jobProximityScore;
  const jobProximityWeighted = jobProximityScore * 0.2; // Aumentado de 0.15 para 0.2

  // 4. Localização Priorizada (15% - novo fator)
  let locationScore = jobMatch.breakdown.location;
  
  // Bonus adicional se a localização do usuário corresponder exatamente
  if (profile.location && job.location) {
    const profileLocationLower = profile.location.toLowerCase();
    const jobLocationLower = job.location.toLowerCase();
    
    // Match exato (cidade, estado, país)
    if (profileLocationLower === jobLocationLower) {
      locationScore = 100;
    } else {
      // Match parcial - verificar componentes
      const profileParts = profileLocationLower.split(/[,\s]+/);
      const jobParts = jobLocationLower.split(/[,\s]+/);
      
      const exactMatches = profileParts.filter((part) =>
        jobParts.some((jobPart) => part === jobPart)
      );
      
      if (exactMatches.length > 0) {
        locationScore = Math.max(locationScore, 80);
      }
    }
  }
  
  // Bonus para vagas remotas se o usuário prefere remoto
  if (job.remote && (profile.preferredLocation?.toLowerCase().includes("remoto") || 
                     profile.preferredLocation?.toLowerCase().includes("remote"))) {
    locationScore = Math.max(locationScore, 90);
  }
  
  breakdown.location = locationScore;
  const locationWeighted = locationScore * 0.15;

  // 5. Popularidade (10%)
  const viewsCount = (job as any).viewsCount || 0;
  const applicationsCount = (job as any).applicationsCount || 0;
  // Normalizar: 100 views = 50 pontos, 50 aplicações = 50 pontos
  const popularityScore =
    Math.min(viewsCount / 2, 50) + Math.min(applicationsCount, 50);
  breakdown.popularity = Math.min(popularityScore, 100);
  const popularityWeighted = breakdown.popularity * 0.1;

  // 6. Recência (10%)
  const now = new Date();
  const daysSinceCreation = (now.getTime() - jobCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  // Posts mais recentes têm maior score
  // 0 dias = 100 pontos, 7 dias = 50 pontos, 30 dias = 0 pontos
  const recencyScore = Math.max(0, 100 - (daysSinceCreation / 30) * 100);
  breakdown.recency = Math.min(recencyScore, 100);
  const recencyWeighted = breakdown.recency * 0.1;

  const total =
    skillsScore + interactionScore + jobProximityWeighted + locationWeighted + popularityWeighted + recencyWeighted;

  return {
    total: Math.round(total),
    breakdown,
  };
}

/**
 * Calcula o score de relevância para um post no feed
 */
export function calculatePostFeedScore(
  post: Partial<IPost>,
  interactionHistory: UserInteractionHistory,
  isFollowingAuthor: boolean,
  postCreatedAt: Date,
  reactionsCount: number,
  commentsCount: number,
  sharesCount: number,
  userProfile?: Partial<IProfile>
): FeedRelevanceScore {
  const breakdown: FeedRelevanceScore["breakdown"] = {};

  // 1. Pessoas Seguidas (25% - reduzido de 30%)
  const followedScore = isFollowingAuthor ? 100 : 0;
  breakdown.followedAuthor = followedScore;
  const followedWeighted = followedScore * 0.25;
  
  // 1.5. Relevância de Localização e Headline (10% - novo fator para posts)
  let relevanceScore = 0;
  if (userProfile) {
    // Verificar se o conteúdo do post menciona localização do usuário
    const postContent = ((post as any).content || "").toLowerCase();
    const postAuthorLocation = ((post as any).authorId?.profile?.location || "").toLowerCase();
    
    if (userProfile.location) {
      const userLocationLower = userProfile.location.toLowerCase();
      const locationParts = userLocationLower.split(/[,\s]+/);
      
      // Verificar se o post menciona a localização do usuário
      const hasLocationMatch = locationParts.some((part) =>
        postContent.includes(part) || postAuthorLocation.includes(part)
      );
      
      if (hasLocationMatch) {
        relevanceScore += 50;
      }
    }
    
    // Verificar se o headline do usuário tem relação com o conteúdo do post
    if (userProfile.headline && postContent) {
      const headlineLower = userProfile.headline.toLowerCase();
      const headlineWords = headlineLower
        .split(/[,\s\-]+/)
        .filter((word) => word.length > 3);
      
      const contentMatches = headlineWords.filter((word) =>
        postContent.includes(word)
      );
      
      if (contentMatches.length > 0) {
        relevanceScore += Math.min((contentMatches.length / headlineWords.length) * 50, 50);
      }
    }
  }
  
  breakdown.location = relevanceScore;
  const relevanceWeighted = relevanceScore * 0.1;

  // 2. Engajamento (25%)
  // Normalizar: 100 reações = 50 pontos, 50 comentários = 30 pontos, 20 shares = 20 pontos
  const engagementScore =
    Math.min(reactionsCount / 2, 50) +
    Math.min(commentsCount * 0.6, 30) +
    Math.min(sharesCount, 20);
  breakdown.engagement = Math.min(engagementScore, 100);
  const engagementWeighted = breakdown.engagement * 0.25;

  // 3. Interações Anteriores (20%)
  let previousInteractionsScore = 0;
  if (interactionHistory.liked) previousInteractionsScore += 50;
  if (interactionHistory.commented) previousInteractionsScore += 30;
  if (interactionHistory.shared) previousInteractionsScore += 20;
  breakdown.previousInteractions = Math.min(previousInteractionsScore, 100);
  const previousInteractionsWeighted = breakdown.previousInteractions * 0.2;

  // 4. Recência (10% - reduzido de 15%)
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - postCreatedAt.getTime()) / (1000 * 60 * 60);
  // Posts mais recentes têm maior score
  // 0 horas = 100 pontos, 24 horas = 50 pontos, 7 dias = 0 pontos
  const recencyScore = Math.max(0, 100 - (hoursSinceCreation / 168) * 100);
  breakdown.recency = Math.min(recencyScore, 100);
  const recencyWeighted = breakdown.recency * 0.1;

  // 5. Popularidade (10%)
  const totalEngagement = reactionsCount + commentsCount + sharesCount;
  // 200 engajamentos = 100 pontos
  const popularityScore = Math.min((totalEngagement / 200) * 100, 100);
  breakdown.popularity = popularityScore;
  const popularityWeighted = popularityScore * 0.1;

  const total =
    followedWeighted +
    relevanceWeighted +
    engagementWeighted +
    previousInteractionsWeighted +
    recencyWeighted +
    popularityWeighted;

  return {
    total: Math.round(total),
    breakdown,
  };
}

/**
 * Aplica diversificação ao feed para evitar repetição
 */
export function applyDiversity<T extends { _id: string; score?: number; type?: string; authorId?: any }>(
  items: T[],
  maxConsecutiveSameType: number = 3,
  maxConsecutiveSameAuthor: number = 2
): T[] {
  if (items.length === 0) return items;

  const diversified: T[] = [];
  const buckets: { high: T[]; medium: T[]; low: T[] } = {
    high: [],
    medium: [],
    low: [],
  };

  // Separar por score
  items.forEach((item) => {
    const score = item.score || 0;
    if (score >= 70) buckets.high.push(item);
    else if (score >= 40) buckets.medium.push(item);
    else buckets.low.push(item);
  });

  // Misturar: 50% altos, 30% médios, 20% baixos
  const highCount = Math.ceil(items.length * 0.5);
  const mediumCount = Math.ceil(items.length * 0.3);
  const lowCount = items.length - highCount - mediumCount;

  let highIndex = 0;
  let mediumIndex = 0;
  let lowIndex = 0;
  let consecutiveSameType = 0;
  let consecutiveSameAuthor = 0;
  let lastType: string | undefined;
  let lastAuthorId: string | undefined;

  for (let i = 0; i < items.length; i++) {
    let selected: T | undefined;

    // Escolher bucket baseado na proporção
    const ratio = i / items.length;
    if (ratio < 0.5 && highIndex < highCount && buckets.high.length > 0) {
      selected = buckets.high.shift();
      highIndex++;
    } else if (ratio < 0.8 && mediumIndex < mediumCount && buckets.medium.length > 0) {
      selected = buckets.medium.shift();
      mediumIndex++;
    } else if (lowIndex < lowCount && buckets.low.length > 0) {
      selected = buckets.low.shift();
      lowIndex++;
    } else {
      // Fallback: pegar do bucket disponível
      selected =
        buckets.high.shift() || buckets.medium.shift() || buckets.low.shift();
    }

    if (!selected) break;

    // Verificar diversidade
    const currentType = selected.type || "unknown";
    const currentAuthorId = selected.authorId?._id?.toString() || selected.authorId?.toString();

    if (currentType === lastType) {
      consecutiveSameType++;
      if (consecutiveSameType >= maxConsecutiveSameType) {
        // Pular este item e tentar outro
        const alternative =
          buckets.high.find((item) => item.type !== lastType) ||
          buckets.medium.find((item) => item.type !== lastType) ||
          buckets.low.find((item) => item.type !== lastType);

        if (alternative) {
          // Remover alternative do bucket
          const bucket = buckets.high.includes(alternative)
            ? buckets.high
            : buckets.medium.includes(alternative)
            ? buckets.medium
            : buckets.low;
          const index = bucket.indexOf(alternative);
          if (index > -1) bucket.splice(index, 1);

          // Adicionar selected de volta
          if (selected.score && selected.score >= 70) buckets.high.push(selected);
          else if (selected.score && selected.score >= 40) buckets.medium.push(selected);
          else buckets.low.push(selected);

          selected = alternative;
          consecutiveSameType = 0;
        }
      }
    } else {
      consecutiveSameType = 0;
    }

    if (currentAuthorId && currentAuthorId === lastAuthorId) {
      consecutiveSameAuthor++;
      if (consecutiveSameAuthor >= maxConsecutiveSameAuthor) {
        // Pular este item
        const alternative =
          buckets.high.find(
            (item) =>
              (item.authorId?._id?.toString() || item.authorId?.toString()) !== lastAuthorId
          ) ||
          buckets.medium.find(
            (item) =>
              (item.authorId?._id?.toString() || item.authorId?.toString()) !== lastAuthorId
          ) ||
          buckets.low.find(
            (item) =>
              (item.authorId?._id?.toString() || item.authorId?.toString()) !== lastAuthorId
          );

        if (alternative) {
          const bucket = buckets.high.includes(alternative)
            ? buckets.high
            : buckets.medium.includes(alternative)
            ? buckets.medium
            : buckets.low;
          const index = bucket.indexOf(alternative);
          if (index > -1) bucket.splice(index, 1);

          if (selected.score && selected.score >= 70) buckets.high.push(selected);
          else if (selected.score && selected.score >= 40) buckets.medium.push(selected);
          else buckets.low.push(selected);

          selected = alternative;
          consecutiveSameAuthor = 0;
        }
      }
    } else {
      consecutiveSameAuthor = 0;
    }

    diversified.push(selected);
    lastType = currentType;
    lastAuthorId = currentAuthorId;
  }

  return diversified;
}

