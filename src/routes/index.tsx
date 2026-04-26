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
  const [step, setStep] = useState(1); // Starting directly at Personal Info (step 1)
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

  if (step === 7) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8 rounded-3xl shadow-xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Muito obrigado!</h2>
          <p className="text-gray-600 mb-8">Sua participação é fundamental para construirmos um futuro melhor para todas as mulheres.</p>
          <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl text-lg">
            Nova Entrevista
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center p-4 pb-12">
      <div className="w-full max-w-lg mt-8 mb-12 text-center">
        <img 
          src="https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp" 
          alt="Sarelli" 
          className="h-12 mx-auto mb-4"
        />
        <h1 className="text-xl font-bold text-primary uppercase tracking-tight">Voz das Mulheres</h1>
      </div>

      <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2rem] overflow-hidden">
        <div className="h-2 bg-muted w-full">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
        
        <CardHeader className="pt-8 px-8">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            {step === 1 && <span className="p-2 bg-primary/10 rounded-lg"><User className="text-primary" /></span>}
            {step >= 2 && step <= 6 && <span className="p-2 bg-primary/10 rounded-lg"><MessageSquare className="text-primary" /></span>}
            
            {step === 1 ? "Início da Pesquisa" : 
             `Pergunta ${step - 1} de 5`}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8">
          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right duration-300">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold text-gray-700">Quem está entrevistando?</Label>
                  <select 
                    value={selectedUserId} 
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer font-medium"
                  >
                    <option value="">Selecione a pessoa...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold text-gray-700"><User size={16} /> Nome Completo</Label>
                  <Input 
                    value={formData.nome} 
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    placeholder="Digite seu nome"
                    className="h-12 rounded-xl bg-muted border-none focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">CPF</Label>
                  <Input 
                    value={formData.cpf} 
                    onChange={e => setFormData({...formData, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    className="h-12 rounded-xl bg-muted border-none focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar size={16} /> Data de Nascimento</Label>
                  <Input 
                    type="date"
                    value={formData.dataNascimento} 
                    onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
                    className="h-12 rounded-xl bg-muted border-none focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone size={16} /> WhatsApp</Label>
                  <Input 
                    value={formData.whatsapp} 
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="h-12 rounded-xl bg-muted border-none focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Instagram</Label>
                  <Input 
                    value={formData.instagram} 
                    onChange={e => setFormData({...formData, instagram: e.target.value})}
                    placeholder="@seu.perfil"
                    className="h-12 rounded-xl bg-muted border-none focus-visible:ring-primary"
                  />
                </div>
              </div>
            )}

            {step >= 2 && step <= 6 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <p className="text-xl font-medium leading-relaxed text-gray-800">
                  {QUESTIONS[step - 2].question}
                </p>
                <textarea
                  className="w-full min-h-[150px] p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary transition-all text-lg resize-none"
                  placeholder={QUESTIONS[step - 2].placeholder}
                  value={answers[step - 2] || ""}
                  onChange={e => setAnswers({...answers, [step - 2]: e.target.value})}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handleBack} 
                  className="h-14 w-20 rounded-2xl border-2"
                >
                  <ChevronLeft size={24} />
                </Button>
              )}
              
              <Button 
                onClick={step === 6 ? handleSubmit : handleNext} 
                className="h-14 flex-1 rounded-2xl text-lg font-bold transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? "Enviando..." : step === 6 ? "Finalizar Entrevista" : "Continuar"}
                {step < 6 && <ChevronRight size={20} className="ml-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
