"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CreateVacancyDrawerProps {
  onSuccess: (vacancy: any) => void;
  trigger?: React.ReactNode;
  companies?: any[];
}

export function CreateVacancyDrawer({
  onSuccess,
  trigger,
  companies = [],
}: CreateVacancyDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    companyId: "",
    description: "",
    location: "",
    remote: false,
    type: "full-time" as "full-time" | "part-time" | "contract" | "internship",
    level: "mid" as "junior" | "mid" | "senior" | "lead" | "executive",
    category: "",
    salaryMin: "",
    salaryMax: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    skills: "",
    tags: "",
    status: "draft" as "draft" | "published" | "paused" | "closed",
  });

  React.useEffect(() => {
    if (open && companies.length === 0) {
      // Buscar empresas se não foram passadas
      fetch("/api/admin/companies?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.companies) {
            // Companies will be set via prop
          }
        })
        .catch(console.error);
    }
  }, [open, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const salaryRange = formData.salaryMin || formData.salaryMax
        ? {
            min: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
            max: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
            currency: "BRL",
          }
        : undefined;

      const response = await fetch(`/api/admin/vacancies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          companyId: formData.companyId,
          description: formData.description,
          location: formData.location,
          remote: formData.remote,
          type: formData.type,
          level: formData.level,
          category: formData.category,
          salaryRange,
          requirements: formData.requirements
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean),
          responsibilities: formData.responsibilities
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean),
          benefits: formData.benefits
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean),
          skills: formData.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar vaga");
      }

      const data = await response.json();
      toast.success("Vaga criada com sucesso!");
      onSuccess(data.vacancy);
      setOpen(false);
      // Reset form
      setFormData({
        title: "",
        companyId: "",
        description: "",
        location: "",
        remote: false,
        type: "full-time",
        level: "mid",
        category: "",
        salaryMin: "",
        salaryMax: "",
        requirements: "",
        responsibilities: "",
        benefits: "",
        skills: "",
        tags: "",
        status: "draft",
      });
    } catch (error: any) {
      console.error("Error creating vacancy:", error);
      toast.error(error.message || "Erro ao criar vaga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Criar Vaga</DrawerTitle>
          <DrawerDescription>
            Preencha os dados para criar uma nova vaga
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-3">
            <Label htmlFor="title">Título da Vaga *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="companyId">Empresa *</Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) => setFormData({ ...formData, companyId: value })}
              required
            >
              <SelectTrigger id="companyId">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company._id} value={company._id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="location">Localização *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Tempo Integral</SelectItem>
                  <SelectItem value="part-time">Meio Período</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="internship">Estágio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="level">Nível *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value as any })}
              >
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Júnior</SelectItem>
                  <SelectItem value="mid">Pleno</SelectItem>
                  <SelectItem value="senior">Sênior</SelectItem>
                  <SelectItem value="lead">Líder</SelectItem>
                  <SelectItem value="executive">Executivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="closed">Fechada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remote"
              checked={formData.remote}
              onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="remote" className="cursor-pointer">
              Trabalho remoto
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="salaryMin">Salário Mínimo (R$)</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                placeholder="3000"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="salaryMax">Salário Máximo (R$)</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                placeholder="6000"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="requirements">Requisitos (um por linha)</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={3}
              placeholder="Experiência com React&#10;Conhecimento em TypeScript"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="responsibilities">Responsabilidades (um por linha)</Label>
            <Textarea
              id="responsibilities"
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="benefits">Benefícios (separados por vírgula)</Label>
            <Input
              id="benefits"
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              placeholder="Vale refeição, Plano de saúde, Gympass"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="skills">Habilidades (separadas por vírgula)</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="tecnologia, desenvolvimento, frontend"
            />
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Criar Vaga"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

