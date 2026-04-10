import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StickerModalProps {
  sticker: { id: number; prompt: string; imageData: string } | null;
  onClose: () => void;
}

export function StickerModal({ sticker, onClose }: StickerModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleDownload = () => {
    if (!sticker) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${sticker.imageData}`;
    link.download = `sticker-${sticker.id}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!sticker) return;
    const dataUrl = `data:image/png;base64,${sticker.imageData}`;

    if (navigator.share && navigator.canShare) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `sticker-${sticker.id}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: sticker.prompt });
          return;
        }
      } catch {}
    }

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copiado!", description: "Sticker copiado para a área de transferência." });
    } catch {
      toast({ title: "Não foi possível compartilhar", variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      {sticker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          data-testid="modal-backdrop"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-sticker"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-8 flex items-center justify-center">
              <img
                src={`data:image/png;base64,${sticker.imageData}`}
                alt={sticker.prompt}
                className="w-56 h-56 object-contain rounded-2xl drop-shadow-xl"
              />
            </div>

            <div className="p-6">
              <p className="text-sm font-medium text-muted-foreground text-center mb-5 line-clamp-2">
                {sticker.prompt}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  className="flex-1 rounded-2xl py-6 font-bold shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 rounded-2xl py-6 font-bold border-2"
                  data-testid="button-share"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 mr-2 text-green-500" />Copiado!</>
                  ) : (
                    <><Share2 className="w-4 h-4 mr-2" />Compartilhar</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
