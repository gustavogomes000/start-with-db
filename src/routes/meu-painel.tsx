import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, LogOut, Link2, Users, Check, Share2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/meu-painel")({
  component: MeuPainel,
});

type Cadastro = {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  city: string | null;
  created_at: string;
};

function MeuPainel() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ id: string; username: string } | null>(null);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      fetchMine(s.id);
    } catch {
      localStorage.removeItem("admin_session");
      navigate({ to: "/login" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMine(adminId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action: "list_my_entries", admin_id: adminId },
      });
      if (error) throw error;
      if (data?.error === "unauthorized") {
        localStorage.removeItem("admin_session");
        navigate({ to: "/login" });
        return;
      }
      if (data?.error) throw new Error(data.error);
      setCadastros((data?.entries as Cadastro[]) || []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_session");
    navigate({ to: "/login" });
  }

  const meuLink =
    typeof window !== "undefined" && session
      ? `${window.location.origin}/?recruiter=${session.id}`
      : "";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(meuLink);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function compartilharWhats() {
    const msg = encodeURIComponent(
      `Olá! Participe da pesquisa "Voz das Mulheres" da Dra. Fernanda Sarelli. Leva menos de 2 minutos:\n\n${meuLink}`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8f9fb]">
        <p className="text-pink-500 font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fb] pb-10">
      {/* Header */}
      <header
        className="px-5 pt-7 pb-10 text-white relative"
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
              <p className="text-[10px] font-semibold tracking-[0.3em] uppercase opacity-80">
                Olá
              </p>
              <p className="font-bold text-base leading-tight">{session.username}</p>
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

        <div className="mt-7 flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase opacity-80">
              Cadastros
            </p>
            <p className="text-3xl font-black mt-0.5 leading-none">{cadastros.length}</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase opacity-80">
              Hoje
            </p>
            <p className="text-3xl font-black mt-0.5 leading-none">
              {
                cadastros.filter(
                  (c) =>
                    new Date(c.created_at).toDateString() ===
                    new Date().toDateString(),
                ).length
              }
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 -mt-6 relative z-10 space-y-5">
        {/* Card link personalizado */}
        <Card className="border-none shadow-lg shadow-pink-100/40 rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                <Link2 size={16} className="text-pink-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Seu link personalizado</p>
                <p className="text-[11px] text-gray-500">
                  Compartilhe — todo cadastro feito por aqui é vinculado a você.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#f3f4f6] rounded-xl px-3 py-2.5">
              <span className="flex-1 truncate text-[12px] font-medium text-gray-700">
                {meuLink}
              </span>
              <button
                onClick={copiar}
                className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-pink-300 active:scale-95 transition"
                aria-label="Copiar link"
              >
                {copied ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} className="text-gray-600" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                onClick={copiar}
                className="h-11 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-[13px]"
              >
                <Copy size={15} className="mr-1.5" />
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button
                onClick={compartilharWhats}
                variant="outline"
                className="h-11 rounded-xl border-gray-200 text-gray-700 font-semibold text-[13px] hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              >
                <MessageCircle size={15} className="mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista cadastros */}
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-[13px] font-semibold text-gray-700">Seus cadastros</h2>
            <span className="text-[11px] text-gray-400">{cadastros.length} no total</span>
          </div>

          {loading && (
            <p className="text-center text-gray-400 text-sm py-6">Carregando...</p>
          )}

          {!loading && cadastros.length === 0 && (
            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center mb-3">
                  <Share2 size={20} className="text-pink-500" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Nenhum cadastro ainda</p>
                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                  Compartilhe seu link acima — quando alguém preencher,
                  aparecerá aqui automaticamente.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && cadastros.length > 0 && (
            <div className="space-y-2">
              {cadastros.map((c) => (
                <Card
                  key={c.id}
                  className="border-none shadow-sm rounded-2xl"
                >
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 flex items-center justify-center font-bold">
                      {(c.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {c.full_name || "Sem nome"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {c.whatsapp || "—"} ·{" "}
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}{" "}
                        {new Date(c.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
