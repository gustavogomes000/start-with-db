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
          <img
            src="/brand/logo-sarelli.png"
            alt="Doutora Fernanda Sarelli — Chama a Doutora"
            className="h-32 mt-5 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
          />
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
    <div className="min-h-screen bg-[#fff5f8] flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url('https://rede.deputadasarelli.com.br/assets/bg-pattern.svg')`,
          backgroundSize: "300px",
          backgroundRepeat: "repeat",
        }}
      />

      <header className="px-6 py-6 flex flex-col items-center bg-white/80 backdrop-blur-md border-b border-pink-50 sticky top-0 z-20 shadow-sm">
        <img src="/brand/logo-sarelli.png" alt="Sarelli" className="h-12 mb-4" />
        <div className="w-full max-w-xs bg-pink-50 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#e91e63] to-[#ff9800] transition-all duration-700 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 p-6 pb-32 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest">
              Etapa {step} de 2
            </span>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {stepTitle}
            </h2>
          </div>

          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right duration-500 pb-10">
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-pink-50 shadow-sm space-y-5">
                <div className="flex items-center gap-3 mb-1">
                  <User className="text-pink-500" size={22} />
                  <span className="text-sm font-bold text-gray-700">
                    Identifique o entrevistador responsável
                  </span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">
                    Selecione o entrevistador
                  </Label>
                  <div className="relative">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full h-14 pl-5 pr-12 rounded-2xl bg-white border border-pink-100 appearance-none font-bold text-gray-900 shadow-sm focus:ring-4 focus:ring-pink-100 transition-all text-base"
                    >
                      <option value="">Selecione...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-pink-400 rotate-90 pointer-events-none" />
                  </div>
                  {users.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Carregando entrevistadores...</p>
                  )}
                </div>

                <div className="h-px bg-pink-50 my-2" />

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Nome Completo</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome da entrevistada"
                    className="h-14 rounded-2xl bg-white border-pink-100 shadow-sm px-5 text-base font-medium focus:ring-4 focus:ring-pink-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">CPF</Label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="h-14 rounded-2xl bg-white border-pink-100 shadow-sm px-5 text-base font-medium focus:ring-4 focus:ring-pink-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">WhatsApp</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="h-14 rounded-2xl bg-white border-pink-100 shadow-sm px-5 text-base font-medium focus:ring-4 focus:ring-pink-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    className="h-14 rounded-2xl bg-white border-pink-100 shadow-sm px-5 text-base font-medium focus:ring-4 focus:ring-pink-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Instagram</Label>
                  <Input
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@perfil"
                    className="h-14 rounded-2xl bg-white border-pink-100 shadow-sm px-5 text-base font-medium focus:ring-4 focus:ring-pink-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-[2rem] border border-pink-50 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="text-pink-500" size={18} />
                  <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest">
                    Pergunta {questionIndex + 1}
                  </span>
                </div>
                <p className="text-lg font-black leading-tight text-gray-900">
                  {QUESTIONS[questionIndex].question}
                </p>
              </div>
              <textarea
                className="w-full min-h-[220px] p-6 rounded-[2rem] bg-white border-none focus:ring-4 focus:ring-pink-100 transition-all text-base font-medium resize-none shadow-xl shadow-pink-50/50 placeholder:text-gray-300"
                placeholder={QUESTIONS[questionIndex].placeholder}
                value={answers[questionIndex] || ""}
                onChange={(e) => setAnswers({ ...answers, [questionIndex]: e.target.value })}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="p-6 bg-white/80 backdrop-blur-md border-t border-pink-50 fixed bottom-0 w-full z-20">
        <div className="max-w-md mx-auto flex gap-4">
          {(step > 1 || (step === 2 && questionIndex > 0)) && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-16 w-20 rounded-[1.5rem] border-none bg-pink-50 text-pink-400 active:scale-95 hover:bg-pink-100 transition-colors"
            >
              <ChevronLeft size={28} strokeWidth={3} />
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={loading}
            className="h-16 flex-1 rounded-[1.5rem] text-base font-black bg-gradient-to-r from-[#e91e63] to-[#ff9800] shadow-[0_10px_20px_rgba(233,30,99,0.2)] border-none text-white active:scale-95 uppercase tracking-wider"
          >
            {loading ? "ENVIANDO..." : isLastQuestion ? "FINALIZAR" : "CONTINUAR"}
            {!isLastQuestion && <ChevronRight size={24} strokeWidth={3} className="ml-2" />}
          </Button>
        </div>
      </footer>

    </div>
  );
}