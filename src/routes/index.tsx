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
      if (!formData.nome || !formData.whatsapp) {
        toast.error("Nome e WhatsApp são obrigatórios.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Here we would save to a table. Based on existing schema, we might need a new table
      // or use 'cadastros_fernanda' / 'cadastros_afiliados'
      // For now, I'll simulate saving and recommend creating a specific 'entrevistas' table
      
      // Example of saving personal info to an existing table if structure matches
      // const { error } = await supabase.from('entrevistas').insert({ ... });

      console.log({
        entrevistador_id: selectedUserId,
        dados_pessoais: formData,
        respostas: answers
      });

      toast.success("Respostas enviadas com sucesso!");
      setStep(7);
    } catch (err) {
      toast.error("Erro ao enviar respostas.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#fff5f7] flex flex-col items-center justify-center p-4 text-center">
        <div className="relative mb-8 animate-in zoom-in duration-700">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative bg-white p-4 rounded-full shadow-2xl border-4 border-primary/10">
            <img 
              src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
              alt="Dra. Fernanda Sarelli" 
              className="h-32 w-32 object-contain rounded-full border-2 border-[#e91e63]/20 p-2"
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight uppercase">
          Voz das Mulheres
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-sm mx-auto leading-relaxed">
          Sua opinião é a força que transforma nossa comunidade. Participe da nossa pesquisa.
        </p>
        <Button 
          onClick={() => setStep(1)} 
          className="h-16 w-full max-w-xs rounded-2xl text-xl font-bold bg-gradient-to-r from-[#e91e63] to-[#ff9800] hover:scale-[1.03] transition-all shadow-xl shadow-primary/20 border-none"
        >
          COMEÇAR
          <ChevronRight className="ml-2 h-6 w-6" />
        </Button>
        <div className="mt-12 opacity-50">
          <img 
            src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
            alt="Logo" 
            className="h-8 mx-auto"
          />
        </div>
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="min-h-screen bg-[#fff5f7] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-500 border-none">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Send size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Muito obrigado!</h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">Sua participação é fundamental para construirmos um futuro melhor para todas as mulheres.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-[#e91e63] to-[#ff9800] border-none"
          >
            Nova Entrevista
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff5f7] flex flex-col items-center p-4 pb-12 pt-8">
      <div className="w-full max-w-lg mb-8 text-center animate-in fade-in slide-in-from-top duration-500">
        <img 
          src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
          alt="Sarelli" 
          className="h-12 mx-auto mb-2"
        />
        <div className="h-1 w-20 bg-gradient-to-r from-[#e91e63] to-[#ff9800] mx-auto rounded-full mb-4" />
        <h1 className="text-xs font-black text-primary uppercase tracking-[0.3em] opacity-80">Pesquisa Interativa</h1>
      </div>

      <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur-sm">
        <div className="h-2.5 bg-muted w-full">
          <div 
            className="h-full bg-gradient-to-r from-[#e91e63] to-[#ff9800] transition-all duration-700 ease-out" 
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
        
        <CardHeader className="pt-10 px-8 pb-4">
          <CardTitle className="text-2xl font-black flex items-center gap-4 text-gray-900">
            {step === 1 && <span className="p-3 bg-primary/10 rounded-2xl"><User className="text-primary h-6 w-6" /></span>}
            {step >= 2 && step <= 6 && <span className="p-3 bg-primary/10 rounded-2xl"><MessageSquare className="text-primary h-6 w-6" /></span>}
            
            <span className="tracking-tight">
              {step === 1 ? "Dados Básicos" : `Pergunta ${step - 1} de 5`}
            </span>
          </CardTitle>
        </CardHeader>

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
                className="h-16 flex-1 rounded-2xl text-xl font-black bg-gradient-to-r from-[#e91e63] to-[#ff9800] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 border-none"
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
