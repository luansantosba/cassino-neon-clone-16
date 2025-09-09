import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
}

const HistoryPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Load deposits
        const { data: deposits } = await supabase
          .from('deposits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Load withdrawals
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const allTransactions: Transaction[] = [
          ...(deposits || []).map(d => ({
            id: d.id,
            type: 'deposit' as const,
            amount: d.amount,
            status: d.status === 'confirmed' ? 'completed' as const : 'pending' as const,
            created_at: d.created_at || ''
          })),
          ...(withdrawals || []).map(w => ({
            id: w.id,
            type: 'withdrawal' as const,
            amount: w.amount,
            status: w.status === 'confirmed' ? 'completed' as const : 
                   w.status === 'rejected' ? 'rejected' as const : 'pending' as const,
            created_at: w.created_at || ''
          }))
        ];

        // Sort by date
        allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'rejected': return 'Reprovado';
      default: return 'Pendente';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

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
          <h1 className="text-lg font-bold text-white">Histórico</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6">
          {transactions.length === 0 ? (
            <Card className="p-6 bg-casino-header/30 border-border text-center">
              <p className="text-white">Nenhuma transação encontrada.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-4 bg-casino-header/30 border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {transaction.type === 'deposit' ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="text-white font-medium">
                          {transaction.type === 'deposit' ? 'Depósito' : 'Saque'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">
                        R$ {transaction.amount.toFixed(2)}
                      </div>
                      <div className={`text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;