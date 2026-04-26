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
    <div className="min-h-screen bg-[#fcfcfc] flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r flex flex-col shadow-xl z-20">
        <div className="p-8 border-b bg-gray-50/50">
          <img src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" alt="Logo" className="h-10 mx-auto" />
          <div className="mt-6 flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-pink-50">
            <div className="w-12 h-12 rounded-xl bg-[#e91e63] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-100">
              A
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Administrador</p>
              <Badge className="bg-pink-50 text-pink-600 border-none text-[10px] font-bold px-2">SUPER ADMIN</Badge>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold",
              activeTab === "dashboard" ? "bg-[#e91e63] text-white shadow-xl shadow-pink-100" : "hover:bg-pink-50 text-gray-500 hover:text-[#e91e63]"
            )}
          >
            <LayoutDashboard size={22} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("interviews")}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold",
              activeTab === "interviews" ? "bg-[#e91e63] text-white shadow-xl shadow-pink-100" : "hover:bg-pink-50 text-gray-500 hover:text-[#e91e63]"
            )}
          >
            <MessageSquare size={22} />
            Pesquisas
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold",
              activeTab === "users" ? "bg-[#e91e63] text-white shadow-xl shadow-pink-100" : "hover:bg-pink-50 text-gray-500 hover:text-[#e91e63]"
            )}
          >
            <Users size={22} />
            Recrutadores
          </button>
        </nav>

        <div className="p-6 border-t bg-gray-50/50 space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-red-50 text-red-500 transition-all font-bold"
          >
            <LogOut size={22} />
            Sair do Sistema
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b px-10 flex items-center justify-between z-10">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
            {activeTab === "dashboard" ? "Resumo Geral" : activeTab === "users" ? "Recrutadores" : "Pesquisas Realizadas"}
          </h2>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-900">Dra. Fernanda Sarelli</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Portal da Mulher</p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-pink-100 p-1">
              <img src="https://rede.deputadasarelli.com.br/assets/fernanda-sarelli-BrFuKmdI.webp" className="w-full h-full object-cover rounded-full" alt="User" />
            </div>
          </div>
        </header>

        <main className="p-10 overflow-y-auto bg-[#fcfcfc]">
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
