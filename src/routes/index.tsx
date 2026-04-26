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

function QuestionnaireComponent() {
  const [step, setStep] = useState(0); 
  const [users, setUsers] = useState<any[]>([]);
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
  
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const recruiterId = searchParams.get("recruiter");

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("hierarquia_usuarios").select("id, nome").order("nome");
      if (data) setUsers(data);
      
      if (recruiterId) {
        setSelectedUserId(recruiterId);
        setStep(1);
      }
    }
    fetchData();
  }, [recruiterId]);

  const handleNext = () => {
    if (step === 1) {
      if (!selectedUserId) {
        toast.error("Por favor, selecione quem está entrevistando.");
        return;
      }
      if (!formData.nome || !formData.whatsapp || !formData.dataNascimento || !formData.cpf || !formData.instagram) {
        toast.error("Todos os campos são obrigatórios.");
        return;
      }
    } else if (step >= 2 && step <= 6) {
      if (!answers[step - 2] || answers[step - 2].trim().length < 5) {
        toast.error("Por favor, responda a pergunta com mais detalhes.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!answers[4] || answers[4].trim().length < 5) {
      toast.error("Por favor, responda a última pergunta.");
      return;
    }

    setLoading(true);
    try {
      const allAnswers = QUESTIONS.map((q, i) => `${q.id}. ${q.question}\nR: ${answers[i] || ""}`).join("\n\n");
      
      const { error } = await supabase
        .from("promotion_entries")
        .insert({
          full_name: formData.nome,
          whatsapp: formData.whatsapp,
          phone: formData.whatsapp,
          cpf: formData.cpf,
          instagram: formData.instagram,
          city: "Voz das Mulheres",
          promotion_id: recruiterId || selectedUserId,
          message: allAnswers,
        });

      if (error) throw error;

      await supabase.from("cadastros_fernanda").insert({
        nome: formData.nome,
        telefone: formData.whatsapp,
        instagram: formData.instagram,
        cadastrado_por: selectedUserId,
        cidade: "Pesquisa Voz das Mulheres",
      });

      toast.success("Respostas enviadas com sucesso!");
      setStep(7);
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
        {/* Top pink dome — fills upper portion with rounded bottom */}
        <div
          className="absolute top-0 left-0 right-0 h-[55%] z-0"
          style={{
            background:
              "linear-gradient(165deg, #f06292 0%, #ec407a 40%, #e91e63 75%, #c2185b 100%)",
            borderBottomLeftRadius: "50% 12%",
            borderBottomRightRadius: "50% 12%",
          }}
        />

        {/* Subtle constellation pattern over pink */}
        <div
          className="absolute top-0 left-0 right-0 h-[55%] z-[1] opacity-20 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url('https://rede.deputadasarelli.com.br/assets/bg-pattern.svg')`,
            backgroundSize: "560px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Soft golden + light highlights on pink */}
        <div
          className="absolute -top-24 -right-20 w-80 h-80 rounded-full z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,210,130,0.55) 0%, rgba(255,210,130,0) 70%)",
          }}
        />
        <div
          className="absolute top-16 -left-24 w-72 h-72 rounded-full z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 70%)",
          }}
        />

        {/* Brand bar */}
        <div className="relative z-10 flex items-center justify-center pt-7">
          <span className="text-[10px] font-bold tracking-[0.5em] text-white/90 uppercase">
            ✦  Pesquisa Oficial  ✦
          </span>
        </div>

        {/* HERO: official logo */}
        <div className="relative z-10 flex flex-col items-center pt-5 px-6">
          <div className="bg-white/10 backdrop-blur-[2px] rounded-3xl px-8 py-4 border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <img
              src="/brand/logo-sarelli.webp"
              alt="Doutora Fernanda Sarelli — Chama a Doutora"
              className="h-24 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            />
          </div>

          {/* Portrait sitting on the pink/white seam */}
          <div className="relative w-40 h-40 mt-7">
            {/* Outer golden ring */}
            <div
              className="absolute -inset-[5px] rounded-full"
              style={{
                background:
                  "conic-gradient(from 140deg, #ffd97a, #ffffff, #ffb347, #ffd97a)",
              }}
            />
            {/* Inner white frame */}
            <div className="absolute inset-0 rounded-full bg-white" />
            <img
              src="/brand/fernanda.webp"
              alt="Dra. Fernanda Sarelli"
              className="relative w-full h-full object-cover rounded-full p-[3px]"
            />
            {/* Tiny golden accent dot */}
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full bg-[#ffb347] border-2 border-white shadow-md" />
          </div>
        </div>

        {/* Floating card */}
        <div className="relative z-10 flex-1 flex items-end px-5 pb-6">
          <div className="w-full bg-white rounded-[26px] px-6 pt-6 pb-5 shadow-[0_20px_50px_-12px_rgba(216,27,96,0.30)] border border-pink-50/80">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-[2px] w-5 bg-gradient-to-r from-[#e91e63] to-[#ffb347] rounded-full" />
              <span className="text-[10px] font-black tracking-[0.35em] text-[#c9a227] uppercase">
                Chama a Doutora
              </span>
            </div>

            <h1 className="text-[2rem] leading-[1] font-black text-gray-900 tracking-tight">
              Voz das{" "}
              <span className="bg-gradient-to-r from-[#e91e63] to-[#ff8a4c] bg-clip-text text-transparent">
                Mulheres
              </span>
            </h1>

            <p className="mt-2.5 text-[13.5px] text-gray-500 font-medium leading-snug">
              Sua opinião é a força que transforma nossa comunidade. Leva menos de 2 minutos.
            </p>

            <Button
              onClick={() => setStep(1)}
              className="mt-4 w-full h-[52px] rounded-2xl text-[14px] font-black bg-gradient-to-r from-[#e91e63] via-[#ec407a] to-[#ff8a4c] bg-[length:200%_auto] hover:bg-right transition-all duration-700 shadow-[0_10px_25px_-6px_rgba(233,30,99,0.55)] border-none text-white active:scale-[0.97] uppercase tracking-[0.2em]"
            >
              Começar agora
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>

            <div className="mt-3.5 flex items-center justify-center gap-2 text-[9.5px] text-gray-400 font-semibold tracking-[0.22em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Anônimo · Seguro · Rápido
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{ 
            backgroundImage: `url('https://rede.deputadasarelli.com.br/assets/bg-pattern.svg')`,
            backgroundSize: '400px',
            backgroundRepeat: 'repeat'
          }}
        />
        
        <div className="w-full max-w-sm text-center space-y-10 animate-in fade-in zoom-in duration-700 z-10">
          <div className="relative mx-auto w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-pink-100">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
            <Send className="text-green-500" size={48} strokeWidth={3} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Muito<br/>obrigado!</h2>
            <div className="w-12 h-1 bg-green-500 mx-auto rounded-full" />
            <p className="text-gray-500 font-medium text-lg leading-tight">Sua participação é fundamental para construirmos um futuro melhor.</p>
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

  return (
    <div className="min-h-screen bg-[#fff5f8] flex flex-col relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url('https://rede.deputadasarelli.com.br/assets/bg-pattern.svg')`,
          backgroundSize: '300px',
          backgroundRepeat: 'repeat'
        }}
      />

      <header className="px-6 py-6 flex flex-col items-center bg-white/80 backdrop-blur-md border-b border-pink-50 sticky top-0 z-20 shadow-sm">
        <img 
          src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
          alt="Sarelli" 
          className="h-12 mb-4"
        />
        <div className="w-full max-w-xs bg-pink-50 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#e91e63] to-[#ff9800] transition-all duration-700 ease-out" 
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 p-6 pb-32 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest">
              Passo {step} de 6
            </span>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {step === 1 ? "Dados da Candidata" : `Pergunta ${step - 1}`}
            </h2>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
              <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-pink-50 shadow-sm space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Quem está entrevistando?</Label>
                  <div className="relative">
                    <select 
                      value={selectedUserId} 
                      onChange={e => setSelectedUserId(e.target.value)}
                      className="w-full h-16 pl-6 pr-12 rounded-2xl bg-white border border-pink-50 appearance-none font-bold text-gray-900 shadow-sm focus:ring-4 focus:ring-pink-100 transition-all text-lg"
                    >
                      <option value="">Selecione...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.nome}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-pink-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-5 pt-2">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Nome Completo</Label>
                    <Input 
                      value={formData.nome} 
                      onChange={e => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome da entrevistada"
                      className="h-16 rounded-2xl bg-white border-pink-50 shadow-sm px-6 text-lg font-medium focus:ring-4 focus:ring-pink-100"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">CPF</Label>
                      <Input 
                        value={formData.cpf} 
                        onChange={e => setFormData({...formData, cpf: e.target.value})}
                        placeholder="000.000.000-00"
                        className="h-16 rounded-2xl bg-white border-pink-50 shadow-sm px-6 text-lg font-medium focus:ring-4 focus:ring-pink-100"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">WhatsApp</Label>
                      <Input 
                        value={formData.whatsapp} 
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                        placeholder="(00) 00000-0000"
                        className="h-16 rounded-2xl bg-white border-pink-50 shadow-sm px-6 text-lg font-medium focus:ring-4 focus:ring-pink-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Data de Nascimento</Label>
                      <Input 
                        type="date"
                        value={formData.dataNascimento} 
                        onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
                        className="h-16 rounded-2xl bg-white border-pink-50 shadow-sm px-6 text-lg font-medium focus:ring-4 focus:ring-pink-100"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Instagram</Label>
                      <Input 
                        value={formData.instagram} 
                        onChange={e => setFormData({...formData, instagram: e.target.value})}
                        placeholder="@perfil"
                        className="h-16 rounded-2xl bg-white border-pink-50 shadow-sm px-6 text-lg font-medium focus:ring-4 focus:ring-pink-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step >= 2 && step <= 6 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] border border-pink-50 shadow-sm">
                <p className="text-xl font-black leading-tight text-gray-900 uppercase tracking-tighter">
                  {QUESTIONS[step - 2].question}
                </p>
              </div>
              <textarea
                className="w-full min-h-[250px] p-8 rounded-[2rem] bg-white border-none focus:ring-4 focus:ring-pink-100 transition-all text-lg font-medium resize-none shadow-xl shadow-pink-50/50 placeholder:text-gray-300"
                placeholder={QUESTIONS[step - 2].placeholder}
                value={answers[step - 2] || ""}
                onChange={e => setAnswers({...answers, [step - 2]: e.target.value})}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="p-6 bg-white/80 backdrop-blur-md border-t border-pink-50 fixed bottom-0 w-full z-20">
        <div className="max-w-md mx-auto flex gap-4">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={handleBack} 
              className="h-20 w-24 rounded-[1.5rem] border-none bg-pink-50 text-pink-400 active:scale-95 hover:bg-pink-100 transition-colors"
            >
              <ChevronLeft size={32} strokeWidth={3} />
            </Button>
          )}
          
          <Button 
            onClick={step === 6 ? handleSubmit : handleNext} 
            className="h-20 flex-1 rounded-[1.5rem] text-xl font-black bg-gradient-to-r from-[#e91e63] to-[#ff9800] shadow-[0_10px_20px_rgba(233,30,99,0.2)] border-none text-white active:scale-95 uppercase tracking-wider"
            disabled={loading}
          >
            {loading ? "ENVIANDO..." : step === 6 ? "FINALIZAR" : "CONTINUAR"}
            {step < 6 && <ChevronRight size={28} strokeWidth={3} className="ml-2" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}