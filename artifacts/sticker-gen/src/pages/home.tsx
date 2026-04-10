import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Loader2, Trash2, Wand2, ImagePlus, X as XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useListStickers,
  useCreateSticker,
  useDeleteSticker,
  useGenerateOpenaiImage,
  getListStickersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StickerModal } from "@/components/sticker-modal";

const IDEAS = [
  "a tiny astronaut cat",
  "rainbow pizza slice",
  "sleepy avocado",
  "grumpy cloud with lightning",
  "cute frog holding a coffee",
  "space hamster in a mech suit",
  "tiny dancing cactus",
  "wizard penguin reading a book",
];

const formSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(200, "Prompt is too long"),
});

export default function Home() {
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [selectedSticker, setSelectedSticker] = useState<{ id: number; prompt: string; imageData: string } | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stickers, isLoading: isLoadingStickers } = useListStickers();
  const generateImage = useGenerateOpenaiImage();
  const createSticker = useCreateSticker();
  const deleteSticker = useDeleteSticker();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: "" },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setIdeaIndex((prev) => (prev + 1) % IDEAS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Arquivo inválido", description: "Selecione uma imagem." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setReferenceImage(base64);
      setReferencePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearReference = () => {
    setReferenceImage(null);
    setReferencePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const imageRes = await generateImage.mutateAsync({
        data: {
          prompt: values.prompt,
          size: "1024x1024",
          ...(referenceImage ? { referenceImageData: referenceImage } : {}),
        },
      });

      if (!imageRes.b64_json) throw new Error("No image data returned");

      await createSticker.mutateAsync({
        data: { prompt: values.prompt, imageData: imageRes.b64_json },
      });

      queryClient.invalidateQueries({ queryKey: getListStickersQueryKey() });
      form.reset();
      clearReference();
      toast({ title: "Sticker criado!", description: "Seu adesivo ficou lindo." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tente novamente.";
      toast({ variant: "destructive", title: "Oops! Algo deu errado.", description: message });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteSticker.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListStickersQueryKey() });
      if (selectedSticker?.id === id) setSelectedSticker(null);
    } catch {
      toast({ variant: "destructive", title: "Não foi possível deletar." });
    }
  };

  const fillPrompt = (text: string) => form.setValue("prompt", text);
  const isGenerating = generateImage.isPending || createSticker.isPending;

  return (
    <div className="min-h-[100dvh] bg-background selection:bg-primary/30">
      <StickerModal sticker={selectedSticker} onClose={() => setSelectedSticker(null)} />

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 flex flex-col items-center">

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>StickerAI Magic</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground max-w-3xl leading-tight">
            Imagine a sticker...
            <div className="mt-3 flex flex-col items-center gap-1">
              <span className="text-muted-foreground font-normal text-2xl md:text-3xl">like</span>
              <div className="overflow-hidden w-full flex justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={ideaIndex}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="text-primary font-bold text-3xl md:text-5xl inline-block text-center px-2"
                  >
                    "{IDEAS[ideaIndex]}"
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto pt-4 font-sans">
            Descreva qualquer coisa e nossa máquina mágica vai criar um sticker fofo na hora.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-2xl mb-16 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-3xl rounded-full opacity-50 pointer-events-none" />

          {/* Reference image preview */}
          <AnimatePresence>
            {referencePreview && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative mb-3 flex items-center gap-3 bg-white/80 border border-primary/20 rounded-2xl px-4 py-3"
              >
                <img src={referencePreview} alt="Referência" className="w-12 h-12 rounded-xl object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Imagem de referência</p>
                  <p className="text-xs text-muted-foreground">A IA vai usar esta imagem como inspiração</p>
                </div>
                <button
                  onClick={clearReference}
                  className="w-7 h-7 rounded-full bg-muted hover:bg-destructive/10 flex items-center justify-center transition-colors"
                  data-testid="button-clear-reference"
                >
                  <XIcon className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Input
                {...form.register("prompt")}
                placeholder="Que sticker você quer criar?"
                className="w-full h-14 text-base pl-5 pr-12 rounded-2xl border-2 border-primary/20 shadow-sm bg-white/80 backdrop-blur-xl focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-muted-foreground"
                autoComplete="off"
                disabled={isGenerating}
                data-testid="input-prompt"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReferenceUpload}
                data-testid="input-reference-file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Adicionar imagem de referência"
                data-testid="button-upload-reference"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </div>
            <Button
              type="submit"
              disabled={isGenerating || !form.watch("prompt")}
              className="h-14 px-7 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
              data-testid="button-generate"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando...</>
              ) : (
                <><Wand2 className="w-5 h-5 mr-2" />Make it!</>
              )}
            </Button>
          </form>

          {/* Suggestions */}
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3 px-2">Experimente:</p>
            <div className="flex gap-2 overflow-x-auto pb-4 px-2 snap-x scrollbar-hide mask-edges">
              {IDEAS.slice(0, 6).map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => fillPrompt(idea)}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-border shadow-sm text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors snap-start active:scale-95"
                  data-testid={`button-suggestion-${idx}`}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-3xl font-display font-bold text-foreground">Sua Coleção</h2>
            <div className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
              {stickers?.length || 0} stickers
            </div>
          </div>

          {isLoadingStickers ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-3xl bg-muted/50" />
              ))}
            </div>
          ) : !stickers?.length ? (
            <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-muted">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">Nenhum sticker ainda!</h3>
              <p className="text-muted-foreground text-lg">Digite uma ideia acima para criar seu primeiro sticker mágico.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="aspect-square rounded-3xl bg-white border-2 border-primary/20 shadow-sm flex flex-col items-center justify-center p-6 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse" />
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="text-sm font-medium text-primary text-center">Espalhando pó mágico...</p>
                  </motion.div>
                )}
                {stickers?.map((sticker) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    key={sticker.id}
                    className="group relative aspect-square rounded-3xl bg-white shadow-sm border border-black/5 overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedSticker(sticker)}
                    data-testid={`card-sticker-${sticker.id}`}
                  >
                    <img
                      src={`data:image/png;base64,${sticker.imageData}`}
                      alt={sticker.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white font-medium text-sm drop-shadow-md truncate" title={sticker.prompt}>
                        {sticker.prompt}
                      </p>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all rounded-full w-8 h-8 shadow-lg"
                        onClick={(e) => handleDelete(e, sticker.id)}
                        data-testid={`button-delete-${sticker.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-edges { mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); }
      `}</style>
    </div>
  );
}
