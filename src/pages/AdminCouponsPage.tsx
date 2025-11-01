import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Coupon {
  id: string;
  code: string;
  partner_email: string | null;
  partner_commission: number;
  game_restriction: string | null;
  valid_until: string;
  minimum_deposit: number;
  requires_deposit: boolean;
  bonus_amount: number;
  active: boolean;
  created_at: string;
  custom_message: string | null;
}

const AdminCouponsPage = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [code, setCode] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerCommission, setPartnerCommission] = useState("0");
  const [gameRestriction, setGameRestriction] = useState("todos");
  const [validityDays, setValidityDays] = useState("1");
  const [minimumDeposit, setMinimumDeposit] = useState("0");
  const [requiresDeposit, setRequiresDeposit] = useState(true);
  const [bonusAmount, setBonusAmount] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    checkAdminAndLoadCoupons();
  }, []);

  const checkAdminAndLoadCoupons = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profile?.email !== 'admgeral@gmail.com') {
      toast.error("Acesso negado");
      navigate('/');
      return;
    }

    await loadCoupons();
  };

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data as any) || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error("Erro ao carregar cupons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!code.trim() || !bonusAmount || parseFloat(bonusAmount) <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(validityDays));

      const { error } = await supabase
        .from('coupons' as any)
        .insert({
          code: code.toUpperCase(),
          partner_email: partnerEmail || null,
          partner_commission: parseFloat(partnerCommission) || 0,
          game_restriction: gameRestriction === "todos" ? null : gameRestriction,
          valid_until: validUntil.toISOString(),
          minimum_deposit: parseFloat(minimumDeposit) || 0,
          requires_deposit: requiresDeposit,
          bonus_amount: parseFloat(bonusAmount),
          active: true,
          custom_message: customMessage || null
        });

      if (error) throw error;

      toast.success("Cupom criado com sucesso!");
      resetForm();
      setShowForm(false);
      await loadCoupons();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      if (error.code === '23505') {
        toast.error("Este código de cupom já existe");
      } else {
        toast.error("Erro ao criar cupom");
      }
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    try {
      const { error } = await supabase
        .from('coupons' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Cupom excluído com sucesso!");
      await loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error("Erro ao excluir cupom");
    }
  };

  const resetForm = () => {
    setCode("");
    setPartnerEmail("");
    setPartnerCommission("0");
    setGameRestriction("todos");
    setValidityDays("1");
    setMinimumDeposit("0");
    setRequiresDeposit(true);
    setBonusAmount("");
    setCustomMessage("");
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.active) return { text: "Inativo", color: "text-gray-500" };
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    if (validUntil < now) return { text: "Expirado", color: "text-red-500" };
    return { text: "Ativo", color: "text-green-500" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-casino-header/50 border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-white">Gerenciar Cupons</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowForm(!showForm)}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create Form */}
          {showForm && (
            <Card className="p-6 bg-casino-header/30 border-border">
              <h2 className="text-white text-lg font-bold mb-4">Criar Novo Cupom</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Código do Cupom *</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: BONUS50"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label className="text-white">Valor do Bônus (R$) *</Label>
                  <Input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    placeholder="50"
                  />
                </div>

                <div>
                  <Label className="text-white">Mensagem Personalizada (opcional)</Label>
                  <Input
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Parabéns! Você ganhou saldo grátis!"
                  />
                </div>

                <div>
                  <Label className="text-white">E-mail do Parceiro (opcional)</Label>
                  <Input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="parceiro@email.com"
                  />
                </div>

                <div>
                  <Label className="text-white">Comissão do Parceiro (R$)</Label>
                  <Input
                    type="number"
                    value={partnerCommission}
                    onChange={(e) => setPartnerCommission(e.target.value)}
                    placeholder="3"
                  />
                </div>

                <div>
                  <Label className="text-white">Jogo Específico (opcional)</Label>
                  <Select value={gameRestriction || "todos"} onValueChange={(value) => setGameRestriction(value === "todos" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer jogo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Qualquer jogo</SelectItem>
                      <SelectItem value="Raspadinha 1 Real">Raspadinha 1 Real</SelectItem>
                      <SelectItem value="Raspadinha 5 Reais">Raspadinha 5 Reais</SelectItem>
                      <SelectItem value="Raspadinha 10 Reais">Raspadinha 10 Reais</SelectItem>
                      <SelectItem value="Raspadinha 20 Reais">Raspadinha 20 Reais</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Validade (dias)</Label>
                  <Select value={validityDays} onValueChange={setValidityDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dia</SelectItem>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={requiresDeposit}
                    onCheckedChange={setRequiresDeposit}
                  />
                  <Label className="text-white">Exige depósito</Label>
                </div>

                {requiresDeposit && (
                  <div>
                    <Label className="text-white">Depósito Mínimo (R$)</Label>
                    <Input
                      type="number"
                      value={minimumDeposit}
                      onChange={(e) => setMinimumDeposit(e.target.value)}
                      placeholder="20"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateCoupon}
                    className="flex-1 bg-casino-gold hover:bg-casino-gold/80 text-black"
                  >
                    Criar Cupom
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Coupons List */}
          <div className="space-y-4">
            <h2 className="text-white text-lg font-bold">Cupons Criados</h2>
            {isLoading ? (
              <Card className="p-6 bg-casino-header/30 border-border text-center">
                <p className="text-white">Carregando...</p>
              </Card>
            ) : coupons.length === 0 ? (
              <Card className="p-6 bg-casino-header/30 border-border text-center">
                <p className="text-muted-foreground">Nenhum cupom criado ainda</p>
              </Card>
            ) : (
              coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <Card key={coupon.id} className="p-4 bg-casino-header/30 border-border">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-casino-gold text-xl font-mono font-bold">
                            {coupon.code}
                          </span>
                          <span className={`text-sm font-bold ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Bônus: <span className="text-white font-bold">R$ {coupon.bonus_amount}</span></p>
                          {coupon.custom_message && (
                            <p>Mensagem: <span className="text-white">{coupon.custom_message}</span></p>
                          )}
                          {coupon.partner_email && (
                            <p>Parceiro: {coupon.partner_email} (Comissão: R$ {coupon.partner_commission})</p>
                          )}
                          {coupon.game_restriction && (
                            <p>Jogo: {coupon.game_restriction}</p>
                          )}
                          <p>Validade: {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}</p>
                          <p>
                            {coupon.requires_deposit 
                              ? `Depósito mínimo: R$ ${coupon.minimum_deposit}`
                              : 'Sem depósito necessário'}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCouponsPage;
