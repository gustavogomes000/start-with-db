import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const p = password;
    if (!u || !p) {
      toast.error("Preencha usuário e senha.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action: "login", payload: { username: u, password: p } },
      });
      if (error) throw error;
      if (!data?.id) {
        toast.error(data?.error === "invalid_credentials" ? "Usuário ou senha inválidos." : (data?.error || "Falha no login."));
        return;
      }
      localStorage.setItem(
        "admin_session",
        JSON.stringify({ id: data.id, username: data.username, ts: Date.now() }),
      );
      toast.success(`Bem-vinda, ${data.username}!`);
      const isMaster = (data.username || "").toLowerCase().startsWith("administrador");
      navigate({ to: isMaster ? "/admin" : "/meu-painel" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-100 px-4 py-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <Card className="relative z-10 w-full max-w-sm border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur">
        <CardContent className="p-8 pt-10">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 mb-4">
              <div
                className="absolute -inset-[3px] rounded-full"
                style={{ background: "linear-gradient(135deg,#ec407a,#e91e63)" }}
              />
              <img
                src="/brand/fernanda-hd.jpeg"
                alt="Dra. Fernanda Sarelli"
                className="relative w-full h-full object-cover rounded-full"
              />
            </div>
            <img
              src="/brand/logo-sarelli.png"
              alt="Logo"
              className="h-20 object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-5">
            <Lock className="h-3.5 w-3.5 text-[#e91e63]" />
            <span className="text-[10px] font-black tracking-[0.32em] text-gray-700 uppercase">
              Acesso Restrito
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500"
              >
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Administrador"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl border-gray-200 px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:border-pink-300"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500"
              >
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 px-4 pr-11 text-sm font-medium focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:border-pink-300"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-[12px] font-black bg-gradient-to-r from-[#e91e63] via-[#ec407a] to-[#f06292] shadow-[0_8px_20px_-6px_rgba(233,30,99,0.50)] uppercase tracking-[0.3em] active:scale-[0.97] mt-2"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
