import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import DoubleGame from "./pages/DoubleGame";

import BonusPage from "./pages/BonusPage";
import BonusRulesPage from "./pages/BonusRulesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DepositPage from "./pages/DepositPage";
import PixPaymentPage from "./pages/PixPaymentPage";
import CouponsPage from "./pages/CouponsPage";
import AdminCouponsPage from "./pages/AdminCouponsPage";
import SupportPage from "./pages/SupportPage";
import HistoryPage from "./pages/HistoryPage";
import WithdrawalPage from "./pages/WithdrawalPage";
import AdminPage from "./pages/AdminPage";
import MenuPage from "./pages/MenuPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

const App = () => {
  useEffect(() => {
    // Try to grant weekly bonus when app loads and user is logged in
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await supabase.functions.invoke('grant-weekly-bonus', { body: {} });
        } catch (e) {
          // ignore
        }
      }
    };
    run();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoadingScreen />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DoubleGame />} />
            <Route path="/double-x" element={<DoubleGame />} />
            <Route path="/home" element={<Index />} />
            <Route path="/bonus" element={<BonusPage />} />
            <Route path="/bonus/regras" element={<BonusRulesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/depositar" element={<DepositPage />} />
            <Route path="/pix-payment" element={<PixPaymentPage />} />
            <Route path="/suporte" element={<SupportPage />} />
            <Route path="/historico" element={<HistoryPage />} />
            <Route path="/saque" element={<WithdrawalPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cupons" element={<CouponsPage />} />
            <Route path="/admin/cupons" element={<AdminCouponsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
