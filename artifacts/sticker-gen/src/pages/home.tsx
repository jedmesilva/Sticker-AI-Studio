import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Loader2, Trash2, Wand2 } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(100, "Prompt is too long"),
});

export default function Home() {
  const [ideaIndex, setIdeaIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stickers, isLoading: isLoadingStickers } = useListStickers();
  const generateImage = useGenerateOpenaiImage();
  const createSticker = useCreateSticker();
  const deleteSticker = useDeleteSticker();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // Cycle ideas
  useEffect(() => {
    const timer = setInterval(() => {
      setIdeaIndex((prev) => (prev + 1) % IDEAS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // 1. Generate image
      const imageRes = await generateImage.mutateAsync({
        data: { prompt: values.prompt, size: "256x256" },
      });

      if (!imageRes.b64_json) {
        throw new Error("No image data returned");
      }

      // 2. Save sticker
      await createSticker.mutateAsync({
        data: {
          prompt: values.prompt,
          imageData: imageRes.b64_json,
        },
      });

      // 3. Invalidate query
      queryClient.invalidateQueries({ queryKey: getListStickersQueryKey() });
      
      form.reset();
      toast({
        title: "Magic complete!",
        description: "Your adorable sticker is ready.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Oops! The magic fizzled.",
        description: err.message || "Failed to generate sticker. Try again!",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSticker.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListStickersQueryKey() });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: "Something went wrong.",
      });
    }
  };

  const fillPrompt = (text: string) => {
    form.setValue("prompt", text);
  };

  const isGenerating = generateImage.isPending || createSticker.isPending;

  return (
    <div className="min-h-[100dvh] bg-background selection:bg-primary/30">
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>StickerAI Magic</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground max-w-3xl leading-tight">
            Imagine a sticker... <br />
            <span className="text-muted-foreground font-normal text-4xl md:text-5xl flex items-center justify-center gap-2 mt-2 h-[1.2em] overflow-hidden relative">
              like <AnimatePresence mode="popLayout">
                <motion.span
                  key={ideaIndex}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="text-primary font-bold inline-block"
                >
                  "{IDEAS[ideaIndex]}"
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto pt-4 font-sans">
            Describe anything you want, and our magical AI vending machine will pop out a cute, ready-to-use sticker instantly.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-2xl mb-16 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-3xl rounded-full opacity-50 pointer-events-none" />
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                {...form.register("prompt")}
                placeholder="What sticker do you want to create?"
                className="w-full text-lg py-7 px-6 rounded-3xl border-2 border-primary/20 shadow-sm bg-white/80 backdrop-blur-xl focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary pr-12 transition-all placeholder:text-muted-foreground"
                autoComplete="off"
                disabled={isGenerating}
                data-testid="input-prompt"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isGenerating || !form.watch("prompt")}
              className="py-7 px-8 rounded-3xl text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6 mr-2" />
                  Make it!
                </>
              )}
            </Button>
          </form>

          {/* Suggestions */}
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3 px-2">Try these ideas:</p>
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

        {/* Gallery Section */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-3xl font-display font-bold text-foreground">Your Sticker Collection</h2>
            <div className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
              {stickers?.length || 0} stickers
            </div>
          </div>

          {isLoadingStickers ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="aspect-square rounded-3xl bg-muted/50" />
              ))}
            </div>
          ) : stickers?.length === 0 ? (
            <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-muted">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center text-4xl text-primary">
                <Sparkles className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">No stickers yet!</h3>
              <p className="text-muted-foreground text-lg">Type an idea above to create your first magical sticker.</p>
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
                    <p className="text-sm font-medium text-primary text-center">Sprinkling magic dust...</p>
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
                    className="group relative aspect-square rounded-3xl bg-white shadow-sm border border-black/5 overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
                    data-testid={`card-sticker-${sticker.id}`}
                  >
                    <img 
                      src={`data:image/png;base64,${sticker.imageData}`} 
                      alt={sticker.prompt}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white font-medium text-sm drop-shadow-md truncate" title={sticker.prompt}>
                        {sticker.prompt}
                      </p>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 transition-all rounded-full w-8 h-8 shadow-lg"
                        onClick={() => handleDelete(sticker.id)}
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mask-edges {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </div>
  );
}
