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
      <div className="min-h-screen bg-[#fff5f8] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Network Pattern Background */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{ 
            backgroundImage: `url('https://rede.deputadasarelli.com.br/assets/bg-pattern.svg')`,
            backgroundSize: '400px',
            backgroundRepeat: 'repeat'
          }}
        />
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] right-[-15%] w-96 h-96 bg-pink-200 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-15%] w-96 h-96 bg-orange-100 rounded-full blur-[120px] opacity-40 animate-pulse" />
        
        <div className="w-full max-w-sm px-8 flex flex-col items-center z-10 animate-in fade-in zoom-in duration-1000">
          <div className="mb-12 flex flex-col items-center">
            <img 
              src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
              alt="Logo Sarelli" 
              className="h-28 object-contain drop-shadow-xl"
            />
          </div>
          
          <div className="relative w-64 h-64 mb-12 group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#e91e63] via-[#ffb347] to-[#e91e63] rounded-full blur-3xl opacity-20 scale-125 group-hover:opacity-30 transition-opacity" />
            <div className="absolute -inset-1 bg-gradient-to-r from-[#e91e63] to-[#ffb347] rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src="https://rede.deputadasarelli.com.br/assets/fernanda-sarelli-BrFuKmdI.webp" 
              alt="Dra. Fernanda Sarelli" 
              className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-[0_20px_50px_rgba(233,30,99,0.3)] transform transition-transform group-hover:scale-[1.02] duration-500"
            />
          </div>

          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-[0.9] drop-shadow-sm">
              Voz das <br />
              <span className="text-[#e91e63] bg-clip-text">Mulheres</span>
            </h1>
            <div className="w-12 h-1 bg-gradient-to-r from-[#e91e63] to-[#ffb347] mx-auto rounded-full" />
            <p className="text-gray-500 text-lg font-medium px-4 leading-tight">
              Sua opinião é a força que <br />transforma nossa comunidade.
            </p>
          </div>

          <Button 
            onClick={() => setStep(1)} 
            className="w-full h-20 rounded-[2rem] text-xl font-black bg-gradient-to-r from-[#e91e63] via-[#ffb347] to-[#e91e63] bg-[length:200%_auto] hover:bg-right transition-all duration-700 shadow-[0_15px_30px_rgba(233,30,99,0.25)] border-none text-white active:scale-95 uppercase tracking-wider"
          >
            COMEÇAR
            <ChevronRight className="ml-2 h-6 w-6" />
          </Button>

          <div className="mt-16 flex items-center gap-3">
            <div className="w-8 h-[1px] bg-pink-100" />
            <span className="text-[10px] text-pink-300 font-bold tracking-[0.3em] uppercase">OFICIAL</span>
            <div className="w-8 h-[1px] bg-pink-100" />
          </div>
        </div>
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Send size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Muito obrigado!</h2>
            <p className="text-gray-500 font-medium">Sua participação é fundamental para construirmos um futuro melhor.</p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full h-16 rounded-2xl text-lg font-bold bg-[#e91e63] shadow-lg shadow-pink-100 active:scale-95 transition-transform"
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
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Quem está entrevistando?</Label>
                <div className="relative">
                  <select 
                    value={selectedUserId} 
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full h-14 pl-4 pr-10 rounded-2xl bg-gray-50 border-none appearance-none font-bold text-gray-900 shadow-sm focus:ring-2 focus:ring-pink-500 transition-all"
                  >
                    <option value="">Selecione...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.nome}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nome Completo</Label>
                  <Input 
                    value={formData.nome} 
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome"
                    className="h-14 rounded-2xl bg-gray-50 border-none shadow-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">CPF</Label>
                    <Input 
                      value={formData.cpf} 
                      onChange={e => setFormData({...formData, cpf: e.target.value})}
                      placeholder="000.000..."
                      className="h-14 rounded-2xl bg-gray-50 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">WhatsApp</Label>
                    <Input 
                      value={formData.whatsapp} 
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      placeholder="(00) 00000..."
                      className="h-14 rounded-2xl bg-gray-50 border-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nascimento</Label>
                    <Input 
                      type="date"
                      value={formData.dataNascimento} 
                      onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Instagram</Label>
                    <Input 
                      value={formData.instagram} 
                      onChange={e => setFormData({...formData, instagram: e.target.value})}
                      placeholder="@perfil"
                      className="h-14 rounded-2xl bg-gray-50 border-none shadow-sm"
                    />
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