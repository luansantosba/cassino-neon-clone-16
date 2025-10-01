import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ScratchCardGame from "./pages/ScratchCardGame";
import ScratchCard5to2500Game from "./pages/ScratchCard5to2500Game";
import ScratchCard20to50000Game from "./pages/ScratchCard20to50000Game";
import DoubleGame from "./pages/DoubleGame";

import BonusPage from "./pages/BonusPage";
import BonusRulesPage from "./pages/BonusRulesPage";
import ScratchCardRulesPage from "./pages/ScratchCardRulesPage";
import ScratchCard5to2500RulesPage from "./pages/ScratchCard5to2500RulesPage";
import ScratchCard20to50000RulesPage from "./pages/ScratchCard20to50000RulesPage";
import ScratchCard10to15000Game from "./pages/ScratchCard10to15000Game";
import ScratchCard10to15000RulesPage from "./pages/ScratchCard10to15000RulesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DepositPage from "./pages/DepositPage";
import PixPaymentPage from "./pages/PixPaymentPage";
import AffiliatesPage from "./pages/AffiliatesPage";
import SupportPage from "./pages/SupportPage";
import HistoryPage from "./pages/HistoryPage";
import WithdrawalPage from "./pages/WithdrawalPage";
import AdminPage from "./pages/AdminPage";
import MenuPage from "./pages/MenuPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/raspadinha" element={<ScratchCardGame />} />
          <Route path="/raspadinha/regras" element={<ScratchCardRulesPage />} />
          <Route path="/raspadinha-5-para-2500" element={<ScratchCard5to2500Game />} />
          <Route path="/raspadinha-5-para-2500/regras" element={<ScratchCard5to2500RulesPage />} />
          <Route path="/raspadinha-10-para-15000" element={<ScratchCard10to15000Game />} />
          <Route path="/raspadinha-10-para-15000/regras" element={<ScratchCard10to15000RulesPage />} />
          <Route path="/raspadinha-20-para-50000" element={<ScratchCard20to50000Game />} />
          <Route path="/raspadinha-20-para-50000/regras" element={<ScratchCard20to50000RulesPage />} />
          
          <Route path="/double" element={<DoubleGame />} />
          <Route path="/bonus" element={<BonusPage />} />
          <Route path="/bonus/regras" element={<BonusRulesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/depositar" element={<DepositPage />} />
          <Route path="/pix-payment" element={<PixPaymentPage />} />
          <Route path="/afiliados" element={<AffiliatesPage />} />
          <Route path="/suporte" element={<SupportPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/saque" element={<WithdrawalPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/menu" element={<MenuPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
