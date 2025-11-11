"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { EditCompanyDrawer } from "@/components/admin/edit-company-drawer";
import { CreateCompanyDrawer } from "@/components/admin/create-company-drawer";
import { UserCombobox } from "@/components/admin/user-combobox";
import { CreateUserDrawer } from "@/components/admin/create-user-drawer";
import { EditUserDrawer } from "@/components/admin/edit-user-drawer";
import { CreateVacancyDrawer } from "@/components/admin/create-vacancy-drawer";
import { EditVacancyDrawer } from "@/components/admin/edit-vacancy-drawer";
import { CreateApplicationDrawer } from "@/components/admin/create-application-drawer";
import { EditApplicationDrawer } from "@/components/admin/edit-application-drawer";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const schema = z.object({
  id: z.number(),
  empresa: z.string(),
  tipoSecao: z.string(),
  statusSecao: z.string(),
  meta: z.string(),
  limite: z.string(),
  revisor: z.string(),
});

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Clique e arraste para reordenar</span>
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar tudo"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "tipoSecao",
    header: "Tipo de Seção",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.tipoSecao}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "statusSecao",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.statusSecao;
      const isCompleted =
        status === "Concluído" ||
        status === "Publicada" ||
        status === "Aceita" ||
        status === "Verificada";
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {isCompleted ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : (
            <IconLoader />
          )}
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "meta",
    header: ({ table }) => {
      const firstRow = table.getRowModel().rows[0]?.original;
      const headerText =
        firstRow?.tipoSecao === "Vaga"
          ? "Candidaturas"
          : firstRow?.tipoSecao === "Empresa"
          ? "Vagas"
          : "Quantidade";
      return <div className="w-full text-right">{headerText}</div>;
    },
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.original.meta}</div>
    ),
  },
  {
    accessorKey: "limite",
    header: ({ table }) => {
      const firstRow = table.getRowModel().rows[0]?.original;
      const headerText =
        firstRow?.tipoSecao === "Vaga"
          ? "Visualizações"
          : firstRow?.tipoSecao === "Empresa"
          ? "Seguidores"
          : "Limite";
      return <div className="w-full text-right">{headerText}</div>;
    },
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.original.limite}</div>
    ),
  },
  {
    accessorKey: "revisor",
    header: "Responsável",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.revisor}</div>;
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Fazer uma cópia</DropdownMenuItem>
          <DropdownMenuItem>Favoritar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({
  data: initialData,
  activitiesLast24h,
  mode = "company",
  companies,
  users,
  vacancies,
  applications,
  onCompanyUpdate,
  onUserUpdate,
  onVacancyUpdate,
  onApplicationUpdate,
}: {
  data: z.infer<typeof schema>[];
  activitiesLast24h?: z.infer<typeof schema>[];
  mode?: "admin" | "company";
  companies?: any[];
  users?: any[];
  vacancies?: any[];
  applications?: any[];
  onCompanyUpdate?: (company: any) => void;
  onUserUpdate?: (user: any) => void;
  onVacancyUpdate?: (vacancy: any) => void;
  onApplicationUpdate?: (application: any) => void;
}) {
  const [showLast24h, setShowLast24h] = React.useState(false);
  const [data, setData] = React.useState(() => initialData);

  // Atualizar dados quando showLast24h mudar
  React.useEffect(() => {
    if (showLast24h && activitiesLast24h) {
      setData(activitiesLast24h);
    } else {
      setData(initialData);
    }
  }, [showLast24h, activitiesLast24h, initialData]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  // Filtrar dados por tipo
  const filteredData = React.useMemo(() => {
    return data || [];
  }, [data]);

  const vacanciesData = React.useMemo(() => {
    return filteredData.filter((d: any) => d.tipoSecao === "Vaga");
  }, [filteredData]);

  const applicationsData = React.useMemo(() => {
    return filteredData.filter((d: any) => d.tipoSecao === "Candidatura");
  }, [filteredData]);

  const companiesData = React.useMemo(() => {
    return filteredData.filter((d: any) => d.tipoSecao === "Empresa");
  }, [filteredData]);

  // Dados formatados para modo admin
  const adminCompaniesData = React.useMemo(() => {
    if (!companies) return [];
    return companies.map((company: any, index: number) => ({
      id: index + 1,
      _id:
        typeof company._id === "string"
          ? company._id
          : company._id?.toString?.() || company._id,
      empresa: company.name,
      tipoSecao: "Empresa",
      statusSecao: company.isVerified ? "Verificada" : "Não verificada",
      meta: company.jobsCount?.toString() || "0",
      limite: company.followersCount?.toString() || "0",
      revisor: company.admins?.[0]?.name || "N/A",
      data: company.createdAt,
      tipo: "empresa",
      company: company,
    }));
  }, [companies]);

  const adminUsersData = React.useMemo(() => {
    if (!users) return [];
    return users.map((user: any, index: number) => ({
      id: index + 1,
      _id: user._id,
      empresa: user.name || user.email,
      tipoSecao: "Usuário",
      statusSecao: user.isActive ? "Ativo" : "Inativo",
      meta: user.role || "user",
      limite: user.isRecruiter ? "Recrutador" : "Candidato",
      revisor: user.email,
      data: user.createdAt,
      tipo: "usuario",
      user: user,
    }));
  }, [users]);

  const defaultTab = mode === "admin" ? "empresas" : "atividades";
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  // Handlers para criação
  const handleCreateCompany = (company: any) => {
    if (onCompanyUpdate) {
      onCompanyUpdate(company);
    }
  };

  const handleCreateUser = (user: any) => {
    if (onUserUpdate) {
      onUserUpdate(user);
    }
  };

  const handleCreateVacancy = (vacancy: any) => {
    if (onVacancyUpdate) {
      onVacancyUpdate(vacancy);
    }
  };

  const handleCreateApplication = (application: any) => {
    if (onApplicationUpdate) {
      onApplicationUpdate(application);
    }
  };

  return (
    <Tabs
      defaultValue={defaultTab}
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Visualização
        </Label>
        <Select defaultValue="atividades">
          <SelectTrigger
            className="flex w-fit h-8 @4xl/main:hidden"
            id="view-selector"
          >
            <SelectValue placeholder="Selecionar uma visualização" />
          </SelectTrigger>
          <SelectContent>
            {mode === "admin" ? (
              <>
                <SelectItem value="empresas">Empresas</SelectItem>
                <SelectItem value="usuarios">Usuários</SelectItem>
                <SelectItem value="vagas">Vagas</SelectItem>
                <SelectItem value="candidaturas">Candidaturas</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="atividades">Atividades Recentes</SelectItem>
                <SelectItem value="vagas">Vagas Recentes</SelectItem>
                <SelectItem value="candidaturas">
                  Candidaturas Recentes
                </SelectItem>
                <SelectItem value="empresas">Empresas Recentes</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          {mode === "admin" ? (
            <>
              <TabsTrigger value="empresas">
                Empresas{" "}
                <Badge variant="secondary">{adminCompaniesData.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="usuarios">
                Usuários{" "}
                <Badge variant="secondary">{adminUsersData.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="vagas">
                Vagas{" "}
                <Badge variant="secondary">
                  {data.filter((d: any) => d.tipoSecao === "Vaga").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="candidaturas">
                Candidaturas{" "}
                <Badge variant="secondary">
                  {
                    data.filter((d: any) => d.tipoSecao === "Candidatura")
                      .length
                  }
                </Badge>
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="atividades">Atividades Recentes</TabsTrigger>
              <TabsTrigger value="vagas">
                Vagas Recentes{" "}
                <Badge variant="secondary">
                  {data.filter((d: any) => d.tipoSecao === "Vaga").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="candidaturas">
                Candidaturas{" "}
                <Badge variant="secondary">
                  {
                    data.filter((d: any) => d.tipoSecao === "Candidatura")
                      .length
                  }
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="empresas">Empresas Recentes</TabsTrigger>
            </>
          )}
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Personalizar Colunas</span>
                <span className="lg:hidden">Colunas</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {activitiesLast24h && activitiesLast24h.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filter-24h"
                checked={showLast24h}
                onChange={(e) => setShowLast24h(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              <Label htmlFor="filter-24h" className="text-sm cursor-pointer">
                Últimas 24h
              </Label>
            </div>
          )}
          {mode === "admin" ? (
            activeTab === "empresas" ? (
              <CreateCompanyDrawer
                onSuccess={handleCreateCompany}
                trigger={
                  <Button variant="outline" size="sm">
                    <IconPlus />
                    <span className="hidden lg:inline">Nova Empresa</span>
                    <span className="lg:hidden">Novo</span>
                  </Button>
                }
              />
            ) : activeTab === "usuarios" ? (
              <CreateUserDrawer
                onSuccess={handleCreateUser}
                trigger={
                  <Button variant="outline" size="sm">
                    <IconPlus />
                    <span className="hidden lg:inline">Novo Usuário</span>
                    <span className="lg:hidden">Novo</span>
                  </Button>
                }
              />
            ) : activeTab === "vagas" ? (
              <CreateVacancyDrawer
                onSuccess={handleCreateVacancy}
                companies={companies || []}
                trigger={
                  <Button variant="outline" size="sm">
                    <IconPlus />
                    <span className="hidden lg:inline">Nova Vaga</span>
                    <span className="lg:hidden">Novo</span>
                  </Button>
                }
              />
            ) : activeTab === "candidaturas" ? (
              <CreateApplicationDrawer
                onSuccess={handleCreateApplication}
                vacancies={vacancies || []}
                users={users || []}
                trigger={
                  <Button variant="outline" size="sm">
                    <IconPlus />
                    <span className="hidden lg:inline">Nova Candidatura</span>
                    <span className="lg:hidden">Novo</span>
                  </Button>
                }
              />
            ) : (
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Nova Atividade</span>
                <span className="lg:hidden">Novo</span>
              </Button>
            )
          ) : (
            <Button variant="outline" size="sm">
              <IconPlus />
              <span className="hidden lg:inline">Nova Atividade</span>
              <span className="lg:hidden">Novo</span>
            </Button>
          )}
        </div>
      </div>
      <TabsContent
        value="atividades"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Nenhuma atividade encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} linhas selecionadas.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Linhas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20 h-8" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir para a primeira página</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 bg-transparent"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir para a página anterior</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 bg-transparent"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir para a próxima página</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex bg-transparent"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir para a última página</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="vagas"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="text-sm text-muted-foreground">
          {vacanciesData.length} vagas encontradas
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Candidaturas</TableHead>
                <TableHead className="text-right">Visualizações</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacanciesData.length > 0 ? (
                vacanciesData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.empresa}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.tipoSecao}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.statusSecao}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.meta}</TableCell>
                    <TableCell className="text-right">{row.limite}</TableCell>
                    <TableCell>{row.revisor}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma vaga encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent
        value="candidaturas"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="text-sm text-muted-foreground">
          {applicationsData.length} candidaturas encontradas
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vaga</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Limite</TableHead>
                <TableHead>Candidato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicationsData.length > 0 ? (
                applicationsData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.empresa}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.tipoSecao}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.statusSecao}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.meta}</TableCell>
                    <TableCell className="text-right">{row.limite}</TableCell>
                    <TableCell>{row.revisor}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma candidatura encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      {mode === "admin" ? (
        <>
          <TabsContent
            value="empresas"
            className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
          >
            <div className="text-sm text-muted-foreground">
              {adminCompaniesData.length} empresas encontradas
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Vagas</TableHead>
                    <TableHead className="text-right">Seguidores</TableHead>
                    <TableHead>Admin Principal</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminCompaniesData.length > 0 ? (
                    adminCompaniesData.map((row: any) => (
                      <AdminCompanyRow
                        key={row.id}
                        row={row}
                        onUpdate={onCompanyUpdate}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma empresa encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent
            value="usuarios"
            className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
          >
            <div className="text-sm text-muted-foreground">
              {adminUsersData.length} usuários encontrados
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsersData.length > 0 ? (
                    adminUsersData.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          <EditUserDrawer
                            user={row.user}
                            onUpdate={onUserUpdate || (() => {})}
                            trigger={
                              <Button
                                variant="link"
                                className="text-foreground w-fit px-0 text-left"
                              >
                                {row.empresa}
                              </Button>
                            }
                          />
                        </TableCell>
                        <TableCell>{row.revisor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.statusSecao}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.meta}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.limite}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(row.data).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <EditUserDrawer
                            user={row.user}
                            onUpdate={onUserUpdate || (() => {})}
                            trigger={
                              <Button variant="ghost" size="sm">
                                Editar
                              </Button>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </>
      ) : (
        <TabsContent
          value="empresas"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="text-sm text-muted-foreground">
            {companiesData.length} empresas encontradas
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Vagas</TableHead>
                  <TableHead className="text-right">Seguidores</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companiesData.length > 0 ? (
                  companiesData.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.empresa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.tipoSecao}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.statusSecao}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{row.meta}</TableCell>
                      <TableCell className="text-right">{row.limite}</TableCell>
                      <TableCell>{row.revisor}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma empresa encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}

// Componente para linha de empresa no modo admin
function AdminCompanyRow({
  row,
  onUpdate,
}: {
  row: any;
  onUpdate?: (company: any) => void;
}) {
  const [assigningAdmin, setAssigningAdmin] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState("");

  const handleAssignAdmin = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    setAssigningAdmin(true);
    try {
      const response = await fetch(
        `/api/admin/companies/${row._id}/assign-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: selectedUserId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atribuir admin");
      }

      const data = await response.json();
      toast.success(data.message || "Admin atribuído com sucesso!");
      setSelectedUserId("");
      // Recarregar dados se necessário
      if (onUpdate) {
        // Buscar empresa atualizada
        const companyResponse = await fetch(`/api/admin/companies/${row._id}`);
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          onUpdate(companyData.company);
        }
      }
    } catch (error: any) {
      console.error("Error assigning admin:", error);
      toast.error(error.message || "Erro ao atribuir admin");
    } finally {
      setAssigningAdmin(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <EditCompanyDrawer
          company={row.company}
          onUpdate={onUpdate || (() => {})}
          trigger={
            <Button
              variant="link"
              className="text-foreground w-fit px-0 text-left"
            >
              {row.empresa}
            </Button>
          }
        />
      </TableCell>
      <TableCell>
        <Badge variant="outline">{row.statusSecao}</Badge>
      </TableCell>
      <TableCell className="text-right">{row.meta}</TableCell>
      <TableCell className="text-right">{row.limite}</TableCell>
      <TableCell>{row.revisor}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <UserCombobox
            onSelect={setSelectedUserId}
            placeholder="Atribuir admin..."
          />
          {selectedUserId && (
            <Button
              size="sm"
              onClick={handleAssignAdmin}
              disabled={assigningAdmin}
            >
              {assigningAdmin ? "Atribuindo..." : "Atribuir"}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

const chartData = [
  { month: "Janeiro", desktop: 186, mobile: 80 },
  { month: "Fevereiro", desktop: 305, mobile: 200 },
  { month: "Março", desktop: 237, mobile: 120 },
  { month: "Abril", desktop: 73, mobile: 190 },
  { month: "Maio", desktop: 209, mobile: 130 },
  { month: "Junho", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.empresa}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.empresa}</DrawerTitle>
          <DrawerDescription>
            Exibindo total de visitantes dos últimos 6 meses
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Crescimento de 5,2% este mês{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Exibindo o total de visitantes nos últimos 6 meses. Este é
                  apenas um texto aleatório para testar o layout. Ele se estende
                  por várias linhas e deve se ajustar ao redor.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="empresa">Empresa</Label>
              <Input id="empresa" defaultValue={item.empresa} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="tipoSecao">Tipo de Seção</Label>
                <Select defaultValue={item.tipoSecao}>
                  <SelectTrigger id="tipoSecao" className="w-full">
                    <SelectValue placeholder="Selecionar um tipo de seção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Table of Contents">Índice</SelectItem>
                    <SelectItem value="Executive Summary">
                      Resumo Executivo
                    </SelectItem>
                    <SelectItem value="Technical Approach">
                      Abordagem Técnica
                    </SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Capabilities">Capacidades</SelectItem>
                    <SelectItem value="Focus Documents">
                      Documentos em Foco
                    </SelectItem>
                    <SelectItem value="Narrative">Narrativa</SelectItem>
                    <SelectItem value="Cover Page">Capa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.statusSecao}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Selecionar um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                    <SelectItem value="Não Iniciado">Não Iniciado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="meta">Meta</Label>
                <Input id="meta" defaultValue={item.meta} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limite">Limite</Label>
                <Input id="limite" defaultValue={item.limite} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="revisor">Revisor</Label>
              <Select defaultValue={item.revisor}>
                <SelectTrigger id="revisor" className="w-full">
                  <SelectValue placeholder="Selecionar um revisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Enviar</Button>
          <DrawerClose asChild>
            <Button variant="outline">Pronto</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
