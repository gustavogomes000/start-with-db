import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Send, User, Calendar, MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [step, setStep] = useState(0); // 0: Start, 1: Personal info/Recruiter, 2-6: Questions, 7: Success
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
  
  const searchParams = new URLSearchParams(window.location.search);
  const recruiterId = searchParams.get("recruiter");

  useEffect(() => {
    async function fetchData() {
      // Fetch users who can perform interviews (recruiters)
      const { data } = await supabase.from("hierarquia_usuarios").select("id, nome").order("nome");
      if (data) setUsers(data);
      
      if (recruiterId) {
        setSelectedUserId(recruiterId);
        setStep(1); // Skip user selection if recruiter is in URL
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
        toast.error("Todos os campos são obrigatórios (Nome, CPF, Nascimento, WhatsApp e Instagram).");
        return;
      }
    } else if (step >= 2 && step <= 6) {
      if (!answers[step - 2] || answers[step - 2].trim().length < 5) {
        toast.error("Por favor, responda a pergunta com mais detalhes para continuar.");
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
      toast.error("Por favor, responda a última pergunta para finalizar.");
      return;
    }

    setLoading(true);
    try {
      // Use promotion_entries as it has all the necessary fields including a message field for answers
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
          promotion_id: recruiterId || selectedUserId, // Using this to track who did the interview
          message: allAnswers,
        });

      if (error) throw error;

      // Also save to cadastros_fernanda for the general contact list
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Mobile-first background elements */}
        <div className="absolute top-[-5%] right-[-10%] w-64 h-64 bg-pink-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-5%] left-[-10%] w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-60" />
        
        <div className="w-full max-w-sm px-6 flex flex-col items-center z-10">
          <img 
            src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
            alt="Logo Sarelli" 
            className="h-14 mb-8"
          />
          
          <div className="relative w-56 h-56 mb-10">
            <div className="absolute inset-0 bg-gradient-to-r from-[#e91e63] to-[#ff9800] rounded-full blur-2xl opacity-20 scale-110" />
            <img 
              src="https://rede.deputadasarelli.com.br/assets/fernanda-sarelli-BrFuKmdI.webp" 
              alt="Dra. Fernanda Sarelli" 
              className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-2xl"
            />
          </div>

          <div className="text-center space-y-3 mb-12">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              Voz das Mulheres
            </h1>
            <p className="text-gray-500 text-base font-medium px-4">
              Sua opinião é a força que transforma nossa comunidade.
            </p>
          </div>

          <Button 
            onClick={() => setStep(1)} 
            className="w-full h-16 rounded-2xl text-lg font-black bg-gradient-to-r from-[#e91e63] via-[#ffb347] to-[#e91e63] bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-xl shadow-pink-100 border-none text-white active:scale-95"
          >
            COMEÇAR PESQUISA
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="mt-12 text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">
            Dra. Fernanda Sarelli
          </p>
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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-4 flex flex-col items-center bg-white border-b border-gray-50 sticky top-0 z-20">
        <img 
          src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
          alt="Sarelli" 
          className="h-8 mb-2"
        />
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-gradient-to-r from-[#e91e63] to-[#ff9800] transition-all duration-500" 
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 p-6 pb-24">
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest">
              Passo {step} de 6
            </span>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {step === 1 ? "Dados da Candidata" : `Pergunta ${step - 1}`}
            </h2>
          </div>

        <CardContent className="p-8 pt-2">
          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-800 text-sm ml-1">Quem está entrevistando?</Label>
                  <div className="relative">
                    <select 
                      value={selectedUserId} 
                      onChange={e => setSelectedUserId(e.target.value)}
                      className="w-full h-14 pl-4 pr-10 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 focus:bg-white transition-all appearance-none cursor-pointer font-bold text-gray-900 shadow-sm"
                    >
                      <option value="">Selecione a pessoa...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.nome}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-800 text-sm ml-1">Nome Completo</Label>
                    <Input 
                      value={formData.nome} 
                      onChange={e => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome da pessoa respondendo"
                      className="h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus-visible:ring-primary focus-visible:bg-white transition-all font-medium text-gray-900"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-800 text-sm ml-1">CPF (Opcional)</Label>
                      <Input 
                        value={formData.cpf} 
                        onChange={e => setFormData({...formData, cpf: e.target.value})}
                        placeholder="000.000.000-00"
                        className="h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus-visible:ring-primary focus-visible:bg-white transition-all font-medium text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-800 text-sm ml-1">WhatsApp</Label>
                      <Input 
                        value={formData.whatsapp} 
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                        placeholder="(00) 00000-0000"
                        className="h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus-visible:ring-primary focus-visible:bg-white transition-all font-medium text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-800 text-sm ml-1">Nascimento</Label>
                      <Input 
                        type="date"
                        value={formData.dataNascimento} 
                        onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
                        className="h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus-visible:ring-primary focus-visible:bg-white transition-all font-medium text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-800 text-sm ml-1">Instagram</Label>
                      <Input 
                        value={formData.instagram} 
                        onChange={e => setFormData({...formData, instagram: e.target.value})}
                        placeholder="@perfil"
                        className="h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus-visible:ring-primary focus-visible:bg-white transition-all font-medium text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step >= 2 && step <= 6 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <p className="text-xl font-bold leading-snug text-gray-900 px-1">
                  {QUESTIONS[step - 2].question}
                </p>
                <textarea
                  className="w-full min-h-[180px] p-6 rounded-[2rem] bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all text-lg font-medium resize-none shadow-inner"
                  placeholder={QUESTIONS[step - 2].placeholder}
                  value={answers[step - 2] || ""}
                  onChange={e => setAnswers({...answers, [step - 2]: e.target.value})}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handleBack} 
                  className="h-16 w-20 rounded-2xl border-2 hover:bg-muted/50 transition-all text-gray-400"
                >
                  <ChevronLeft size={28} />
                </Button>
              )}
              
              <Button 
                onClick={step === 6 ? handleSubmit : handleNext} 
                className="h-16 flex-1 rounded-2xl text-xl font-black bg-gradient-to-r from-[#e91e63] via-[#ff9800] to-[#e91e63] bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-xl shadow-pink-200 border-none text-white"
                disabled={loading}
              >
                {loading ? "ENVIANDO..." : step === 6 ? "FINALIZAR" : "CONTINUAR"}
                {step < 6 && <ChevronRight size={24} className="ml-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
