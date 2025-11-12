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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconX, IconLoader } from "@tabler/icons-react";

interface Admin {
  _id: string;
  name: string;
  email: string;
}

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
  admins?: Admin[];
  recruiters?: Admin[];
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
  const [removingAdminId, setRemovingAdminId] = React.useState<string | null>(null);
  const [companyData, setCompanyData] = React.useState<Company>(company);
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

  // Função para buscar dados atualizados da empresa
  const fetchCompanyData = React.useCallback(async () => {
    try {
      const companyId = String(company._id);
      const response = await fetch(`/api/admin/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          setCompanyData(data.company);
          // Atualizar também os dados do formulário
          setFormData((prev) => ({
            ...prev,
            name: data.company.name || prev.name,
            cnpj: data.company.cnpj || prev.cnpj,
            industry: data.company.industry || prev.industry,
            description: data.company.description || prev.description,
            size: data.company.size || prev.size,
            location: data.company.location || prev.location,
            website: data.company.website || prev.website,
            foundedYear: data.company.foundedYear?.toString() || prev.foundedYear,
            isVerified: data.company.isVerified ?? prev.isVerified,
            culture: data.company.culture || prev.culture,
            benefits: data.company.benefits?.join(", ") || prev.benefits,
            linkedin: data.company.socialLinks?.linkedin || prev.linkedin,
            twitter: data.company.socialLinks?.twitter || prev.twitter,
            facebook: data.company.socialLinks?.facebook || prev.facebook,
            instagram: data.company.socialLinks?.instagram || prev.instagram,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  }, [company._id]);

  // Buscar dados atualizados da empresa quando o drawer abrir
  React.useEffect(() => {
    if (open) {
      fetchCompanyData();
    }
  }, [open, fetchCompanyData]);

  // Atualizar companyData quando company prop mudar
  React.useEffect(() => {
    if (company) {
      // Só atualizar se não estiver aberto (para evitar conflitos)
      if (!open) {
        setCompanyData(company);
      }
    }
  }, [company, open]);

  const handleRemoveAdmin = async (adminId: string, adminName: string) => {
    setRemovingAdminId(adminId);
    try {
      const companyId = String(company._id);
      const response = await fetch(
        `/api/admin/companies/${companyId}/remove-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: adminId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao remover admin");
      }

      const data = await response.json();
      toast.success(data.message || "Admin removido com sucesso!");
      
      // Atualizar dados da empresa
      setCompanyData(data.company);
      onUpdate(data.company);
      
      // Recarregar dados atualizados
      await fetchCompanyData();
    } catch (error: any) {
      console.error("Error removing admin:", error);
      toast.error(error.message || "Erro ao remover admin");
    } finally {
      setRemovingAdminId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyId = String(company._id);
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
          // createdAt não é enviado porque não pode ser modificado quando timestamps: true está ativo
          // createdAt: formData.createdAt
          //   ? new Date(formData.createdAt).toISOString()
          //   : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar empresa");
      }

      const data = await response.json();
      toast.success("Empresa atualizada com sucesso!");
      setCompanyData(data.company);
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

          {/* Seção de Administradores */}
          <div className="flex flex-col gap-3 border-t pt-4">
            <Label>Administradores da Empresa</Label>
            {companyData.admins && companyData.admins.length > 0 ? (
              <div className="flex flex-col gap-2">
                {companyData.admins.map((admin) => (
                  <div
                    key={admin._id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {admin.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{admin.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {admin.email}
                      </span>
                    </div>
                    <Badge variant="default">Admin</Badge>
                    {companyData.admins && companyData.admins.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={removingAdminId === admin._id}
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja remover ${admin.name} como administrador da empresa?`)) {
                            handleRemoveAdmin(admin._id, admin.name);
                          }
                        }}
                        title="Remover admin"
                      >
                        {removingAdminId === admin._id ? (
                          <IconLoader className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconX className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum administrador atribuído
              </p>
            )}
          </div>

          {/* Seção de Recrutadores */}
          {companyData.recruiters && companyData.recruiters.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <Label>Recrutadores da Empresa</Label>
              <div className="flex flex-col gap-2">
                {companyData.recruiters
                  .filter(
                    (recruiter) =>
                      !companyData.admins?.some(
                        (admin) => admin._id === recruiter._id
                      )
                  )
                  .map((recruiter) => (
                    <div
                      key={recruiter._id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {recruiter.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium">
                          {recruiter.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {recruiter.email}
                        </span>
                      </div>
                      <Badge variant="secondary">Recrutador</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
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

