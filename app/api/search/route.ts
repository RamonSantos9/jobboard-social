import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import Profile from "@/models/Profile";
import Job from "@/models/Job";

/**
 * @route GET /api/search
 * @desc Pesquisa unificada de posts, pessoas e vagas
 * @query q - Termo de pesquisa
 * @query type - Tipo de pesquisa (posts, users, jobs, all)
 * @query area - Área da vaga (apenas para type=jobs)
 * @access Private
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";
    const area = searchParams.get("area") || "";

    const results: any = {
      posts: [],
      users: [],
      jobs: [],
    };

    console.log(
      `🔍 Pesquisando por: "${query}" (Tipo: ${type}, Área: ${area})`
    );

    // Pesquisar Posts
    if (type === "posts" || type === "all") {
      if (query.trim()) {
        // Buscar posts sem popular author ainda
        const posts = await Post.find({
          content: { $regex: query, $options: "i" },
        })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();

        // Coletar IDs dos autores (usuários)
        const authorIds = posts
          .map((post: any) => post.authorId)
          .filter((id) => id);

        if (authorIds.length > 0) {
          // Buscar perfis correspondentes aos usuários
          const profiles = await Profile.find({
            userId: { $in: authorIds },
          })
            .select("userId firstName lastName photoUrl slug")
            .lean();

          // Criar mapa de userId -> Profile
          const profileMap = new Map();
          profiles.forEach((profile: any) => {
            profileMap.set(profile.userId.toString(), profile);
          });

          // Adicionar dados do autor aos posts
          results.posts = posts.map((post: any) => {
            const authorProfile = post.authorId
              ? profileMap.get(post.authorId.toString())
              : null;

            return {
              ...post,
              author: authorProfile
                ? {
                    firstName: authorProfile.firstName,
                    lastName: authorProfile.lastName,
                    photoUrl: authorProfile.photoUrl,
                    slug: authorProfile.slug,
                  }
                : null,
            };
          });
        } else {
          results.posts = posts;
        }

        console.log(`📄 Posts encontrados: ${results.posts.length}`);
      }
    }

    // Pesquisar Pessoas
    if (type === "users" || type === "all") {
      if (query.trim()) {
        const users = await Profile.find({
          $or: [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { headline: { $regex: query, $options: "i" } },
          ],
        })
          .select("firstName lastName photoUrl slug headline location")
          .limit(20)
          .lean();

        console.log(`👥 Pessoas encontradas: ${users.length}`);
        results.users = users;
      }
    }

    // Pesquisar Vagas
    if (type === "jobs" || type === "all") {
      const jobQuery: any = {};

      // Filtro por termo de pesquisa
      if (query.trim()) {
        jobQuery.$or = [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { requirements: { $regex: query, $options: "i" } },
          { skills: { $regex: query, $options: "i" } },
        ];
      }

      // Filtro por área
      if (area) {
        jobQuery.category = area;
      }

      // Apenas vagas ativas
      jobQuery.status = "active";

      console.log("🔍 Query de Vagas:", JSON.stringify(jobQuery));

      const jobs = await Job.find(jobQuery)
        .populate("companyId", "name logoUrl")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      console.log(`💼 Vagas encontradas: ${jobs.length}`);
      results.jobs = jobs;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erro ao pesquisar:", error);
    return NextResponse.json(
      { error: "Erro ao realizar pesquisa" },
      { status: 500 }
    );
  }
}
