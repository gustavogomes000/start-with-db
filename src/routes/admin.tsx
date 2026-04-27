import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  LogOut,
  LayoutDashboard,
  Plus,
  Search,
  Eye,
  Shield,
  MessageSquare,
  Trash2,
  Pencil,
  KeyRound,
  MoreVertical,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type Cadastro = {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  cpf: string | null;
  instagram: string | null;
  city: string | null;
  message: string | null;
  created_at: string;
  recruiter_id?: string | null;
  recruiter_name?: string | null;
};

type AdminUser = { id: string; username: string; created_at: string };

function isAdminMaster(username: string) {
  return (username || "").toLowerCase().startsWith("administrador");
}

function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ id: string; username: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "cadastros" | "admins">("dashboard");
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRecruiter, setFilterRecruiter] = useState<string>("all");
  const [selected, setSelected] = useState<Cadastro | null>(null);
  const [newAdminOpen, setNewAdminOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState<{ username: string; password: string; role: "interviewer" | "admin" }>({
    username: "",
    password: "",
    role: "interviewer",
  });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [pwdAdmin, setPwdAdmin] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function buildLink(id: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?recruiter=${id}`;
  }

  async function copiarLink(id: string) {
    try {
      await navigator.clipboard.writeText(buildLink(id));
      setCopiedId(id);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("admin_session");
    if (!raw) {
      navigate({ to: "/login" });
      return;
    }
    try {
      const s = JSON.parse(raw);
      if (!s?.id) throw new Error("invalid");
      setSession({ id: s.id, username: s.username });
      fetchAll(s.id);
    } catch {
      localStorage.removeItem("admin_session");
      navigate({ to: "/login" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll(adminId?: string) {
    const id = adminId ?? session?.id;
    if (!id) return;
    setLoading(true);
    try {
      const [entriesRes, adminsRes] = await Promise.all([
        supabase.functions.invoke("admin-api", {
          body: { action: "list_entries", admin_id: id },
        }),
        supabase.functions.invoke("admin-api", {
          body: { action: "list_admins", admin_id: id },
        }),
      ]);
      if (entriesRes.error) throw entriesRes.error;
      if (adminsRes.error) throw adminsRes.error;
      if (entriesRes.data?.error || adminsRes.data?.error) {
        if (entriesRes.data?.error === "unauthorized" || adminsRes.data?.error === "unauthorized") {
          localStorage.removeItem("admin_session");
          navigate({ to: "/login" });
          return;
        }
        throw new Error(entriesRes.data?.error || adminsRes.data?.error);
      }
      setCadastros((entriesRes.data?.entries as Cadastro[]) || []);
      setAdmins((adminsRes.data?.admins as AdminUser[]) || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_session");
    navigate({ to: "/login" });
  }

  async function createAdmin() {
    if (!session?.id) return;
    const rawName = newAdmin.username.trim();
    if (!rawName || newAdmin.password.length < 6) {
      toast.error("Usuário e senha (mín 6 caracteres) são obrigatórios.");
      return;
    }
    // Aplica convenção: admins têm prefixo "Administrador "
    let finalName = rawName;
    if (newAdmin.role === "admin" && !rawName.toLowerCase().startsWith("administrador")) {
      finalName = `Administrador ${rawName}`;
    }
    if (newAdmin.role === "interviewer" && rawName.toLowerCase().startsWith("administrador")) {
      toast.error('Entrevistadora não pode começar com "Administrador".');
      return;
    }
    setSavingAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: {
          action: "create_admin",
          admin_id: session.id,
          payload: {
            username: finalName,
            password: newAdmin.password,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(
        newAdmin.role === "admin" ? "Administrador criado!" : "Entrevistadora criada!",
      );
      setNewAdmin({ username: "", password: "", role: "interviewer" });
      setNewAdminOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário.");
    } finally {
      setSavingAdmin(false);
    }
  }

  async function saveUsername() {
    if (!session?.id || !editAdmin) return;
    if (!editUsername.trim()) {
      toast.error("Informe um nome de usuário.");
      return;
    }
    setSavingEdit(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: {
          action: "update_admin_username",
          admin_id: session.id,
          payload: { id: editAdmin.id, username: editUsername.trim() },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Nome atualizado!");
      if (editAdmin.id === session.id) {
        const updated = { ...session, username: editUsername.trim() };
        setSession(updated);
        localStorage.setItem(
          "admin_session",
          JSON.stringify({ ...updated, ts: Date.now() }),
        );
      }
      setEditAdmin(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar nome.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function savePassword() {
    if (!session?.id || !pwdAdmin) return;
    if (newPassword.length < 6) {
      toast.error("Senha deve ter ao menos 6 caracteres.");
      return;
    }
    setSavingEdit(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: {
          action: "update_admin_password",
          admin_id: session.id,
          payload: { id: pwdAdmin.id, password: newPassword },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Senha atualizada!");
      setPwdAdmin(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteAdmin(a: AdminUser) {
    if (!session?.id) return;
    if (a.id === session.id) {
      toast.error("Você não pode excluir a si mesmo.");
      return;
    }
    if (!confirm(`Excluir administrador "${a.username}"?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: {
          action: "delete_admin",
          admin_id: session.id,
          payload: { id: a.id },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Administrador excluído.");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir.");
    }
  }

  const interviewers = admins.filter((a) => !isAdminMaster(a.username));

  const filtered = cadastros.filter((c) => {
    if (filterRecruiter !== "all" && c.recruiter_id !== filterRecruiter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.full_name || "").toLowerCase().includes(s) ||
      (c.whatsapp || "").toLowerCase().includes(s) ||
      (c.city || "").toLowerCase().includes(s) ||
      (c.recruiter_name || "").toLowerCase().includes(s)
    );
  });

  if (!session) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#fff5f8]">
        <p className="text-pink-500 font-bold">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#fcfcfc] flex flex-col pb-20">
      {/* Header */}
      <header
        className="px-5 pt-6 pb-8 text-white relative"
        style={{
          background: "linear-gradient(180deg,#ec407a 0%,#e91e63 100%)",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-black text-lg">
              {session.username[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-80">
                Painel
              </p>
              <p className="font-black text-base leading-tight">{session.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center active:scale-95"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase opacity-80">
              Cadastros
            </p>
            <p className="text-2xl font-black mt-1">{cadastros.length}</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase opacity-80">
              Admins
            </p>
            <p className="text-2xl font-black mt-1">{admins.length}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="px-4 -mt-5 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-pink-100/50 p-1.5 flex gap-1">
          {[
            { id: "dashboard", label: "Geral", icon: LayoutDashboard },
            { id: "cadastros", label: "Cadastros", icon: MessageSquare },
            { id: "admins", label: "Equipe", icon: Shield },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all",
                  active
                    ? "bg-gradient-to-br from-[#e91e63] to-[#ec407a] text-white shadow-md"
                    : "text-gray-500",
                )}
              >
                <Icon size={16} />
                <span className="text-[10px] font-black tracking-wider uppercase">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 px-4 pt-5">
        {loading && (
          <p className="text-center text-gray-400 text-sm py-10">Carregando...</p>
        )}

        {!loading && activeTab === "dashboard" && (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 px-1">
              Cadastros recentes
            </h2>
            {cadastros.slice(0, 8).map((c) => (
              <CadastroCard key={c.id} c={c} onOpen={() => setSelected(c)} />
            ))}
            {cadastros.length === 0 && (
              <EmptyState text="Nenhum cadastro ainda." />
            )}
          </div>
        )}

        {!loading && activeTab === "cadastros" && (
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="Buscar por nome, WhatsApp, entrevistadora..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl bg-white border-none shadow-sm"
              />
            </div>

            {/* Filtro por entrevistadora */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => setFilterRecruiter("all")}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition",
                  filterRecruiter === "all"
                    ? "bg-[#e91e63] text-white"
                    : "bg-white text-gray-600 border border-gray-200",
                )}
              >
                Todas ({cadastros.length})
              </button>
              {interviewers.map((a) => {
                const count = cadastros.filter((c) => c.recruiter_id === a.id).length;
                return (
                  <button
                    key={a.id}
                    onClick={() => setFilterRecruiter(a.id)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition",
                      filterRecruiter === a.id
                        ? "bg-[#e91e63] text-white"
                        : "bg-white text-gray-600 border border-gray-200",
                    )}
                  >
                    {a.username} ({count})
                  </button>
                );
              })}
            </div>

            {filtered.map((c) => (
              <CadastroCard key={c.id} c={c} onOpen={() => setSelected(c)} />
            ))}
            {filtered.length === 0 && (
              <EmptyState text="Nenhum cadastro encontrado." />
            )}
          </div>
        )}

        {!loading && activeTab === "admins" && (
          <div className="space-y-3">
            <Button
              onClick={() => setNewAdminOpen(true)}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ec407a] font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-pink-100"
            >
              <Plus size={16} className="mr-1" /> Nova entrevistadora
            </Button>

            {admins.map((a) => {
              const isMaster = (a.username || "").toLowerCase() === "administrador";
              const link = buildLink(a.id);
              return (
                <Card key={a.id} className="border-none shadow-sm rounded-2xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#e91e63] flex items-center justify-center font-black">
                        {a.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-gray-900 truncate">
                          {a.username}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Criado{" "}
                          {new Date(a.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {a.id === session.id && (
                        <Badge className="bg-pink-50 text-[#e91e63] border-none text-[9px] font-bold">
                          VOCÊ
                        </Badge>
                      )}
                      {isMaster && a.id !== session.id && (
                        <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-bold">
                          ADMIN
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400"
                            aria-label="Ações"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditAdmin(a);
                              setEditUsername(a.username);
                            }}
                          >
                            <Pencil size={14} className="mr-2" /> Editar nome
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setPwdAdmin(a);
                              setNewPassword("");
                            }}
                          >
                            <KeyRound size={14} className="mr-2" /> Trocar senha
                          </DropdownMenuItem>
                          {a.id !== session.id && !isMaster && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteAdmin(a)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" /> Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {!isMaster && (
                      <div className="flex items-center gap-2 bg-[#f3f4f6] rounded-xl px-3 py-2">
                        <Link2 size={13} className="text-pink-500 flex-shrink-0" />
                        <span className="flex-1 truncate text-[11px] font-medium text-gray-600">
                          {link}
                        </span>
                        <button
                          onClick={() => copiarLink(a.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-pink-300 active:scale-95 transition"
                          aria-label="Copiar link"
                        >
                          {copiedId === a.id ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} className="text-gray-600" />
                          )}
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Cadastro Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {selected?.full_name || "Cadastro"}
            </DialogTitle>
            <DialogDescription className="text-pink-600 font-bold text-xs uppercase tracking-widest">
              {selected && new Date(selected.created_at).toLocaleString("pt-BR")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2 text-sm">
            {selected?.recruiter_name && (
              <Field label="Entrevistadora" value={selected.recruiter_name} />
            )}
            {selected?.whatsapp && (
              <Field label="WhatsApp" value={selected.whatsapp} />
            )}
            {selected?.cpf && <Field label="CPF" value={selected.cpf} />}
            {selected?.instagram && (
              <Field label="Instagram" value={selected.instagram} />
            )}
            {selected?.city && <Field label="Origem" value={selected.city} />}
            {selected?.message && (
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Respostas
                </p>
                <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                  {selected.message}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New admin dialog */}
      <Dialog open={newAdminOpen} onOpenChange={setNewAdminOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Criar usuário
            </DialogTitle>
            <DialogDescription>
              Escolha o tipo, defina nome e senha. Entrevistadoras recebem link próprio; administradores enxergam tudo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Tipo */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Tipo
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewAdmin({ ...newAdmin, role: "interviewer" })}
                  className={cn(
                    "h-12 rounded-2xl border text-xs font-black uppercase tracking-wider transition",
                    newAdmin.role === "interviewer"
                      ? "bg-[#e91e63] text-white border-[#e91e63]"
                      : "bg-gray-50 text-gray-600 border-gray-200",
                  )}
                >
                  Entrevistadora
                </button>
                <button
                  type="button"
                  onClick={() => setNewAdmin({ ...newAdmin, role: "admin" })}
                  className={cn(
                    "h-12 rounded-2xl border text-xs font-black uppercase tracking-wider transition",
                    newAdmin.role === "admin"
                      ? "bg-[#e91e63] text-white border-[#e91e63]"
                      : "bg-gray-50 text-gray-600 border-gray-200",
                  )}
                >
                  Administrador
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Nome
              </Label>
              <Input
                value={newAdmin.username}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, username: e.target.value })
                }
                className="h-12 rounded-2xl bg-gray-50 border-none px-4"
                placeholder={newAdmin.role === "admin" ? "ex: Joana (vira 'Administrador Joana')" : "ex: maria"}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Senha (mín 6)
              </Label>
              <Input
                type="text"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
                className="h-12 rounded-2xl bg-gray-50 border-none px-4"
                placeholder="••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={createAdmin}
              disabled={savingAdmin}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ec407a] font-black uppercase tracking-[0.2em] text-xs"
            >
              {savingAdmin ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit username dialog */}
      <Dialog open={!!editAdmin} onOpenChange={(o) => !o && setEditAdmin(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Editar nome
            </DialogTitle>
            <DialogDescription>
              Altere o nome de usuário do administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 mt-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Usuário
            </Label>
            <Input
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              className="h-12 rounded-2xl bg-gray-50 border-none px-4"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={saveUsername}
              disabled={savingEdit}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ec407a] font-black uppercase tracking-[0.2em] text-xs"
            >
              {savingEdit ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={!!pwdAdmin} onOpenChange={(o) => !o && setPwdAdmin(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Trocar senha
            </DialogTitle>
            <DialogDescription>
              Defina uma nova senha para{" "}
              <span className="font-bold">{pwdAdmin?.username}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 mt-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Nova senha (mín 6)
            </Label>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 rounded-2xl bg-gray-50 border-none px-4"
              placeholder="••••••"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={savePassword}
              disabled={savingEdit}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ec407a] font-black uppercase tracking-[0.2em] text-xs"
            >
              {savingEdit ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CadastroCard({ c, onOpen }: { c: Cadastro; onOpen: () => void }) {
  return (
    <Card
      className="border-none shadow-sm rounded-2xl active:scale-[0.99] transition cursor-pointer"
      onClick={onOpen}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 text-[#e91e63] flex items-center justify-center font-black">
          {(c.full_name || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-gray-900 truncate">
            {c.full_name || "Sem nome"}
          </p>
          <p className="text-[11px] text-gray-400 truncate">
            {c.whatsapp || "—"} ·{" "}
            {new Date(c.created_at).toLocaleDateString("pt-BR")}
          </p>
          {c.recruiter_name && (
            <p className="text-[10px] text-pink-600 font-bold uppercase tracking-wider truncate mt-0.5">
              por {c.recruiter_name}
            </p>
          )}
        </div>
        <Eye size={16} className="text-pink-400" />
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className="font-bold text-gray-900 text-sm">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <Users className="mx-auto mb-2 opacity-40" size={32} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
