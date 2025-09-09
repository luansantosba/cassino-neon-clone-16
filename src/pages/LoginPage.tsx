import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error("Preencha todos os campos!");
      setIsLoading(false);
      return;
    }

    try {
      // Special handling for admin user - create if doesn't exist
      if (email === 'admgeral@gmail.com' && password === 'admgeral') {
        // Try to login first
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (loginError && loginError.message.includes("Invalid login credentials")) {
          // Admin user doesn't exist, create it
          console.log("Creating admin user...");
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: 'Administrador Geral',
                email: email,
                is_admin: true
              }
            }
          });

          if (signupError) {
            console.error("Error creating admin user:", signupError);
            toast.error("Erro ao criar usuário admin: " + signupError.message);
            return;
          }

          if (signupData.user) {
            toast.success("Usuário admin criado e logado com sucesso!");
            navigate("/admin");
          }
          return;
        } else if (loginError) {
          console.log("Admin login error:", loginError);
          toast.error("Erro ao fazer login: " + loginError.message);
          return;
        }

        if (loginData.user) {
          console.log("Admin login successful:", loginData.user.id);
          toast.success("Login realizado com sucesso!");
          navigate("/admin");
        }
        return;
      }

      // Regular user login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.log("Login error:", error);
        
        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos!");
        } else if (error.message.includes("Email logins are disabled")) {
          toast.error("Login temporariamente indisponível. Tente novamente em alguns minutos.");
        } else if (error.message.includes("Too many requests")) {
          toast.error("Muitas tentativas. Aguarde alguns minutos.");
        } else {
          toast.error("Erro ao fazer login: " + error.message);
        }
        return;
      }

      if (data.user) {
        console.log("Login successful:", data.user.id);
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro inesperado ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-lg font-bold text-white">Entrar</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6">
          <Card className="p-6 bg-casino-header/30 border-border">
            <form onSubmit={handleLogin} className="space-y-4">
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
                <label className="text-white text-sm block mb-2">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  className="bg-background border-border text-white"
                />
              </div>

              <Button 
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => navigate("/cadastro")}
                  className="text-casino-gold hover:underline text-sm"
                >
                  Não tem conta? Cadastre-se
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;