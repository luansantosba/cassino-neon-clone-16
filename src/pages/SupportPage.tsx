import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send } from "lucide-react";
import { toast } from "sonner";

type ChatMessage = {
  type: 'bot' | 'user';
  text: string;
};

type ChatStep = 'initial' | 'problem-asked' | 'awaiting-details' | 'completed';

const SupportPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { type: 'bot', text: 'Olá sou o BDC, assistente virtual do site Bet dos Crias. Qual o seu problema?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>('initial');
  const [problemDescription, setProblemDescription] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showForm, setShowForm] = useState(false);

  const addBotMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text }]);
      setIsTyping(false);
    }, 1500); // Simulate typing delay
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInputValue('');

    if (chatStep === 'initial') {
      // User described their problem
      setProblemDescription(userMessage);
      setChatStep('problem-asked');
      addBotMessage('Entendi, o seu problema será enviado para a equipe responsável, digite o seu email usado no cadastrado');
      setTimeout(() => {
        setShowForm(true);
      }, 2000);
    }
  };

  const handleSubmitDetails = () => {
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    // Save support request to localStorage (will be shown in admin panel)
    const supportRequests = JSON.parse(localStorage.getItem('supportRequests') || '[]');
    const newRequest = {
      id: Date.now().toString(),
      name: userName,
      email: userEmail,
      problem: problemDescription,
      createdAt: new Date().toISOString()
    };
    supportRequests.push(newRequest);
    localStorage.setItem('supportRequests', JSON.stringify(supportRequests));

    setChatStep('completed');
    setShowForm(false);
    addBotMessage('A sua solicitação foi enviada para a nossa equipe, você receberá uma resposta em até 5 dias úteis no email que digitou acima.');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: '' }]);
    }, 3000);
  };

  const handleEndChat = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col h-screen">
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
          <h1 className="text-lg font-bold text-white">Suporte BDC</h1>
          <div className="h-8 w-8" />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card 
                className={`max-w-[80%] p-3 ${
                  message.type === 'user' 
                    ? 'bg-casino-gold text-black' 
                    : 'bg-casino-header/30 border-border text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </Card>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <Card className="bg-casino-header/30 border-border p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </Card>
            </div>
          )}

          {/* Form for name and email */}
          {showForm && (
            <div className="space-y-3">
              <Card className="p-4 bg-casino-header/30 border-border">
                <div className="space-y-3">
                  <div>
                    <label className="text-white text-sm block mb-2">Nome</label>
                    <Input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="bg-background border-border text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm block mb-2">E-mail usado no cadastro</label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="bg-background border-border text-white"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitDetails}
                    className="w-full bg-casino-gold hover:bg-casino-gold/80 text-black font-bold"
                  >
                    Enviar
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* End Chat Button */}
          {chatStep === 'completed' && (
            <div className="flex justify-center">
              <Button
                onClick={handleEndChat}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Encerrar Chat
              </Button>
            </div>
          )}
        </div>

        {/* Input Area */}
        {chatStep !== 'completed' && !showForm && (
          <div className="p-4 border-t border-border bg-casino-header/30">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                className="bg-background border-border text-white"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-casino-gold hover:bg-casino-gold/80 text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
