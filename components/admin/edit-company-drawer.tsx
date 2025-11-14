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
import { IconX, IconLoader, IconPlus, IconEye, IconEyeOff } from "@tabler/icons-react";
import { UserCombobox } from "@/components/admin/user-combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  sidebarTitle?: string;
  username?: string;
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
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);
  const [adminToRemove, setAdminToRemove] = React.useState<{ id: string; name: string } | null>(null);
  const [assigningAdmin, setAssigningAdmin] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedUserName, setSelectedUserName] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<"admin" | "recruiter">("admin");
  const [showAssignDialog, setShowAssignDialog] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [companyData, setCompanyData] = React.useState<Company>(company);
  const [formData, setFormData] = React.useState({
    name: company?.name || "",
    sidebarTitle: company?.sidebarTitle || "",
    username: company?.username || "",
    password: "", // Sempre vazio inicialmente, só preencher se o admin quiser alterar
    cnpj: company?.cnpj || "",
    industry: company?.industry || "",
    description: company?.description || "",
    size: company?.size || "medium",
    location: company?.location || "",
    website: company?.website || "",
    foundedYear: company?.foundedYear?.toString() || "",
    isVerified: company?.isVerified || false,
    culture: company?.culture || "",
    benefits: company?.benefits?.join(", ") || "",
    linkedin: company?.socialLinks?.linkedin || "",
    twitter: company?.socialLinks?.twitter || "",
    facebook: company?.socialLinks?.facebook || "",
    instagram: company?.socialLinks?.instagram || "",
  });

  // Função para buscar dados atualizados da empresa
  const fetchCompanyData = React.useCallback(async () => {
    try {
      const companyId = company?._id || companyData?._id;
      if (!companyId) {
        console.error("Company ID não encontrado");
        return;
      }
      const response = await fetch(`/api/admin/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          setCompanyData(data.company);
          // Atualizar também os dados do formulário
          setFormData({
            name: data.company.name || "",
            sidebarTitle: data.company.sidebarTitle || "",
            username: data.company.username || "",
            password: "", // Sempre vazio, não mostrar senha atual
            cnpj: data.company.cnpj || "",
            industry: data.company.industry || "",
            description: data.company.description || "",
            size: data.company.size || "medium",
            location: data.company.location || "",
            website: data.company.website || "",
            foundedYear: data.company.foundedYear?.toString() || "",
            isVerified: data.company.isVerified || false,
            culture: data.company.culture || "",
            benefits: data.company.benefits?.join(", ") || "",
            linkedin: data.company.socialLinks?.linkedin || "",
            twitter: data.company.socialLinks?.twitter || "",
            facebook: data.company.socialLinks?.facebook || "",
            instagram: data.company.socialLinks?.instagram || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  }, [company?._id, companyData?._id]);

  // Buscar dados atualizados da empresa quando o drawer abrir
  React.useEffect(() => {
    if (open) {
      // Sempre buscar dados atualizados quando abrir, mesmo se company prop estiver vazio
      fetchCompanyData();
    }
  }, [open, fetchCompanyData]);

  // Atualizar companyData quando company prop mudar
  React.useEffect(() => {
    if (company && company._id) {
      // Só atualizar se não estiver aberto (para evitar conflitos)
      if (!open) {
        setCompanyData(company);
        setFormData({
          name: company.name || "",
          sidebarTitle: company.sidebarTitle || "",
          username: company.username || "",
          password: "", // Sempre vazio, não mostrar senha atual
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
      }
    }
  }, [company, open]);

  const handleAssignAdmin = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    setAssigningAdmin(true);
    try {
      const companyId = String(company?._id || companyData?._id);
      if (!companyId || companyId === "undefined") {
        toast.error("ID da empresa não encontrado");
        return;
      }
      const response = await fetch(
        `/api/admin/companies/${companyId}/assign-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atribuir admin");
      }

      const roleText = selectedRole === "admin" ? "administrador" : "recrutador";
      toast.success(data.message || `${roleText.charAt(0).toUpperCase() + roleText.slice(1)} atribuído com sucesso!`);

      // Limpar seleção
      setSelectedUserId("");
      setSelectedUserName("");
      setSelectedRole("admin");
      setShowAssignDialog(false);

      // Recarregar dados atualizados
      await fetchCompanyData();
    } catch (error: any) {
      console.error("Error assigning admin:", error);
      toast.error(error.message || "Erro ao atribuir admin");
    } finally {
      setAssigningAdmin(false);
    }
  };

  const handleUserSelect = (userId: string, userName?: string) => {
    if (userId) {
      setSelectedUserId(userId);
      if (userName) {
        setSelectedUserName(userName);
      }
    } else {
      setSelectedUserId("");
      setSelectedUserName("");
    }
  };

  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return;
    
    setRemovingAdminId(adminToRemove.id);
    try {
      const companyId = String(company?._id || companyData?._id);
      if (!companyId) {
        toast.error("ID da empresa não encontrado");
        return;
      }
      const response = await fetch(
        `/api/admin/companies/${companyId}/remove-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: adminToRemove.id }),
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
      
      // Fechar dialog e limpar
      setShowRemoveDialog(false);
      setAdminToRemove(null);
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
      const companyId = String(company?._id || companyData?._id);
      if (!companyId || companyId === "undefined") {
        toast.error("ID da empresa não encontrado");
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sidebarTitle: formData.sidebarTitle || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined, // Só enviar se fornecido
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

          <div className="flex flex-col gap-3">
            <Label htmlFor="sidebarTitle">Título do Sidebar (máx. 50 caracteres)</Label>
            <Input
              id="sidebarTitle"
              value={formData.sidebarTitle}
              onChange={(e) => {
                const value = e.target.value.substring(0, 50);
                setFormData({ ...formData, sidebarTitle: value });
              }}
              placeholder="Deixe em branco para usar o nome da empresa"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Título personalizado que aparece no sidebar do dashboard. Se vazio, será usado o nome da empresa.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="username">Username de Login</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
                setFormData({ ...formData, username: value });
              }}
              placeholder="username-empresa"
            />
            <p className="text-xs text-muted-foreground">
              Username único usado para login. Apenas letras minúsculas, números, underscores e hífens.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="password">Nova Senha (deixe em branco para não alterar)</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IconEyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <IconEye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">Mostrar senha</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para manter a senha atual. Preencha apenas se desejar alterar.
            </p>
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
            
            {/* Adicionar Admin */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <UserCombobox
                    onSelect={handleUserSelect}
                    onClear={() => {
                      setSelectedUserId("");
                      setSelectedUserName("");
                    }}
                    placeholder="Pesquisar usuário para adicionar..."
                    disabled={assigningAdmin}
                    value={selectedUserId}
                  />
                </div>
                {selectedUserId && (
                  <>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) => setSelectedRole(value as "admin" | "recruiter")}
                      disabled={assigningAdmin}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="recruiter">Recrutador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => setShowAssignDialog(true)}
                      disabled={assigningAdmin}
                      variant="default"
                      className="h-8"
                    >
                      {assigningAdmin ? (
                        <IconLoader className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <IconPlus className="h-4 w-4 mr-2" />
                      )}
                      Adicionar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUserId("");
                        setSelectedUserName("");
                        setSelectedRole("admin");
                      }}
                      disabled={assigningAdmin}
                      variant="ghost"
                      className="h-8"
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {companyData?.admins && companyData.admins.length > 0 ? (
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
                    {companyData?.admins && companyData.admins.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={removingAdminId === admin._id}
                        onClick={() => {
                          setAdminToRemove({ id: admin._id, name: admin.name });
                          setShowRemoveDialog(true);
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
          {companyData?.recruiters && companyData.recruiters.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <Label>Recrutadores da Empresa</Label>
              <div className="flex flex-col gap-2">
                {companyData.recruiters
                  .filter(
                    (recruiter) =>
                      !companyData?.admins?.some(
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
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{adminToRemove?.name}</strong> como administrador da empresa <strong>{companyData?.name || company?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminToRemove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Atribuição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja atribuir <strong>{selectedUserName || "este usuário"}</strong> como <strong>{selectedRole === "admin" ? "administrador" : "recrutador"}</strong> da empresa <strong>{companyData?.name || company?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssignAdmin}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  );
}

