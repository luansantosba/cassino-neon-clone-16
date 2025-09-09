import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { X, Copy, Users, DollarSign, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReferralStats {
  total_referrals: number;
  total_bonus: number;
  pending_referrals: number;
}

interface Referral {
  id: string;
  referred_cpf: string;
  referred_name?: string;
  bonus_paid: boolean;
  deposit_made: boolean;
  created_at: string;
}

const AffiliatesPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    total_referrals: 0,
    total_bonus: 0,
    pending_referrals: 0
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get user profile with referral_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error("Erro ao carregar dados do perfil");
        return;
      }

      // If user doesn't have referral_id and has CPF, generate it
      if (profile && !profile.referral_id && profile.cpf) {
        const { data: generatedId, error: generateError } = await supabase
          .rpc('generate_referral_id', { cpf_input: profile.cpf });

        if (!generateError && generatedId) {
          // Update profile with generated referral_id
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ referral_id: generatedId })
            .eq('id', user.id);

          if (!updateError) {
            profile.referral_id = generatedId;
          }
        }
      }

      setUserProfile(profile);

      // Get referral statistics with user names
      if (profile?.referral_id) {
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', profile.referral_id);

        if (!referralsError && referralsData) {
          // Get user names for each referral
          const enrichedReferrals = await Promise.all(
            referralsData.map(async (referral) => {
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', referral.referred_user_id)
                .single();
              
              return {
                ...referral,
                referred_name: userProfile?.full_name || 'Nome não disponível'
              };
            })
          );
          
          setReferrals(enrichedReferrals);
          
          const totalReferrals = referralsData.length;
          const totalBonus = referralsData.filter(r => r.bonus_paid).length * 10;
          const pendingReferrals = referralsData.filter(r => !r.deposit_made).length;

          setReferralStats({
            total_referrals: totalReferrals,
            total_bonus: totalBonus,
            pending_referrals: pendingReferrals
          });
        }
      }

      setIsLoading(false);
    };

    checkUser();
  }, [navigate]);

  const copyReferralLink = () => {
    if (userProfile?.referral_id) {
      const referralLink = `${window.location.origin}/?ref=${userProfile.referral_id}`;
      navigator.clipboard.writeText(referralLink);
      toast.success("Link de indicação copiado!");
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9, 11)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!userProfile?.referral_id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          <div className="bg-casino-header/50 border-b border-border p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold text-white">Afiliados</h1>
            <div className="h-8 w-8" />
          </div>
          <div className="p-6">
            <Card className="p-6 bg-casino-header/30 border-border text-center">
              <p className="text-white">Para acessar o programa de afiliados, você precisa ter um CPF cadastrado.</p>
              <Button 
                onClick={() => navigate('/')}
                className="mt-4 bg-casino-gold hover:bg-casino-gold/80 text-black"
              >
                Voltar
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/?ref=${userProfile.referral_id}`;

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
          <h1 className="text-lg font-bold text-white">Programa de Afiliados</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6 space-y-6">
          {/* Referral ID Card */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <div className="text-center space-y-3">
              <h2 className="text-white text-lg font-bold">Seu ID de Indicação</h2>
              <div className="bg-background rounded-lg p-4">
                <span className="text-casino-gold text-2xl font-mono font-bold">
                  {userProfile.referral_id}
                </span>
              </div>
            </div>
          </Card>

          {/* Referral Link Card */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <div className="space-y-3">
              <h3 className="text-white font-bold">Link de Indicação</h3>
              <div className="bg-background rounded-lg p-3 text-xs text-white break-all">
                {referralLink}
              </div>
              <Button 
                onClick={copyReferralLink}
                className="w-full bg-casino-gold hover:bg-casino-gold/80 text-black"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 bg-casino-header/30 border-border text-center">
              <Users className="h-6 w-6 text-casino-gold mx-auto mb-2" />
              <div className="text-white text-xl font-bold">{referralStats.total_referrals}</div>
              <div className="text-xs text-muted-foreground">Total de Indicados</div>
            </Card>
            
            <Card className="p-4 bg-casino-header/30 border-border text-center">
              <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-white text-xl font-bold">R$ {referralStats.total_bonus}</div>
              <div className="text-xs text-muted-foreground">Bônus Ganhos</div>
            </Card>
            
            <Card className="p-4 bg-casino-header/30 border-border text-center">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-white text-xl font-bold">{referralStats.pending_referrals}</div>
              <div className="text-xs text-muted-foreground">Aguardando Depósito</div>
            </Card>
          </div>

          {/* How it works */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <h3 className="text-white font-bold mb-3">Como Funciona</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Compartilhe seu link de indicação</p>
              <p>• Quando alguém se cadastrar e fizer um depósito de R$ 20</p>
              <p>• Você ganha R$ 10 de bônus</p>
              <p>• O bônus é creditado automaticamente</p>
            </div>
          </Card>

          {/* Referrals List */}
          {referrals.length > 0 && (
            <Card className="p-6 bg-casino-header/30 border-border">
              <h3 className="text-white font-bold mb-3">Seus Indicados</h3>
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div key={referral.id} className="bg-background rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <div className="text-white text-sm font-medium">
                        {referral.referred_name || 'Nome não disponível'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      {referral.bonus_paid ? (
                        <span className="text-green-500 text-xs font-bold">✓ Bônus Pago</span>
                      ) : referral.deposit_made ? (
                        <span className="text-yellow-500 text-xs">Processando</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Aguardando Depósito</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliatesPage;