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
import { Checkbox } from "@/components/ui/checkbox";

interface Company {
  _id: string;
  name: string;
  cnpj: string;
  industry: string;
  description: string;
  size: "startup" | "small" | "medium" | "large" | "enterprise";
  location: string;
  website?: string;
  foundedYear?: number;
  isVerified: boolean;
  benefits: string[];
  culture?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

interface EditCompanyDrawerProps {
  company: Company;
  onUpdate: (updatedCompany: Company) => void;
  trigger?: React.ReactNode;
}

export function EditCompanyDrawer({
  company,
  onUpdate,
  trigger,
}: EditCompanyDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: company.name || "",
    cnpj: company.cnpj || "",
    industry: company.industry || "",
    description: company.description || "",
    size: company.size || "medium",
    location: company.location || "",
    website: company.website || "",
    foundedYear: company.foundedYear?.toString() || "",
    isVerified: company.isVerified || false,
    culture: company.culture || "",
    benefits: company.benefits?.join(", ") || "",
    linkedin: company.socialLinks?.linkedin || "",
    twitter: company.socialLinks?.twitter || "",
    facebook: company.socialLinks?.facebook || "",
    instagram: company.socialLinks?.instagram || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Garantir que o ID seja uma string válida
      let companyId: string;
      if (typeof company._id === 'string') {
        companyId = company._id;
      } else if (company._id && typeof company._id.toString === 'function') {
        companyId = company._id.toString();
      } else {
        console.error("Invalid company ID:", company._id);
        toast.error("ID da empresa inválido");
        setLoading(false);
        return;
      }

      console.log("Updating company with ID:", companyId, "Type:", typeof companyId);
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          cnpj: formData.cnpj,
          industry: formData.industry,
          description: formData.description,
          size: formData.size,
          location: formData.location,
          website: formData.website || undefined,
          foundedYear: formData.foundedYear
            ? parseInt(formData.foundedYear)
            : undefined,
          isVerified: formData.isVerified,
          culture: formData.culture || undefined,
          benefits: formData.benefits
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean),
          socialLinks: {
            linkedin: formData.linkedin || undefined,
            twitter: formData.twitter || undefined,
            facebook: formData.facebook || undefined,
            instagram: formData.instagram || undefined,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar empresa");
      }

      const data = await response.json();
      toast.success("Empresa atualizada com sucesso!");
      onUpdate(data.company);
      setOpen(false);
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Erro ao atualizar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Editar Empresa</DrawerTitle>
          <DrawerDescription>
            Atualize as informações da empresa
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="industry">Indústria *</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
              />
            </div>
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
              <Label htmlFor="size">Tamanho *</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => setFormData({ ...formData, size: value as any })}
              >
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="small">Pequena</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="location">Localização *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://exemplo.com"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="foundedYear">Ano de Fundação</Label>
              <Input
                id="foundedYear"
                type="number"
                value={formData.foundedYear}
                onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                placeholder="2020"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isVerified"
              checked={formData.isVerified}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isVerified: checked === true })
              }
            />
            <Label htmlFor="isVerified" className="cursor-pointer">
              Empresa verificada
            </Label>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="culture">Cultura</Label>
            <Textarea
              id="culture"
              value={formData.culture}
              onChange={(e) => setFormData({ ...formData, culture: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                type="url"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                type="url"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                type="url"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
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

