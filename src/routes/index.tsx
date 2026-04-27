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
    type: "textarea",
  },
  {
    id: 2,
    question: "Você sente que tem apoio suficiente (do governo, da comunidade ou da família) no seu dia a dia? O que falta?",
    placeholder: "Ex: creche, saúde, renda, segurança...",
    type: "textarea",
  },
  {
    id: 3,
    question: "Qual foi a maior dificuldade que você enfrentou nos últimos anos como mulher?",
    placeholder: "Histórias de superação, desafios no trabalho, sobrecarga...",
    type: "textarea",
  },
  {
    id: 4,
    question: "O que precisa melhorar na sua cidade para que a vida das mulheres seja melhor?",
    placeholder: "Ex: transporte, iluminação, saúde, oportunidades...",
    type: "textarea",
  },
  {
    id: 5,
    question: "Se você pudesse mudar uma coisa imediatamente na sua vida ou na sociedade, o que seria?",
    placeholder: "Seu maior desejo ou prioridade para o futuro...",
    type: "textarea",
  },
  {
    id: 6,
    question: "Você votaria em uma mulher que está disposta a lutar e defender esses ideais?",
    type: "choice",
    options: ["Sim", "Não", "Talvez"],
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
      // Checar CPF duplicado no servidor antes de prosseguir
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
        const payload = await res.json().catch(() => ({}));
        if (payload?.error === "cpf_duplicate") {
          toast.error("Este CPF já foi cadastrado anteriormente.");
          return;
        }
        if (payload?.error === "cpf_invalid") {
          toast.error("CPF inválido.");
          return;
        }
        if (payload?.error || !res.ok) {
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
      const currentAnswer = answers[questionIndex];
      const currentQuestion = QUESTIONS[questionIndex];
      if (!currentAnswer || (currentQuestion.type !== 'choice' && currentAnswer.trim().length < 5)) {
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

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
        body: JSON.stringify({
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
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (payload?.error === "cpf_duplicate") {
        toast.error("Este CPF já foi cadastrado anteriormente.");
        return;
      }
      if (payload?.error === "cpf_invalid") {
        toast.error("CPF inválido.");
        return;
      }
      if (payload?.error || !res.ok) {
        toast.error("Não foi possível enviar. Tente novamente.");
        return;
      }

      toast.success("Respostas enviadas!");
      setStep(3);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
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
      <div className="min-h-[100dvh] w-full bg-[#f0f4f9] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-[500px] bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative border border-gray-100">
          
          {/* Top colored accent line (Google Forms style) */}
          <div className="h-3 w-full bg-pink-600" />

          {/* Discreet admin access */}
          <Link
            to="/login"
            aria-label="Acesso ao painel"
            className="absolute top-6 right-5 z-30 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-pink-600 hover:bg-pink-50 transition-all"
          >
            <Lock size={14} strokeWidth={2.5} />
          </Link>

          <div className="px-8 py-12 flex flex-col items-center text-center">
            
            <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mb-6">
              <MessageSquare className="text-pink-600 w-8 h-8" strokeWidth={1.5} />
            </div>

            <span className="text-[11px] font-bold tracking-[0.2em] text-pink-500 uppercase mb-3">
              Pesquisa de Opinião Oficial
            </span>

            <h1 className="text-[2.2rem] leading-[1.1] font-black text-gray-900 tracking-tight mb-4">
              Voz das Mulheres
            </h1>

            <p className="text-[15px] text-gray-600 font-medium leading-relaxed mb-10 px-2">
              Queremos entender as suas necessidades e ideias. Participe da nossa pesquisa para ajudar a construir um futuro melhor para todas. 
              <br/><br/>
              Leva apenas 2 minutinhos.
            </p>

            <Button
              onClick={() => setStep(1)}
              className="w-full h-14 rounded-2xl text-[15px] font-semibold bg-pink-600 hover:bg-pink-700 shadow-[0_4px_12px_rgba(219,39,119,0.3)] border-none text-white active:scale-[0.98] transition-all flex items-center justify-center"
            >
              Iniciar Pesquisa
              <ChevronRight className="ml-2 h-5 w-5" />
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
    <div className="min-h-[100dvh] w-full bg-gray-50 flex items-center justify-center p-0 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] h-[100dvh] sm:h-[800px] sm:rounded-[40px] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-[#f8f9fb] flex flex-col relative overflow-hidden">
        {/* App bar — Material 3 style */}
        <header className="bg-white border-b border-gray-100 flex-shrink-0 z-20">
          <div className="px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <MessageSquare size={20} />
            </div>
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

      <main className="flex-1 px-4 pt-6 pb-28 overflow-y-auto">
        <div className="w-full">

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
                  {QUESTIONS[questionIndex].type === 'choice' ? (
                    <div className="space-y-3 mt-4">
                      {QUESTIONS[questionIndex].options?.map((option) => (
                        <button
                          key={option}
                          onClick={() => setAnswers({ ...answers, [questionIndex]: option })}
                          className={`w-full p-4 rounded-xl border text-left text-[15px] transition-all ${
                            answers[questionIndex] === option
                              ? "border-pink-500 bg-pink-50 text-pink-700 font-medium"
                              : "border-gray-200 bg-white text-gray-700 hover:border-pink-300"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="w-full min-h-[180px] p-4 rounded-xl bg-[#f8f9fb] border border-gray-200 focus:outline-none focus:border-pink-500 focus:bg-white transition-all text-[15px] text-gray-900 resize-none placeholder:text-gray-400 leading-relaxed"
                      placeholder={QUESTIONS[questionIndex].placeholder}
                      value={answers[questionIndex] || ""}
                      onChange={(e) => setAnswers({ ...answers, [questionIndex]: e.target.value })}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer / botões — estilo Material 3 */}
      <footer className="p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 absolute bottom-0 left-0 right-0 z-20">
        <div className="flex gap-3">
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
    </div>
  );
}
function SuccessScreen() {
  return (
    <div className="min-h-[100dvh] w-full bg-gray-50 flex items-center justify-center p-0 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] h-[100dvh] sm:h-[800px] sm:rounded-[40px] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-[#f8f9fb] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
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
              Pesquisa Concluída!
            </h2>
            <p className="text-gray-500 text-[15px] leading-relaxed">
              Muito obrigado pela sua participação. Suas respostas foram registradas com sucesso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
