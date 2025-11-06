"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Eye, ExternalLink } from "lucide-react";

interface Profile {
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
  headline?: string;
  location?: string;
  connections?: number;
  currentTitle?: string;
  currentCompany?: string;
  skills?: string[];
}

export default function LeftSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return;

      try {
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (response.ok) {
          setProfile(data.profile);
        } else {
          console.error("Profile API error:", data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  const handleViewPublicProfile = () => {
    if (profile?.slug) {
      router.push(`/jobboard/${profile.slug}`);
    }
  };

  const handleAvatarClick = () => {
    if (profile?.slug) {
      router.push(`/jobboard/${profile.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="w-64 space-y-2">
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Card de Perfil */}
      <Card className="rounded-lg overflow-hidden mb-3 shadow-sm border border-gray-200">
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-12 w-full" />
        <CardContent className="pt-0 flex flex-col items-center -mt-8 pb-4">
          <button
            onClick={handleAvatarClick}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
              <AvatarImage
                src={profile?.photoUrl || "/placeholder-avatar.svg"}
                alt="Profile"
              />
              <AvatarFallback>
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </button>

          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            {profile?.firstName} {profile?.lastName}
          </h3>

          <p className="text-xs text-gray-600 text-center px-2 mt-1 leading-tight">
            {profile?.headline ||
              (profile?.currentTitle && profile?.currentCompany
                ? `${profile.currentTitle} na ${profile.currentCompany}`
                : "Análise e Desenvolvimento de Sistemas | React | Next.js")}
          </p>

          {profile?.skills && profile.skills.length > 0 && (
            <p className="text-xs text-gray-600 text-center px-2 mt-1 leading-tight">
              {profile.skills.slice(0, 3).join(" | ")}
            </p>
          )}

          <p className="text-[11px] text-gray-500 mt-1">
            {profile?.location || "Cunha, São Paulo"}
          </p>
        </CardContent>
      </Card>

      {/* Connections */}
      <Card>
        <CardHeader className="pb-2 p-4 rounded-xl">
          <CardTitle className="text-xs font-medium text-black flex items-center">
            <div className="flex flex-col items-start ">
              <span className="text-black/90 mb-2">Conexões</span>
              <span className="text-black/60">Amplie sua rede</span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
