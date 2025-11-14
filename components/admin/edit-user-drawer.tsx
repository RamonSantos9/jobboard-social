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
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isRecruiter: boolean;
  status: "active" | "pending" | "suspended";
  isActive: boolean;
  onboardingCompleted?: boolean;
  dashboardAccess?: boolean;
  company?: {
    _id: string;
    name: string;
  };
  companyRole?: "admin" | "recruiter" | null;
  config?: {
    username?: string;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    location?: string;
    bio?: string;
    sector?: string;
  };
}

interface EditUserDrawerProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  trigger?: React.ReactNode;
}

export function EditUserDrawer({
  user,
  onUpdate,
  trigger,
}: EditUserDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [companies, setCompanies] = React.useState<Array<{ _id: string; name: string }>>([]);
  const [loadingCompanies, setLoadingCompanies] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User>(user);
  const [formData, setFormData] = React.useState({
    name: user.name || "",
    email: user.email || "",
    password: "",
    role: user.role || "user",
    isRecruiter: user.isRecruiter || false,
    status: user.status || "active",
    isActive: user.isActive !== undefined ? user.isActive : true,
    onboardingCompleted: user.onboardingCompleted !== undefined ? user.onboardingCompleted : false,
    dashboardAccess: user.dashboardAccess !== undefined ? user.dashboardAccess : false,
    username: user.config?.username || "",
    companyId: user.company?._id || "none",
    companyRole: user.companyRole || "",
    profile: {
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      headline: user.profile?.headline || "",
      location: user.profile?.location || "",
      bio: user.profile?.bio || "",
      sector: user.profile?.sector || "",
    },
  });

  // Atualizar formData quando user prop mudar
  React.useEffect(() => {
    setCurrentUser(user);
    // Converter companyId para string se for ObjectId
    const companyId = user.company?._id 
      ? (typeof user.company._id === 'string' ? user.company._id : String(user.company._id))
      : "none";
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "user",
      isRecruiter: user.isRecruiter || false,
      status: user.status || "active",
      isActive: user.isActive !== undefined ? user.isActive : true,
      onboardingCompleted: user.onboardingCompleted !== undefined ? user.onboardingCompleted : false,
      dashboardAccess: user.dashboardAccess !== undefined ? user.dashboardAccess : false,
      username: user.config?.username || "",
      companyId: companyId,
      companyRole: user.companyRole || "",
      profile: {
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        headline: user.profile?.headline || "",
        location: user.profile?.location || "",
        bio: user.profile?.bio || "",
        sector: user.profile?.sector || "",
      },
    });
  }, [user]);

  // Buscar dados atualizados do usuário quando o drawer abrir
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (!open) return;
      try {
        const response = await fetch(`/api/admin/users/${user._id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setCurrentUser(data.user);
            // Converter companyId para string se for ObjectId
            const companyId = data.user.company?._id 
              ? (typeof data.user.company._id === 'string' ? data.user.company._id : data.user.company._id.toString())
              : "none";
            setFormData({
              name: data.user.name || "",
              email: data.user.email || "",
              password: "",
              role: data.user.role || "user",
              isRecruiter: data.user.isRecruiter || false,
              status: data.user.status || "active",
              isActive: data.user.isActive !== undefined ? data.user.isActive : true,
              onboardingCompleted: data.user.onboardingCompleted !== undefined ? data.user.onboardingCompleted : false,
              dashboardAccess: data.user.dashboardAccess !== undefined ? data.user.dashboardAccess : false,
              username: data.user.config?.username || "",
              companyId: companyId,
              companyRole: data.user.companyRole || "",
              profile: {
                firstName: data.user.profile?.firstName || "",
                lastName: data.user.profile?.lastName || "",
                headline: data.user.profile?.headline || "",
                location: data.user.profile?.location || "",
                bio: data.user.profile?.bio || "",
                sector: data.user.profile?.sector || "",
              },
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [open, user._id]);

  // Buscar lista de empresas quando o drawer abrir
  React.useEffect(() => {
    const fetchCompanies = async () => {
      if (!open) return;
      setLoadingCompanies(true);
      try {
        const response = await fetch("/api/admin/companies?limit=1000");
        if (response.ok) {
          const data = await response.json();
          setCompanies(data.companies || []);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = String(user._id);
      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isRecruiter: formData.isRecruiter,
        status: formData.status,
        isActive: formData.isActive,
        onboardingCompleted: formData.onboardingCompleted,
        dashboardAccess: formData.dashboardAccess,
      };

      // Só incluir senha se foi preenchida
      if (formData.password) {
        body.password = formData.password;
      }

      // Incluir username se foi preenchido
      if (formData.username !== undefined) {
        body.config = {
          username: formData.username.trim() || null,
        };
      }

      // Não permitir alterar empresa via este endpoint - apenas o cargo
      // A empresa deve ser atribuída no painel de empresas
      if (formData.companyId && formData.companyId !== "none" && formData.companyRole) {
        // Apenas atualizar o cargo, não a empresa
        body.companyRole = formData.companyRole;
        // Não incluir companyId para evitar alteração
      }

      // Incluir campos do profile (sempre enviar para garantir atualização)
      body.profile = {
        firstName: formData.profile.firstName || "",
        lastName: formData.profile.lastName || "",
        headline: formData.profile.headline || "",
        location: formData.profile.location || "",
        bio: formData.profile.bio || "",
        sector: formData.profile.sector || "",
      };

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar usuário");
      }

      const data = await response.json();
      toast.success("Usuário atualizado com sucesso!");
      onUpdate(data.user);
      setOpen(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Editar Usuário</DrawerTitle>
          <DrawerDescription>
            Atualize as informações do usuário
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {/* Empresa e Cargo - Read-only para empresa, editável para cargo */}
          <div className="flex flex-col gap-3">
            <Label>Empresa</Label>
            <div className="px-3 py-2 border rounded-md bg-muted/50">
              {currentUser?.company?._id ? (
                <span className="text-sm font-medium">
                  {currentUser.company.name || "Empresa não encontrada"}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Nenhuma empresa atribuída</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              A empresa deve ser atribuída no painel de empresas.
            </p>
          </div>

          {currentUser?.company?._id && (
            <div className="flex flex-col gap-3">
              <Label htmlFor="companyRole">Cargo na Empresa *</Label>
              <Select
                value={formData.companyRole || ""}
                onValueChange={(value) => setFormData({ ...formData, companyRole: value })}
              >
                <SelectTrigger id="companyRole">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="recruiter">Recrutador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O usuário receberá acesso ao dashboard da empresa com base no cargo selecionado.
              </p>
            </div>
          )}

          <Separator />

          {/* Informações Básicas do Usuário */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="username">Username (ex: @ramonsantxp)</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
                  setFormData({ ...formData, username: value });
                }}
                placeholder="ramonsantxp"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas letras, números, underscores e hífens. Sem espaços.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="password">Nova Senha (deixe em branco para manter)</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="role">Função *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
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
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isRecruiter"
              checked={formData.isRecruiter}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isRecruiter: checked === true })
              }
            />
            <Label htmlFor="isRecruiter" className="cursor-pointer">
              É recrutador
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked === true })
              }
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Conta ativa
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="onboardingCompleted"
              checked={formData.onboardingCompleted}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, onboardingCompleted: checked === true })
              }
            />
            <Label htmlFor="onboardingCompleted" className="cursor-pointer">
              Onboarding concluído
            </Label>
          </div>

          {/* Acesso ao Dashboard */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="dashboardAccess"
              checked={formData.dashboardAccess}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, dashboardAccess: checked === true })
              }
            />
            <Label htmlFor="dashboardAccess" className="cursor-pointer">
              Acesso ao Dashboard (liberado pelo admin master)
            </Label>
          </div>

          <Separator />

          {/* Campos do Profile */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-base">Informações do Perfil</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input
                id="firstName"
                value={formData.profile.firstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, firstName: e.target.value },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={formData.profile.lastName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, lastName: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="headline">Título Profissional</Label>
            <Input
              id="headline"
              value={formData.profile.headline}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, headline: e.target.value },
                })
              }
              placeholder="ex: Desenvolvedor Full Stack"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.profile.location}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, location: e.target.value },
                })
              }
              placeholder="ex: São Paulo, Brasil"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="sector">Setor</Label>
            <Input
              id="sector"
              value={formData.profile.sector}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, sector: e.target.value },
                })
              }
              placeholder="ex: Tecnologia"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={formData.profile.bio}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, bio: e.target.value },
                })
              }
              placeholder="Escreva uma breve biografia..."
              rows={4}
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

