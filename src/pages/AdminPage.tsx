import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu, X, Users, DollarSign, TrendingUp, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AdminSection = 'users' | 'withdrawals' | 'revenue' | 'banners' | 'support' | null;

const AdminPage = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState<AdminSection>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'admgeral@gmail.com') {
        navigate('/login');
      }
    };

    checkAdmin();
  }, [navigate]);

  const menuItems = [
    { id: 'users' as AdminSection, label: 'Usuários', icon: Users },
    { id: 'withdrawals' as AdminSection, label: 'Saques', icon: DollarSign },
    { id: 'revenue' as AdminSection, label: 'Banca', icon: TrendingUp },
    { id: 'banners' as AdminSection, label: 'Banners', icon: ImageIcon },
    { id: 'support' as AdminSection, label: 'Suporte', icon: Menu }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'users':
        return <UsersSection />;
      case 'withdrawals':
        return <WithdrawalsSection />;
      case 'revenue':
        return <RevenueSection />;
      case 'banners':
        return <BannersSection />;
      case 'support':
        return <SupportRequestsSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="bg-casino-header border-border">
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-white text-xl font-bold">Administração</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:text-casino-gold"
              >
                Sair
              </Button>
            </div>
          </div>
          
          {/* Menu */}
          {menuOpen && (
            <div className="border-t border-border p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => {
                        setCurrentSection(item.id);
                        setMenuOpen(false);
                      }}
                      className="flex flex-col items-center gap-2 p-4 h-auto text-white hover:bg-casino-gold/20"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Content */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Users Section Component
const UsersSection = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('list-users', { body: {} });
        if (error) throw error;
        // data shape: { users: [...] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUsers((data as any)?.users || []);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (isLoading) return <div className="text-white text-center">Carregando usuários...</div>;

  return (
    <Card className="p-6 bg-casino-header/30 border-border">
      <h2 className="text-white text-lg font-bold mb-4">Usuários Cadastrados</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="bg-background rounded-lg p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <div className="text-white">{user.full_name || 'N/A'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <div className="text-white">{user.email || 'N/A'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Senha:</span>
                <div className="text-yellow-400 font-mono text-xs">{user.password || 'N/A'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">CPF:</span>
                <div className="text-white">{user.cpf || 'N/A'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">WhatsApp:</span>
                <div className="text-white">{user.whatsapp || 'N/A'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Saldo:</span>
                <div className="text-casino-gold">R$ {(user.balance || 0).toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cadastro:</span>
                <div className="text-white">{new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Withdrawals Section Component
const WithdrawalsSection = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const loadWithdrawals = async () => {
      try {
        // Load from proper withdrawals table
        const { data: withdrawalData } = await supabase
          .from('withdrawals')
          .select(`
            *,
            profile:profiles!withdrawals_user_id_fkey(full_name, cpf)
          `)
          .order('created_at', { ascending: false });

        setWithdrawals(withdrawalData || []);
      } catch (error) {
        console.error('Error loading withdrawals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWithdrawals();
  }, []);

  const handleApprove = async (id: string, amount: number, userId: string) => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'confirmed',
          processed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (!error) {
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'confirmed' } : w));
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
    }
  };

  const handleReject = async (id: string, amount: number, userId: string) => {
    try {
      // Update withdrawal status
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', id);

      // Refund balance to user
      if (!error) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ balance: profile.balance + amount })
            .eq('id', userId);
        }

        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
    }
  };

  if (isLoading) return <div className="text-white text-center">Carregando saques...</div>;

  return (
    <Card className="p-6 bg-casino-header/30 border-border">
      <h2 className="text-white text-lg font-bold mb-4">Solicitações de Saque</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="bg-background rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-white font-medium">{withdrawal.profile?.full_name}</div>
                <div className="text-sm text-muted-foreground">PIX: {withdrawal.profile?.cpf}</div>
                <div className="text-casino-gold font-bold">R$ {withdrawal.amount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="flex gap-2">
                {withdrawal.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(withdrawal.id, withdrawal.amount, withdrawal.user_id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(withdrawal.id, withdrawal.amount, withdrawal.user_id)}
                    >
                      Recusar
                    </Button>
                  </>
                )}
                {withdrawal.status === 'confirmed' && (
                  <span className="text-green-500 text-sm">Aprovado</span>
                )}
                {withdrawal.status === 'rejected' && (
                  <span className="text-red-500 text-sm">Recusado</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Revenue Section Component
const RevenueSection = () => {
  const [revenue, setRevenue] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const { data: deposits } = await supabase
          .from('deposits')
          .select('amount, created_at, status')
          .gt('amount', 0)
          .eq('status', 'confirmed');

        if (deposits) {
          const total = deposits.reduce((sum, d) => sum + d.amount, 0);
          
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const thisWeek = deposits
            .filter(d => new Date(d.created_at) >= weekAgo)
            .reduce((sum, d) => sum + d.amount, 0);
            
          const thisMonth = deposits
            .filter(d => new Date(d.created_at) >= monthAgo)
            .reduce((sum, d) => sum + d.amount, 0);

          setRevenue({ total, thisWeek, thisMonth });
        }
      } catch (error) {
        console.error('Error loading revenue:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRevenue();
  }, []);

  if (isLoading) return <div className="text-white text-center">Carregando dados financeiros...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-casino-header/30 border-border text-center">
        <div className="text-muted-foreground text-sm">Total Depositado</div>
        <div className="text-casino-gold text-2xl font-bold">R$ {revenue.total.toFixed(2)}</div>
      </Card>
      <Card className="p-6 bg-casino-header/30 border-border text-center">
        <div className="text-muted-foreground text-sm">Esta Semana</div>
        <div className="text-green-500 text-2xl font-bold">R$ {revenue.thisWeek.toFixed(2)}</div>
      </Card>
      <Card className="p-6 bg-casino-header/30 border-border text-center">
        <div className="text-muted-foreground text-sm">Este Mês</div>
        <div className="text-blue-500 text-2xl font-bold">R$ {revenue.thisMonth.toFixed(2)}</div>
      </Card>
    </div>
  );
};

// Banners Section Component
const BannersSection = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });
      
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to storage bucket
      const fileName = `banner-${Date.now()}-${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);
      
      // Insert banner record
      const { error } = await supabase
        .from('banners')
        .insert({
          title: `Banner ${banners.length + 1}`,
          image_url: publicUrl,
          active: true
        });

      if (!error) {
        await loadBanners();
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveBanner = async (bannerId: string) => {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerId);

      if (!error) {
        setBanners(prev => prev.filter(b => b.id !== bannerId));
      }
    } catch (error) {
      console.error('Error removing banner:', error);
    }
  };

  const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ active: !currentStatus })
        .eq('id', bannerId);

      if (!error) {
        setBanners(prev => prev.map(b => 
          b.id === bannerId ? { ...b, active: !currentStatus } : b
        ));
      }
    } catch (error) {
      console.error('Error updating banner status:', error);
    }
  };

  if (isLoading) return <div className="text-white text-center">Carregando banners...</div>;

  return (
    <Card className="p-6 bg-casino-header/30 border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-bold">Gerenciar Banners</h2>
        <div>
          <input
            type="file"
            id="banner-upload"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById('banner-upload')?.click()}
            disabled={isUploading}
            className="bg-casino-gold hover:bg-casino-gold/80 text-black"
          >
            {isUploading ? 'Enviando...' : 'Adicionar Banner'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {banners.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum banner encontrado. Adicione o primeiro banner!
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="bg-background rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-white font-medium">{banner.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Criado em: {new Date(banner.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className={`text-sm ${banner.active ? 'text-green-500' : 'text-red-500'}`}>
                    Status: {banner.active ? 'Ativo' : 'Inativo'}
                  </div>
                  {banner.image_url && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Arquivo: {banner.image_url}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleBannerStatus(banner.id, banner.active)}
                    className="text-xs"
                  >
                    {banner.active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveBanner(banner.id)}
                    className="text-xs"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

const SupportRequestsSection = () => {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const loadRequests = () => {
      const savedRequests = JSON.parse(localStorage.getItem('supportRequests') || '[]');
      setRequests(savedRequests);
    };
    loadRequests();
  }, []);

  const handleRemoveRequest = (id: string) => {
    const updatedRequests = requests.filter(req => req.id !== id);
    localStorage.setItem('supportRequests', JSON.stringify(updatedRequests));
    setRequests(updatedRequests);
  };

  return (
    <Card className="p-6 bg-casino-header/30 border-border">
      <h2 className="text-white text-xl font-bold mb-4">Solicitações de Suporte</h2>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma solicitação pendente</p>
        ) : (
          requests.map(request => (
            <div key={request.id} className="bg-background rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-white font-bold">{request.name}</div>
                  <div className="text-sm text-muted-foreground">{request.email}</div>
                  <div className="text-white mt-2">{request.problem}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(request.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveRequest(request.id)}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default AdminPage;