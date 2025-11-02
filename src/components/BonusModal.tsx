import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
}

const BonusModal = ({ isOpen, onClose, title, message, type = "success" }: BonusModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-casino-header border-casino-gold max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={`text-xl font-bold ${
              type === "success" ? "text-casino-gold" : 
              type === "error" ? "text-red-500" : 
              "text-white"
            }`}>
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white hover:text-casino-gold"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="text-white text-center py-4">
          <p className="text-base leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <Button 
          onClick={onClose}
          className="w-full bg-casino-gold hover:bg-casino-gold/80 text-black font-bold"
        >
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BonusModal;
