import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Send, User, MessageSquare } from "lucide-react";

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

  const handleNext = () => {
    if (step === 1) {
      if (!selectedUserId) {
        toast.error("Selecione quem está entrevistando.");
        return;
      }
      if (!formData.nome || !formData.whatsapp || !formData.dataNascimento || !formData.cpf || !formData.instagram) {
        toast.error("Preencha todos os campos.");
        return;
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

      const interviewerName = users.find((u) => u.id === selectedUserId)?.nome || "—";
      const fullMessage = `Entrevistador: ${interviewerName} (${selectedUserId})\nNascimento: ${formData.dataNascimento}\n\n${allAnswers}`;

      const { error } = await supabase.from("promotion_entries").insert({
        full_name: formData.nome,
        whatsapp: formData.whatsapp,
        phone: formData.whatsapp,
        cpf: formData.cpf,
        instagram: formData.instagram,
        city: "Voz das Mulheres",
        message: fullMessage,
      });

      if (error) throw error;

      await supabase.from("cadastros_fernanda").insert({
        nome: formData.nome,
        telefone: formData.whatsapp,
        instagram: formData.instagram,
        cadastrado_por: selectedUserId,
        cidade: "Pesquisa Voz das Mulheres",
      });

      toast.success("Respostas enviadas!");
      setStep(3);
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


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
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url('https://rede.deputadasarelli.com.br/assets/bg-pattern.svg')`,
            backgroundSize: "400px",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="w-full max-w-sm text-center space-y-10 animate-in fade-in zoom-in duration-700 z-10">
          <div className="relative mx-auto w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-pink-100">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
            <Send className="text-green-500" size={48} strokeWidth={3} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              Muito<br />obrigado!
            </h2>
            <div className="w-12 h-1 bg-green-500 mx-auto rounded-full" />
            <p className="text-gray-500 font-medium text-lg leading-tight">
              Sua participação é fundamental para construirmos um futuro melhor.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full h-20 rounded-[2rem] text-xl font-black bg-gradient-to-r from-[#e91e63] to-[#ff9800] shadow-xl shadow-pink-100 active:scale-95 transition-transform uppercase tracking-wider"
          >
            Nova Entrevista
          </Button>
        </div>
      </div>
    );
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
            <img src="/brand/logo-sarelli.png" alt="Sarelli" className="h-8" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-medium text-gray-400 tracking-wide">Pesquisa Oficial</span>
              <span className="text-[13px] font-semibold text-gray-800">Voz das Mulheres</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-pink-50 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-pink-700">
              {step === 1 ? "Cadastro" : `${questionIndex + 1}/${QUESTIONS.length}`}
            </span>
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
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-gray-600 px-1">{field.label}</Label>
                    <Input
                      type={field.type}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="h-12 rounded-xl bg-[#f3f4f6] border border-transparent px-4 text-[15px] font-medium text-gray-900 focus:outline-none focus-visible:ring-0 focus:border-pink-500 focus:bg-white transition-all"
                    />
                  </div>
                ))}
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

              <p className="text-[12px] text-gray-400 mt-4 px-2 text-center">
                Capture a fala da entrevistada com fidelidade.
              </p>
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