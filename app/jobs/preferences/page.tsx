"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Briefcase, MapPin, DollarSign, X, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobPreferences {
  jobTypes: string[];
  levels: string[];
  categories: string[];
  locations: string[];
  remote: boolean;
  hybrid: boolean;
  onsite: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
}

const jobTypeOptions = [
  { value: "full-time", label: "Tempo integral" },
  { value: "part-time", label: "Meio período" },
  { value: "contract", label: "Contrato" },
  { value: "internship", label: "Estágio" },
];

const levelOptions = [
  { value: "junior", label: "Júnior" },
  { value: "mid", label: "Pleno" },
  { value: "senior", label: "Sênior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executivo" },
];

const categoryOptions = [
  "Tecnologia",
  "Marketing",
  "Vendas",
  "Design",
  "Recursos Humanos",
  "Finanças",
  "Engenharia",
  "Produto",
  "Atendimento ao Cliente",
  "Operações",
];

export default function JobPreferencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const [preferences, setPreferences] = useState<JobPreferences>({
    jobTypes: [],
    levels: [],
    categories: [],
    locations: [],
    remote: false,
    hybrid: false,
    onsite: false,
    skills: [],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/feed/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchPreferences();
    }
  }, [status, router]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/user/job-preferences");
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/job-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        toast.success("Preferências salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar preferências");
      }
    } catch (error) {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  const toggleJobType = (type: string) => {
    setPreferences((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter((t) => t !== type)
        : [...prev.jobTypes, type],
    }));
  };

  const toggleLevel = (level: string) => {
    setPreferences((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }));
  };

  const toggleCategory = (category: string) => {
    setPreferences((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !preferences.skills.includes(newSkill.trim())) {
      setPreferences((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setPreferences((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addLocation = () => {
    if (
      newLocation.trim() &&
      !preferences.locations.includes(newLocation.trim())
    ) {
      setPreferences((prev) => ({
        ...prev,
        locations: [...prev.locations, newLocation.trim()],
      }));
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    setPreferences((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l !== location),
    }));
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Preferências de Vagas
        </h1>
        <p className="text-gray-600 mt-2">
          Configure suas preferências para receber recomendações personalizadas
          de vagas
        </p>
      </div>

      <div className="space-y-6">
        {/* Tipo de Emprego */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Tipo de Emprego
            </CardTitle>
            <CardDescription>
              Selecione os tipos de emprego que você procura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {jobTypeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => toggleJobType(option.value)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    preferences.jobTypes.includes(option.value)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={preferences.jobTypes.includes(option.value)}
                      onCheckedChange={() => toggleJobType(option.value)}
                    />
                    <Label className="cursor-pointer">{option.label}</Label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nível de Experiência */}
        <Card>
          <CardHeader>
            <CardTitle>Nível de Experiência</CardTitle>
            <CardDescription>
              Selecione os níveis de experiência desejados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {levelOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => toggleLevel(option.value)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    preferences.levels.includes(option.value)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={preferences.levels.includes(option.value)}
                      onCheckedChange={() => toggleLevel(option.value)}
                    />
                    <Label className="cursor-pointer">{option.label}</Label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modalidade de Trabalho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Modalidade de Trabalho
            </CardTitle>
            <CardDescription>
              Selecione as modalidades de trabalho que você aceita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={preferences.remote}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, remote: !!checked }))
                  }
                />
                <Label>Remoto</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={preferences.hybrid}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, hybrid: !!checked }))
                  }
                />
                <Label>Híbrido</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={preferences.onsite}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, onsite: !!checked }))
                  }
                />
                <Label>Presencial</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localizações */}
        <Card>
          <CardHeader>
            <CardTitle>Localizações Preferidas</CardTitle>
            <CardDescription>
              Adicione as cidades ou regiões onde você gostaria de trabalhar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: São Paulo, SP"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addLocation()}
                />
                <Button onClick={addLocation} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.locations.map((location) => (
                  <Badge key={location} variant="secondary" className="gap-1">
                    {location}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeLocation(location)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faixa Salarial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Faixa Salarial Desejada
            </CardTitle>
            <CardDescription>
              Defina sua expectativa salarial (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Salário Mínimo (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 5000"
                  value={preferences.salaryMin || ""}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      salaryMin: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Salário Máximo (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 10000"
                  value={preferences.salaryMax || ""}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      salaryMax: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Interesse</CardTitle>
            <CardDescription>
              Selecione as áreas em que você tem interesse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryOptions.map((category) => (
                <div
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    preferences.categories.includes(category)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={preferences.categories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <Label className="cursor-pointer text-sm">{category}</Label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Habilidades */}
        <Card>
          <CardHeader>
            <CardTitle>Habilidades</CardTitle>
            <CardDescription>
              Adicione suas principais habilidades e competências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: React, Node.js, Python"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                />
                <Button onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Preferências"}
          </Button>
        </div>
      </div>
    </div>
  );
}
