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
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_check_password", {
        p_username: username.trim(),
        p_password: password,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : null;
      if (!row?.id) {
        toast.error("Usuário ou senha inválidos.");
        return;
      }

      localStorage.setItem(
        "admin_session",
        JSON.stringify({ id: row.id, username: row.username, ts: Date.now() }),
      );
      toast.success(`Bem-vinda, ${row.username}!`);
      navigate({ to: "/admin" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white relative overflow-hidden">
      {/* Pink background */}
      <div
        className="absolute top-0 left-0 right-0 h-[42%] z-0"
        style={{
          background:
            "linear-gradient(180deg, #f8b5c4 0%, #f095aa 60%, #ec407a 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center pt-10 px-6">
        <div className="relative w-28 h-28">
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
          className="h-12 mt-4 object-contain"
        />
        <p className="mt-2 text-[10px] font-bold tracking-[0.4em] text-white/90 uppercase">
          Painel Administrativo
        </p>
      </div>

      <div className="relative z-10 flex-1 flex items-center px-5 pb-10 pt-8">
        <Card className="w-full border-none shadow-[0_20px_50px_-12px_rgba(236,64,122,0.30)] rounded-[28px] bg-white">
          <CardContent className="p-7">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="h-4 w-4 text-[#e91e63]" />
              <span className="text-[10px] font-black tracking-[0.35em] text-gray-700 uppercase">
                Acesso Restrito
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"
                >
                  Usuário
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Administrador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 rounded-2xl bg-gray-50 border-none px-5 text-base font-medium focus-visible:ring-2 focus-visible:ring-pink-300"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"
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
                    className="h-14 rounded-2xl bg-gray-50 border-none px-5 pr-12 text-base font-medium focus-visible:ring-2 focus-visible:ring-pink-300"
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
                className="w-full h-[54px] rounded-2xl text-[13px] font-black bg-gradient-to-r from-[#e91e63] via-[#ec407a] to-[#f06292] shadow-[0_10px_25px_-6px_rgba(233,30,99,0.50)] uppercase tracking-[0.25em] active:scale-[0.97]"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="relative z-10 text-center text-[10px] text-gray-400 font-medium tracking-[0.3em] uppercase pb-5">
        Dra. Fernanda Sarelli · 2026
      </p>
    </div>
  );
}
