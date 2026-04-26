import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Plus, 
  Search,
  Copy,
  ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      
      // Simulate checking if admin (real implementation would check metadata or roles table)
      setIsAdmin(true); 
      fetchData();
    }
    checkUser();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Mock data for now since we haven't created the new tables yet
      setUsers([
        { id: "1", nome: "Ana Silva", tipo: "Liderança", entrevistas: 12 },
        { id: "2", nome: "Beatriz Costa", tipo: "Fiscal", entrevistas: 8 },
        { id: "3", nome: "Carla Souza", tipo: "Coordenador", entrevistas: 25 },
      ]);
      
      setInterviews([
        { id: "1", nome: "Maria Oliveira", data: "2024-05-20", status: "Completo", entrevistador: "Ana Silva" },
        { id: "2", nome: "Juliana Santos", data: "2024-05-21", status: "Completo", entrevistador: "Beatriz Costa" },
      ]);
    } catch (err) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  const copyRecruiterLink = (id: string) => {
    const url = `${window.location.origin}/?recruiter=${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link personalizado copiado!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-6 border-b">
          <img src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" alt="Logo" className="h-8" />
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              activeTab === "dashboard" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("interviews")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              activeTab === "interviews" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            <MessageSquare size={20} />
            Entrevistas
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              activeTab === "users" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            <Users size={20} />
            Usuários
          </button>
        </nav>

        <div className="p-4 border-t space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <Settings size={20} />
            Configurações
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {activeTab === "dashboard" ? "Resumo Geral" : activeTab}
          </h2>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">Super Admin</Badge>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
          </div>
        </header>

        <main className="p-8 overflow-y-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total de Entrevistas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">1,284</div>
                    <p className="text-xs text-green-500 mt-1 flex items-center">+12% este mês</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase">Recrutadores Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">42</div>
                    <p className="text-xs text-slate-500 mt-1">Em 8 cidades</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase">Meta Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">85%</div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Entrevistas Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidata</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Entrevistador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>{item.data}</TableCell>
                          <TableCell>{item.entrevistador}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Ver Detalhes</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input placeholder="Buscar usuários..." className="pl-10" />
                </div>
                <Button className="gap-2">
                  <Plus size={18} /> Novo Usuário
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Entrevistas</TableHead>
                        <TableHead>Link Personalizado</TableHead>
                        <TableHead className="text-right pr-6">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="pl-6 font-medium">{user.nome}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.tipo}</Badge>
                          </TableCell>
                          <TableCell>{user.entrevistas}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-100 px-2 py-1 rounded text-xs">.../recruiter={user.id}</code>
                              <button 
                                onClick={() => copyRecruiterLink(user.id)}
                                className="p-1 hover:bg-slate-100 rounded text-primary transition-colors"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="sm">Editar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
