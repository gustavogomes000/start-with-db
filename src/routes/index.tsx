import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Send, User, MessageSquare, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: QuestionnaireComponent,
});

const QUESTIONS = [
  {
    id: 1,
    question: "O que mais te preocupa hoje na sua vida ou na vida da sua família?",
    placeholder: "Ex: economia, segurança, saúde, filhos, trabalho...",
  },
  {
    id: 2,
    question: "Você sente que tem apoio suficiente (do governo, da comunidade ou da família) no seu dia a dia? O que falta?",
    placeholder: "Ex: creche, saúde, renda, segurança...",
  },
  {
    id: 3,
    question: "Qual foi a maior dificuldade que você enfrentou nos últimos anos como mulher?",
    placeholder: "Histórias de superação, desafios no trabalho, sobrecarga...",
  },
  {
    id: 4,
    question: "O que precisa melhorar na sua cidade para que a vida das mulheres seja melhor?",
    placeholder: "Ex: transporte, iluminação, saúde, oportunidades...",
  },
  {
    id: 5,
    question: "Se você pudesse mudar uma coisa imediatamente na sua vida ou na sociedade, o que seria?",
    placeholder: "Seu maior desejo ou prioridade para o futuro...",
  },
];

// Steps:
// 0 = welcome
// 1 = quem está entrevistando (select)
// 2 = dados pessoais da entrevistada
// 3 = perguntas (sub-pergunta atual em questionIndex)
// 4 = sucesso
function QuestionnaireComponent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [users, setUsers] = useState<{ id: string; nome: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    whatsapp: "",
    instagram: "",
  });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const recruiterId = searchParams.get("recruiter");

  useEffect(() => {
    async function fetchData() {
      // Load interviewers via edge function (bypasses RLS, always returns admin users)
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action: "list_interviewers" },
      });
      if (!error && data?.interviewers) {
        setUsers(data.interviewers.map((u: any) => ({ id: u.id, nome: u.username })));
      }
      if (recruiterId) {
        setSelectedUserId(recruiterId);
      }
    }
    fetchData();
  }, [recruiterId]);

  const handleNext = async () => {
    if (step === 1) {
      if (!selectedUserId) {
        toast.error("Selecione quem está entrevistando.");
        return;
      }
      if (!formData.nome || !formData.whatsapp || !formData.dataNascimento || !formData.cpf || !formData.instagram) {
        toast.error("Preencha todos os campos.");
        return;
      }
      const cpfDigits = formData.cpf.replace(/\D/g, "");
      if (!isValidCPF(cpfDigits)) {
        toast.error("CPF inválido. Confira os números digitados.");
        return;
      }
      // Validar data de nascimento (não pode ser no futuro)
      const nasc = new Date(formData.dataNascimento);
      if (isNaN(nasc.getTime())) {
        toast.error("Data de nascimento inválida.");
        return;
      }
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      if (nasc > hoje) {
        toast.error("Data de nascimento não pode ser no futuro.");
        return;
      }
      if (nasc.getFullYear() < 1900) {
        toast.error("Data de nascimento inválida.");
        return;
      }
      // Checar CPF duplicado no servidor antes de prosseguir (fetch direto p/ tratar 409 sem virar exceção)
      setLoading(true);
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;
        const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anon,
            Authorization: `Bearer ${anon}`,
          },
          body: JSON.stringify({ action: "check_cpf", payload: { cpf: cpfDigits } }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          if (payload?.error === "cpf_duplicate") {
            toast.error("Este CPF já foi cadastrado anteriormente.");
            return;
          }
          if (payload?.error === "cpf_invalid") {
            toast.error("CPF inválido.");
            return;
          }
          toast.error("Não foi possível validar o CPF. Tente novamente.");
          return;
        }
      } catch {
        toast.error("Erro de conexão. Tente novamente.");
        return;
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!answers[questionIndex] || answers[questionIndex].trim().length < 5) {
        toast.error("Responda com mais detalhes.");
        return;
      }
      if (questionIndex < QUESTIONS.length - 1) {
        setQuestionIndex(questionIndex + 1);
        return;
      }
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 2 && questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      return;
    }
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const allAnswers = QUESTIONS.map((q, i) => `${q.id}. ${q.question}\nR: ${answers[i] || ""}`).join("\n\n");
      const cpfDigits = formData.cpf.replace(/\D/g, "");

      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: {
          action: "submit_entry",
          payload: {
            full_name: formData.nome,
            whatsapp: formData.whatsapp,
            cpf: cpfDigits,
            instagram: formData.instagram,
            data_nascimento: formData.dataNascimento,
            recruiter_id: selectedUserId,
            answers_text: allAnswers,
          },
        },
      });

      // Tenta extrair payload de erro mesmo quando o status é não-2xx
      let payload: any = data;
      if (error && (error as any).context?.json) {
        try { payload = await (error as any).context.json(); } catch {}
      } else if (error && (error as any).context?.text) {
        try { payload = JSON.parse(await (error as any).context.text()); } catch {}
      }

      if (payload?.error === "cpf_duplicate") {
        toast.error("Este CPF já foi cadastrado anteriormente.");
        return;
      }
      if (payload?.error === "cpf_invalid") {
        toast.error("CPF inválido.");
        return;
      }
      if (error) throw error;
      if (payload?.error) throw new Error(payload.error);

      toast.success("Respostas enviadas!");
      setStep(3);
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao salvar: ${err.message ?? "tente novamente"}`);
    } finally {
      setLoading(false);
    }
  };

  function isValidCPF(cpf: string): boolean {
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let d1 = (sum * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    let d2 = (sum * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === parseInt(cpf[10]);
  }

  function maskCPF(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function maskPhone(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d)/, "($1) $2-$3");
    return d.replace(/(\d{2})(\d{5})(\d)/, "($1) $2-$3");
  }



  if (step === 0) {
    return (
      <div
        className="h-[100dvh] w-full flex flex-col relative overflow-hidden"
        style={{ background: "#ffffff" }}
      >
        {/* Top pink area — official light pink from website */}
        <div
          className="absolute top-0 left-0 right-0 h-[60%] z-0"
          style={{
            background:
              "linear-gradient(180deg, #f8b5c4 0%, #f5a5b8 55%, #f095aa 100%)",
          }}
        />

        {/* Acesso discreto ao painel */}
        <Link
          to="/login"
          aria-label="Acesso ao painel"
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/30 active:scale-95 transition"
        >
          <Lock size={13} strokeWidth={2.2} />
        </Link>

        {/* Soft white glow on the pink */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120%] h-80 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)",
          }}
        />

        {/* Curved gold flourish — signature element from official site */}
        <svg
          className="absolute z-[2] left-0 right-0 pointer-events-none"
          style={{ top: "calc(60% - 20px)" }}
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          width="100%"
          height="40"
        >
          <defs>
            <linearGradient id="goldFlourish" x1="0" x2="1">
              <stop offset="0%" stopColor="#d4a04a" stopOpacity="0" />
              <stop offset="50%" stopColor="#e6b85c" stopOpacity="1" />
              <stop offset="100%" stopColor="#d4a04a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 20 25 Q 200 -10 380 25"
            stroke="url(#goldFlourish)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Discreet admin access (bottom-right corner) */}
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          aria-label="Acesso administrativo"
          className="absolute bottom-2 right-2 z-30 w-6 h-6 rounded-full opacity-20 hover:opacity-60 active:opacity-90 transition-opacity flex items-center justify-center"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        </button>

        {/* Top label */}
        <div className="relative z-10 flex items-center justify-center pt-7">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <span className="text-[10px] font-bold tracking-[0.45em] text-white uppercase">
              Pesquisa Oficial · 2026
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
        </div>

        {/* HERO: portrait centered + logo below (matching official layout) */}
        <div className="relative z-10 flex flex-col items-center pt-6 px-6">
          {/* Portrait with thin pink ring */}
          <div className="relative w-44 h-44">
            {/* Pink outer ring */}
            <div
              className="absolute -inset-[3px] rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #ec407a 0%, #e91e63 100%)",
              }}
            />
            <img
              src="/brand/fernanda-hd.jpeg"
              alt="Dra. Fernanda Sarelli"
              className="relative w-full h-full object-cover rounded-full"
            />
          </div>

          {/* Official logo */}
          <div className="w-full flex justify-center mt-5">
            <img
              src="/brand/logo-sarelli.png"
              alt="Doutora Fernanda Sarelli — Chama a Doutora"
              className="h-32 w-auto mx-auto object-contain block drop-shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
            />
          </div>
        </div>

        {/* Floating CTA card */}
        <div className="relative z-10 flex-1 flex items-end px-5 pb-7">
          <div className="w-full bg-white rounded-[28px] px-7 pt-6 pb-6 shadow-[0_20px_50px_-12px_rgba(236,64,122,0.30)] border border-pink-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-[2px] w-5 bg-gradient-to-r from-[#e91e63] to-[#e6b85c] rounded-full" />
              <span className="text-[10px] font-black tracking-[0.35em] text-[#c9a227] uppercase">
                Sua Voz Importa
              </span>
            </div>

            <h1 className="text-[2rem] leading-[1] font-black text-gray-900 tracking-tight">
              Voz das{" "}
              <span className="bg-gradient-to-r from-[#e91e63] to-[#ec407a] bg-clip-text text-transparent">
                Mulheres
              </span>
            </h1>

            <p className="mt-3 text-[14px] text-gray-500 font-medium leading-snug">
              Sua opinião é a força que transforma Goiás. Leva menos de 2 minutos.
            </p>

            <Button
              onClick={() => setStep(1)}
              className="mt-5 w-full h-[54px] rounded-2xl text-[14px] font-black bg-gradient-to-r from-[#e91e63] via-[#ec407a] to-[#f06292] bg-[length:200%_auto] hover:bg-right transition-all duration-700 shadow-[0_10px_25px_-6px_rgba(233,30,99,0.50)] border-none text-white active:scale-[0.97] uppercase tracking-[0.2em]"
            >
              Começar agora
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return <SuccessScreen />;
  }

  // Steps 1, 2
  const stepTitle =
    step === 1
      ? "Dados da Entrevistada"
      : `Pergunta ${questionIndex + 1} de ${QUESTIONS.length}`;
  const progress =
    step === 1 ? 0.3 : 0.3 + ((questionIndex + 1) / QUESTIONS.length) * 0.7;
  const isLastQuestion = step === 2 && questionIndex === QUESTIONS.length - 1;

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      {/* App bar — Material 3 style */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/logo-sarelli.png" alt="Sarelli" className="h-12" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-medium text-gray-400 tracking-wide">Pesquisa Oficial</span>
              <span className="text-[13px] font-semibold text-gray-800">Voz das Mulheres</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-pink-50 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-pink-700">
                {step === 1 ? "Cadastro" : `${questionIndex + 1}/${QUESTIONS.length}`}
              </span>
            </div>
            <Link
              to="/login"
              aria-label="Acesso ao painel"
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-pink-600 hover:bg-pink-50 transition"
            >
              <Lock size={12} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
        {/* linear progress (Material) */}
        <div className="h-[3px] w-full bg-pink-50">
          <div
            className="h-full bg-pink-500 transition-all duration-700 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-32 overflow-y-auto">
        <div className="max-w-md mx-auto">

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="px-1 mb-2">
                <h2 className="text-[22px] font-semibold text-gray-900 tracking-tight">Dados da entrevistada</h2>
                <p className="text-sm text-gray-500 mt-1">Preencha as informações para começar.</p>
              </div>

              {/* Card entrevistador */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                    <User className="text-pink-600" size={16} />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700">Entrevistador responsável</span>
                </div>
                <div className="relative">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#f3f4f6] border border-transparent appearance-none text-[15px] font-medium text-gray-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                  >
                    <option value="">Selecione um entrevistador</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.nome}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 rotate-90 pointer-events-none" />
                </div>
                {users.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">Carregando entrevistadores...</p>
                )}
              </div>

              {/* Card dados pessoais */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                    <MessageSquare className="text-pink-600" size={16} />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700">Informações pessoais</span>
                </div>

                {[
                  { key: "nome", label: "Nome completo", placeholder: "Ex: Maria Silva", type: "text" },
                  { key: "cpf", label: "CPF", placeholder: "000.000.000-00", type: "text" },
                  { key: "whatsapp", label: "WhatsApp", placeholder: "(00) 00000-0000", type: "tel" },
                  { key: "dataNascimento", label: "Data de nascimento", placeholder: "", type: "date" },
                  { key: "instagram", label: "Instagram", placeholder: "@perfil", type: "text" },
                ].map((field) => {
                  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    let v = e.target.value;
                    if (field.key === "cpf") v = maskCPF(v);
                    else if (field.key === "whatsapp") v = maskPhone(v);
                    setFormData({ ...formData, [field.key]: v });
                  };
                  const inputMode = field.key === "cpf" || field.key === "whatsapp" ? "numeric" : undefined;
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-gray-600 px-1">{field.label}</Label>
                      <Input
                        type={field.type}
                        inputMode={inputMode}
                        value={(formData as any)[field.key]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="h-12 rounded-xl bg-[#f3f4f6] border border-transparent px-4 text-[15px] font-medium text-gray-900 focus:outline-none focus-visible:ring-0 focus:border-pink-500 focus:bg-white transition-all"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-400">
              {/* Indicador de pergunta com números — estilo Google Forms */}
              <div className="flex items-center gap-1.5 mb-5 px-1 overflow-x-auto">
                {QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 h-1.5 rounded-full transition-all duration-500 ${
                      i === questionIndex
                        ? "w-8 bg-pink-500"
                        : i < questionIndex
                        ? "w-4 bg-pink-300"
                        : "w-4 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Card principal */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Topo com número grande */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center text-[15px] font-semibold shadow-[0_4px_12px_rgba(236,72,153,0.35)]">
                      {questionIndex + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        Pergunta {questionIndex + 1} de {QUESTIONS.length}
                      </span>
                      <h2 className="text-[19px] leading-snug font-semibold text-gray-900 mt-1.5">
                        {QUESTIONS[questionIndex].question}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Campo de resposta */}
                <div className="p-6 pt-5">
                  <Label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Resposta da entrevistada
                  </Label>
                  <textarea
                    className="w-full min-h-[180px] p-4 rounded-xl bg-[#f8f9fb] border border-gray-200 focus:outline-none focus:border-pink-500 focus:bg-white transition-all text-[15px] text-gray-900 resize-none placeholder:text-gray-400 leading-relaxed"
                    placeholder={QUESTIONS[questionIndex].placeholder}
                    value={answers[questionIndex] || ""}
                    onChange={(e) => setAnswers({ ...answers, [questionIndex]: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer / botões — estilo Material 3 */}
      <footer className="p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 fixed bottom-0 w-full z-20">
        <div className="max-w-md mx-auto flex gap-3">
          {(step > 1 || (step === 2 && questionIndex > 0)) && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-13 px-5 rounded-full text-pink-600 hover:bg-pink-50 font-medium text-[14px] active:scale-95 transition-all"
            >
              <ChevronLeft size={18} className="mr-1" />
              Voltar
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={loading}
            className="h-13 flex-1 rounded-full text-[15px] font-medium bg-pink-600 hover:bg-pink-700 shadow-[0_4px_12px_rgba(236,72,153,0.35)] text-white active:scale-[0.98] transition-all"
          >
            {loading ? "Enviando..." : isLastQuestion ? "Finalizar" : "Continuar"}
            {!loading && <ChevronRight size={18} className="ml-1" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}
function SuccessScreen() {
  const INSTAGRAM_URL = "https://www.instagram.com/drafernandasarelli/";
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const timeout = setTimeout(() => {
      window.location.href = INSTAGRAM_URL;
    }, 2500);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(34,197,94,0.35)]">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Cadastro realizado!
          </h2>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            Tudo certo. Sua participação foi registrada com sucesso.
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-gray-500">
            Redirecionando para o Instagram da
          </p>
          <p className="text-[14px] font-semibold text-pink-600 mt-0.5">
            @drafernandasarelli
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
            <span className="text-[12px] font-medium text-gray-400 tabular-nums">
              em {countdown}s
            </span>
          </div>
        </div>
        <a
          href={INSTAGRAM_URL}
          className="inline-block text-[13px] font-medium text-gray-400 hover:text-pink-600 transition-colors"
        >
          Ir agora →
        </a>
      </div>
    </div>
  );
}
