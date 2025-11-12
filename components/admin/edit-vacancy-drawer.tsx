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

interface Vacancy {
  _id: string;
  title: string;
  companyId: any;
  description: string;
  location: string;
  remote: boolean;
  type: "full-time" | "part-time" | "contract" | "internship";
  level: "junior" | "mid" | "senior" | "lead" | "executive";
  category: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  tags: string[];
  status: "draft" | "published" | "paused" | "closed";
}

interface EditVacancyDrawerProps {
  vacancy: Vacancy;
  onUpdate: (updatedVacancy: Vacancy) => void;
  trigger?: React.ReactNode;
}

export function EditVacancyDrawer({
  vacancy,
  onUpdate,
  trigger,
}: EditVacancyDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: vacancy.title || "",
    description: vacancy.description || "",
    location: vacancy.location || "",
    remote: vacancy.remote || false,
    type: vacancy.type || "full-time",
    level: vacancy.level || "mid",
    category: vacancy.category || "",
    salaryMin: vacancy.salaryRange?.min?.toString() || "",
    salaryMax: vacancy.salaryRange?.max?.toString() || "",
    requirements: vacancy.requirements?.join("\n") || "",
    responsibilities: vacancy.responsibilities?.join("\n") || "",
    benefits: vacancy.benefits?.join(", ") || "",
    skills: vacancy.skills?.join(", ") || "",
    tags: vacancy.tags?.join(", ") || "",
    status: vacancy.status || "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vacancyId = String(vacancy._id);
      const salaryRange = formData.salaryMin || formData.salaryMax
        ? {
            min: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
            max: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
            currency: "BRL",
          }
        : undefined;

      const response = await fetch(`/api/admin/vacancies/${vacancyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
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
        throw new Error(error.error || "Erro ao atualizar vaga");
      }

      const data = await response.json();
      toast.success("Vaga atualizada com sucesso!");
      onUpdate(data.vacancy);
      setOpen(false);
    } catch (error: any) {
      console.error("Error updating vacancy:", error);
      toast.error(error.message || "Erro ao atualizar vaga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Editar Vaga</DrawerTitle>
          <DrawerDescription>
            Atualize as informações da vaga
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
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="salaryMax">Salário Máximo (R$)</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
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
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="skills">Habilidades (separadas por vírgula)</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

