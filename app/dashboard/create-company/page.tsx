"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AuthGuard from "@/components/AuthGuard";
import { ArrowLeft, Building2 } from "lucide-react";

export default function CreateCompanyPage() {
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    industry: "",
    description: "",
    size: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();

  // Redirecionar se não estiver logado
  if (!session) {
    router.push("/feed/auth/login");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/company/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Empresa criada com sucesso!");

        // Redirecionar para página da empresa
        setTimeout(() => {
          router.push(`/company/${data.companyId}`);
        }, 1500);
      } else {
        toast.error(data.error || "Erro ao criar empresa");
      }
    } catch (error) {
      toast.error("Erro ao criar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Criar Empresa
                </h1>
                <p className="text-gray-600">
                  Configure sua empresa no JobBoard
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: TechCorp Ltda"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry">Indústria *</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) =>
                      handleSelectChange("industry", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a indústria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Tecnologia</SelectItem>
                      <SelectItem value="finance">Finanças</SelectItem>
                      <SelectItem value="healthcare">Saúde</SelectItem>
                      <SelectItem value="education">Educação</SelectItem>
                      <SelectItem value="retail">Varejo</SelectItem>
                      <SelectItem value="manufacturing">Manufatura</SelectItem>
                      <SelectItem value="consulting">Consultoria</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Tamanho da Empresa *</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => handleSelectChange("size", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">
                        Startup (1-10 funcionários)
                      </SelectItem>
                      <SelectItem value="small">
                        Pequena (11-50 funcionários)
                      </SelectItem>
                      <SelectItem value="medium">
                        Média (51-200 funcionários)
                      </SelectItem>
                      <SelectItem value="large">
                        Grande (201-1000 funcionários)
                      </SelectItem>
                      <SelectItem value="enterprise">
                        Empresa (1000+ funcionários)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ex: São Paulo, SP"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Empresa *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva sua empresa, missão, valores e cultura..."
                  rows={4}
                  required
                />
                <p className="text-sm text-gray-500">
                  Esta descrição aparecerá no perfil público da empresa
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Criando empresa..." : "Criar Empresa"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">
                  O que acontece depois?
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Após criar sua empresa, você se tornará automaticamente
                  administrador e poderá:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                  <li>Convidar outros recrutadores</li>
                  <li>Postar vagas de emprego</li>
                  <li>Gerenciar candidatos</li>
                  <li>Personalizar o perfil da empresa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
