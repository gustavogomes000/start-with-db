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
  ExternalLink,
  Eye,
  Calendar as CalendarIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
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
      // Fetch real recruiters
      const { data: userData, error: userError } = await supabase
        .from("hierarquia_usuarios")
        .select("id, nome, tipo, ativo")
        .order("nome");
      
      if (userError) throw userError;

      // Fetch real survey results from promotion_entries
      const { data: surveyData, error: surveyError } = await supabase
        .from("promotion_entries")
        .select("id, full_name, created_at, promotion_id, whatsapp, message")
        .order("created_at", { ascending: false });

      if (surveyError) throw surveyError;
      
      // Map data for display
      const mappedUsers = userData.map(u => ({
        id: u.id,
        nome: u.nome,
        tipo: u.tipo,
        entrevistas: surveyData.filter(s => s.promotion_id === u.id).length
      }));

      const mappedInterviews = surveyData.map(s => {
        const recruiter = userData.find(u => u.id === s.promotion_id);
        return {
          id: s.id,
          nome: s.full_name,
          data: new Date(s.created_at).toLocaleDateString('pt-BR'),
          status: "Completo",
          entrevistador: recruiter ? recruiter.nome : "Link Direto / Outro",
          detalhes: s.message
        };
      });

      setUsers(mappedUsers);
      setInterviews(mappedInterviews);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do banco.");
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
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col md:flex-row">
      {/* Sidebar / Bottom Nav for Mobile */}
      <div className="w-full md:w-72 bg-white border-b md:border-r flex flex-col shadow-xl z-20 sticky top-0 md:h-screen">
        <div className="p-4 md:p-8 border-b bg-gray-50/50 flex md:flex-col items-center justify-between md:justify-start gap-4">
          <img src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" alt="Logo" className="h-8 md:h-10" />
          <div className="flex items-center gap-3 p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-50">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-[#e91e63] flex items-center justify-center text-white font-black text-sm md:text-xl shadow-lg shadow-pink-100">
              A
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Administrador</p>
              <Badge className="bg-pink-50 text-pink-600 border-none text-[10px] font-bold px-2">SUPER ADMIN</Badge>
            </div>
          </div>
        </div>
        
        <nav className="flex md:flex-col p-2 md:p-6 gap-1 md:gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 font-bold whitespace-nowrap",
              activeTab === "dashboard" ? "bg-[#e91e63] text-white shadow-lg md:shadow-xl shadow-pink-100" : "hover:bg-pink-50 text-gray-500"
            )}
          >
            <LayoutDashboard size={20} />
            <span className="text-sm md:text-base">Geral</span>
          </button>
          <button 
            onClick={() => setActiveTab("interviews")}
            className={cn(
              "flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 font-bold whitespace-nowrap",
              activeTab === "interviews" ? "bg-[#e91e63] text-white shadow-lg md:shadow-xl shadow-pink-100" : "hover:bg-pink-50 text-gray-500"
            )}
          >
            <MessageSquare size={20} />
            <span className="text-sm md:text-base">Pesquisas</span>
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 font-bold whitespace-nowrap",
              activeTab === "users" ? "bg-[#e91e63] text-white shadow-lg md:shadow-xl shadow-pink-100" : "hover:bg-pink-50 text-gray-500"
            )}
          >
            <Users size={20} />
            <span className="text-sm md:text-base">Equipe</span>
          </button>
          <button 
            onClick={handleLogout}
            className="md:hidden flex items-center justify-center p-3 text-red-500"
          >
            <LogOut size={20} />
          </button>
        </nav>

        <div className="hidden md:block p-6 border-t bg-gray-50/50">
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
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="hidden md:flex h-20 bg-white/80 backdrop-blur-md border-b px-10 items-center justify-between z-10">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
            {activeTab === "dashboard" ? "Resumo Geral" : activeTab === "users" ? "Recrutadores" : "Pesquisas Realizadas"}
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full border-2 border-pink-100 p-1">
              <img src="https://rede.deputadasarelli.com.br/assets/fernanda-sarelli-BrFuKmdI.webp" className="w-full h-full object-cover rounded-full" alt="User" />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-10 overflow-y-auto bg-[#fcfcfc] pb-20">
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-bold gap-2"
                              onClick={() => setSelectedInterview(item)}
                            >
                              <Eye size={16} />
                              Ver Respostas
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Interview Details Dialog */}
              <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Respostas da Pesquisa</DialogTitle>
                    <DialogDescription className="text-pink-600 font-bold">
                      Candidata: {selectedInterview?.nome} • Entrevistador: {selectedInterview?.entrevistador}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-6 space-y-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <p className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                        {selectedInterview?.detalhes}
                      </p>
                    </div>
                  </div>
                  <div className="mt-8">
                    <Button 
                      className="w-full h-14 rounded-2xl bg-[#e91e63] font-bold"
                      onClick={() => setSelectedInterview(null)}
                    >
                      FECHAR
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input placeholder="Buscar por candidata ou entrevistador..." className="pl-12 h-14 rounded-2xl border-none shadow-sm" />
                </div>
              </div>

              <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="pl-4 md:pl-8 h-12 md:h-14 text-[10px] md:text-xs font-bold uppercase text-gray-400">Candidata</TableHead>
                        <TableHead className="hidden md:table-cell h-14 text-xs font-bold uppercase text-gray-400">Data</TableHead>
                        <TableHead className="h-12 md:h-14 text-[10px] md:text-xs font-bold uppercase text-gray-400">Entrevistador</TableHead>
                        <TableHead className="hidden md:table-cell h-14 text-xs font-bold uppercase text-gray-400">Status</TableHead>
                        <TableHead className="text-right pr-4 md:pr-8 h-12 md:h-14 text-[10px] md:text-xs font-bold uppercase text-gray-400">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((item) => (
                        <TableRow key={item.id} className="hover:bg-pink-50/30 transition-colors border-b">
                          <TableCell className="pl-4 md:pl-8 font-bold text-gray-900 text-sm md:text-base">{item.nome}</TableCell>
                          <TableCell className="hidden md:table-cell text-gray-500 font-medium">{item.data}</TableCell>
                          <TableCell className="text-gray-600 font-bold text-sm md:text-base">{item.entrevistador}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 font-bold px-3 py-1">
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-4 md:pr-8">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-pink-600 hover:text-pink-700 hover:bg-pink-100 font-bold gap-1 md:gap-2 px-2 md:px-4"
                              onClick={() => setSelectedInterview(item)}
                            >
                              <Eye size={16} />
                              <span className="hidden md:inline">Ver Respostas</span>
                            </Button>
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input placeholder="Buscar recrutadores..." className="pl-10 h-12 rounded-xl border-none shadow-sm" />
                </div>
                <Button className="gap-2 bg-[#e91e63] rounded-xl h-12 px-6 font-bold shadow-lg shadow-pink-100">
                  <Plus size={18} /> Novo Recrutador
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
