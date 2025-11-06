"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, HelpCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "./ToastProvider";

interface Company {
  _id: string;
  name: string;
}

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: () => void;
}

const workLocationTypes = [
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
];

const jobTypes = [
  { value: "full-time", label: "Tempo integral" },
  { value: "part-time", label: "Meio período" },
  { value: "contract", label: "Contrato" },
  { value: "internship", label: "Estágio" },
];

export default function CreateJobModal({
  open,
  onOpenChange,
  onJobCreated,
}: CreateJobModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    companyId: "",
    workLocationType: "",
    location: "",
    jobType: "",
    description: "",
    salaryMin: "",
    salaryMax: "",
    requirements: [] as string[],
    benefits: [] as string[],
  });
  const [workLocationOpen, setWorkLocationOpen] = useState(false);
  const [jobTypeOpen, setJobTypeOpen] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  useEffect(() => {
    if (open && session) {
      fetchCompanies();
    }
  }, [open, session]);

  const fetchCompanies = async () => {
    try {
      // Buscar empresas do usuário
      const response = await fetch("/api/companies/search?myCompanies=true");
      const data = await response.json();
      if (response.ok && data.companies) {
        setCompanies(data.companies);
        // Pre-preencher com a primeira empresa se houver
        if (data.companies.length > 0) {
          setFormData((prev) => ({
            ...prev,
            companyId: data.companies[0]._id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          type: "success",
          title: "Vaga criada com sucesso!",
        });
        onJobCreated?.();
        onOpenChange(false);
        // Reset form
        setFormData({
          title: "",
          companyId: companies[0]?._id || "",
          workLocationType: "",
          location: "",
          jobType: "",
          description: "",
          salaryMin: "",
          salaryMax: "",
          requirements: [],
          benefits: [],
        });
      } else {
        toast({
          type: "error",
          title: data.error || "Erro ao criar vaga",
        });
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Erro ao criar vaga",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const selectedWorkLocation = workLocationTypes.find(
    (type) => type.value === formData.workLocationType
  );
  const selectedJobType = jobTypes.find((type) => type.value === formData.jobType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Anuncie uma vaga agora
          </DialogTitle>
          <DialogDescription>
            A melhor escolha para aumentar a qualidade das contratações¹
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cargo */}
          <div>
            <Label htmlFor="title" className="flex items-center gap-1">
              Cargo
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Adicione o cargo para o qual você está contratando"
              className="mt-1"
            />
          </div>

          {/* Empresa */}
          <div>
            <Label htmlFor="companyId">Empresa</Label>
            <select
              id="companyId"
              required
              value={formData.companyId}
              onChange={(e) =>
                setFormData({ ...formData, companyId: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de local de trabalho */}
          <div>
            <Label htmlFor="workLocationType">Tipo de local de trabalho</Label>
            <Popover open={workLocationOpen} onOpenChange={setWorkLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={workLocationOpen}
                  className="w-full justify-between mt-1"
                >
                  {selectedWorkLocation
                    ? selectedWorkLocation.label
                    : "Selecione o tipo..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar tipo..." />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {workLocationTypes.map((type) => (
                        <CommandItem
                          key={type.value}
                          value={type.value}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              workLocationType: type.value,
                            });
                            setWorkLocationOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.workLocationType === type.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {type.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Localidade da vaga */}
          <div>
            <Label htmlFor="location" className="flex items-center gap-1">
              Localidade da vaga
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </Label>
            <Input
              id="location"
              required
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Cunha, São Paulo, Brasil"
              className="mt-1"
            />
          </div>

          {/* Tipo de vaga */}
          <div>
            <Label htmlFor="jobType">Tipo de vaga</Label>
            <Popover open={jobTypeOpen} onOpenChange={setJobTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={jobTypeOpen}
                  className="w-full justify-between mt-1"
                >
                  {selectedJobType ? selectedJobType.label : "Selecione o tipo..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar tipo..." />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {jobTypes.map((type) => (
                        <CommandItem
                          key={type.value}
                          value={type.value}
                          onSelect={() => {
                            setFormData({ ...formData, jobType: type.value });
                            setJobTypeOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.jobType === type.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {type.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição da vaga</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva a vaga, responsabilidades e requisitos..."
              rows={6}
              className="mt-1"
            />
          </div>

          {/* Salário (opcional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salaryMin">Salário Mínimo (R$)</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) =>
                  setFormData({ ...formData, salaryMin: e.target.value })
                }
                placeholder="Ex: 5000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="salaryMax">Salário Máximo (R$)</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) =>
                  setFormData({ ...formData, salaryMax: e.target.value })
                }
                placeholder="Ex: 8000"
                className="mt-1"
              />
            </div>
          </div>

          {/* Requisitos */}
          <div>
            <Label>Requisitos</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
                placeholder="Adicionar requisito"
              />
              <Button type="button" onClick={addRequirement}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requirements.map((req, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {req}
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Benefícios */}
          <div>
            <Label>Benefícios</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Adicionar benefício"
              />
              <Button type="button" onClick={addBenefit}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Botão de submit */}
          <div className="space-y-4 pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando vaga..." : "Comece gratuitamente"}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Pode haver limites de anúncios de vaga gratuitos.{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Veja nossa política
              </a>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
