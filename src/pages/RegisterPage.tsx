import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [confirmAge, setConfirmAge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateReferralCode = async (code: string): Promise<boolean> => {
    if (!code) return false;
    const normalized = code.trim().toLowerCase();
    const isValidFormat = /^bdc\d{3}$/.test(normalized);
    if (!isValidFormat) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_id', normalized)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações frontend
    if (!name || !email || !whatsapp || !cpf || !password) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    if (!confirmAge) {
      toast.error("Você deve confirmar que tem 18 anos ou mais!");
      return;
    }

    // Validate CPF format (simple check)
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      toast.error("Digite um CPF válido!");
      return;
    }

    // Validate password
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres!");
      return;
    }

    // Validate referral code if provided
    if (referralCode && referralCode.length > 0) {
      const isValidCode = await validateReferralCode(referralCode);
      if (!isValidCode) {
        toast.error("Código de indicação inválido! Use o formato bdc123");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Check if CPF already exists before attempting signup
      const { data: cpfExists, error: checkError } = await supabase.rpc('cpf_exists', { 
        cpf_input: cpfClean 
      });

      if (checkError) {
        console.error("Error checking CPF:", checkError);
        toast.error("Erro ao verificar CPF. Tente novamente.");
        return;
      }

      if (cpfExists) {
        toast.error("Este CPF já está registrado. Tente fazer login ou use outro CPF.");
        return;
      }

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name,
            email: email,
            whatsapp: whatsapp,
            cpf: cpfClean,
            password: password, // Save password for admin recovery
            referrer_id: referralCode || null // Include referrer ID in signup data
          }
        }
      });

      if (error) {
        console.log("Auth error:", error);
        
        // Handle specific error cases
        if (error.message.includes("User already registered")) {
          toast.error("E-mail já registrado. Tente fazer login.");
        } else if (error.message.includes("Password should be at least")) {
          toast.error("A senha deve ter pelo menos 6 caracteres!");
        } else if (error.message.includes("Email signups are disabled")) {
          toast.error("Erro de configuração do sistema. Entre em contato com o suporte.");
        } else {
          toast.error("Erro ao criar conta: " + error.message);
        }
        return;
      }

      if (data.user) {
        console.log("User created:", data.user.id);
        
        // If there's a referral code, create the referral record
        if (referralCode && data.user.id) {
          try {
            const { error: referralError } = await supabase
              .from('referrals')
              .insert({
                referrer_id: referralCode,
                referred_user_id: data.user.id,
                referred_cpf: cpfClean
              });
            
            if (referralError) {
              console.error('Error creating referral record:', referralError);
            } else {
              console.log('Referral record created successfully');
            }
          } catch (referralErr) {
            console.error('Error creating referral:', referralErr);
          }
        }
        
        toast.success("Conta criada com sucesso! Você já pode fazer login.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Erro inesperado ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatWhatsapp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleReferralCodeChange = (value: string) => {
    const v = value.toLowerCase().replace(/\s+/g, '');
    // Enforce prefix 'bdc' and up to 3 digits after
    let normalized = v.startsWith('bdc') ? v : (v.startsWith('b') ? 'bdc' + v.slice(1) : v);
    normalized = normalized.replace(/[^a-z0-9]/g, '');
    if (!normalized.startsWith('bdc')) normalized = 'bdc';
    const digits = normalized.slice(3).replace(/\D/g, '').slice(0, 3);
    setReferralCode('bdc' + digits);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-casino-header/50 border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-white">Cadastrar</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6">
          <Card className="p-6 bg-casino-header/30 border-border">
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm block mb-2">Nome Completo</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="bg-background border-border text-white"
                />
              </div>

              <div>
                <label className="text-white text-sm block mb-2">CPF</label>
                <Input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="bg-background border-border text-white"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="text-white text-sm block mb-2">E-mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-background border-border text-white"
                />
              </div>

              <div>
                <label className="text-white text-sm block mb-2">WhatsApp</label>
                <Input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="bg-background border-border text-white"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="text-white text-sm block mb-2">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="new-password"
                  className="bg-background border-border text-white"
                />
              </div>

              <div>
                <label className="text-white text-sm block mb-2">
                  Código de Indicação (Opcional)
                </label>
                <Input
                  type="text"
                  value={referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  placeholder="bdc123"
                  className="bg-background border-border text-white text-center tracking-widest text-lg font-mono"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se você foi indicado, digite o código de 6 dígitos
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="age-confirm" 
                  checked={confirmAge}
                  onCheckedChange={(checked) => setConfirmAge(checked === true)}
                />
                <label 
                  htmlFor="age-confirm" 
                  className="text-white text-sm cursor-pointer"
                >
                  Confirmo que tenho 18 anos ou mais
                </label>
              </div>

              <Button 
                onClick={handleRegister}
                disabled={isLoading || !name || !email || !whatsapp || !cpf || !password || !confirmAge}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Criando conta..." : "Cadastrar"}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="text-casino-gold hover:underline text-sm"
                >
                  Já tem conta? Faça login
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
