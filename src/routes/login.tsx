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
      // Administrador master vai para /admin; demais entrevistadoras vão para /meu-painel
      const isMaster = (data.username || "").toLowerCase() === "administrador";
      navigate({ to: isMaster ? "/admin" : "/meu-painel" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white relative overflow-hidden">
      {/* Top pink area com fade suave no final */}
      <div
        className="absolute top-0 left-0 right-0 h-[50%] z-0"
        style={{
          background:
            "linear-gradient(180deg, #f8b5c4 0%, #f095aa 55%, #ec407a 92%, #e91e63 100%)",
        }}
      />
      {/* Brilho radial discreto */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-72 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Header com foto + logo */}
      <div className="relative z-10 flex flex-col items-center pt-8 px-6">
        <div className="relative w-32 h-32">
          <div
            className="absolute -inset-[3px] rounded-full shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)]"
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
          className="h-24 mt-4 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
        />
        <p className="mt-2 text-[11px] font-semibold tracking-[0.45em] text-white/95 uppercase">
          Painel Administrativo
        </p>
      </div>

      {/* Card com curva orgânica no topo (estilo app premium) */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pt-10">
        {/* Onda SVG de transição rosa → branco */}
        <svg
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          className="block w-full h-8 -mb-px text-white"
          aria-hidden
        >
          <path
            d="M0,40 C100,0 300,0 400,40 Z"
            fill="currentColor"
          />
        </svg>
        <div className="bg-white px-6 pt-2 pb-5 -mt-px">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Lock className="h-3.5 w-3.5 text-[#e91e63]" />
            <span className="text-[11px] font-black tracking-[0.32em] text-gray-700 uppercase">
              Acesso Restrito
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
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
                className="h-14 rounded-2xl bg-gray-50 border border-gray-200 px-5 text-base font-medium focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:border-pink-300"
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
                  className="h-14 rounded-2xl bg-gray-50 border border-gray-200 px-5 pr-12 text-base font-medium focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:border-pink-300"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] rounded-full text-[13px] font-black bg-gradient-to-r from-[#e91e63] via-[#ec407a] to-[#f06292] shadow-[0_10px_25px_-6px_rgba(233,30,99,0.50)] uppercase tracking-[0.3em] active:scale-[0.97] mt-2"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
