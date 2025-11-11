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

interface CreateApplicationDrawerProps {
  onSuccess: (application: any) => void;
  trigger?: React.ReactNode;
  vacancies?: any[];
  users?: any[];
}

export function CreateApplicationDrawer({
  onSuccess,
  trigger,
  vacancies = [],
  users = [],
}: CreateApplicationDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    jobId: "",
    candidateId: "",
    coverLetter: "",
    resumeUrl: "",
    status: "pending" as "pending" | "reviewed" | "accepted" | "rejected",
    notes: "",
  });

  React.useEffect(() => {
    if (open) {
      // Buscar vagas e usuários se não foram passados
      if (vacancies.length === 0) {
        fetch("/api/admin/vacancies?limit=100")
          .then((res) => res.json())
          .then((data) => {
            if (data.vacancies) {
              // Vacancies will be set via prop
            }
          })
          .catch(console.error);
      }
      if (users.length === 0) {
        fetch("/api/admin/users?limit=100")
          .then((res) => res.json())
          .then((data) => {
            if (data.users) {
              // Users will be set via prop
            }
          })
          .catch(console.error);
      }
    }
  }, [open, vacancies, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: formData.jobId,
          candidateId: formData.candidateId,
          coverLetter: formData.coverLetter || undefined,
          resumeUrl: formData.resumeUrl || undefined,
          status: formData.status,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar candidatura");
      }

      const data = await response.json();
      toast.success("Candidatura criada com sucesso!");
      onSuccess(data.application);
      setOpen(false);
      // Reset form
      setFormData({
        jobId: "",
        candidateId: "",
        coverLetter: "",
        resumeUrl: "",
        status: "pending",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error creating application:", error);
      toast.error(error.message || "Erro ao criar candidatura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Criar Candidatura</DrawerTitle>
          <DrawerDescription>
            Preencha os dados para criar uma nova candidatura
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-3">
            <Label htmlFor="jobId">Vaga *</Label>
            <Select
              value={formData.jobId}
              onValueChange={(value) => setFormData({ ...formData, jobId: value })}
              required
            >
              <SelectTrigger id="jobId">
                <SelectValue placeholder="Selecione uma vaga" />
              </SelectTrigger>
              <SelectContent>
                {vacancies.map((vacancy) => (
                  <SelectItem key={vacancy._id} value={vacancy._id.toString()}>
                    {vacancy.title} - {(vacancy.companyId as any)?.name || "Empresa"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="candidateId">Candidato *</Label>
            <Select
              value={formData.candidateId}
              onValueChange={(value) => setFormData({ ...formData, candidateId: value })}
              required
            >
              <SelectTrigger id="candidateId">
                <SelectValue placeholder="Selecione um candidato" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id.toString()}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
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
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="reviewed">Revisada</SelectItem>
                <SelectItem value="accepted">Aceita</SelectItem>
                <SelectItem value="rejected">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="coverLetter">Carta de Apresentação</Label>
            <Textarea
              id="coverLetter"
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="resumeUrl">URL do Currículo</Label>
            <Input
              id="resumeUrl"
              type="url"
              value={formData.resumeUrl}
              onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Criar Candidatura"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

