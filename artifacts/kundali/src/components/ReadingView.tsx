import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Printer, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { GenerateKundaliBody } from "@workspace/api-client-react";

const LOADING_MESSAGES = [
  "Aligning the planets…",
  "Calculating your Lagna…",
  "Reading the nakshatras…",
  "Unveiling your dasha…",
  "The cosmos is consulting…",
];

interface ReadingViewProps {
  formData: GenerateKundaliBody;
  onReset: () => void;
}

export function ReadingView({ formData, onReset }: ReadingViewProps) {
  const [reading, setReading] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const startedRef = useRef(false);
  const { toast } = useToast();

  const firstName = formData.fullName.split(" ")[0] || "Seeker";

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const abortController = new AbortController();

    const fetchReading = async () => {
      try {
        const url = `${import.meta.env.BASE_URL}api/kundali/generate`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(formData),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          toast({
            title: "Cosmic Interference",
            description: "Failed to connect to the astrometric server. Please try again.",
            variant: "destructive",
          });
          onReset();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const line = event.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.error) {
                toast({
                  title: "Cosmic Interference",
                  description: payload.error,
                  variant: "destructive",
                });
                onReset();
                return;
              }
              if (payload.done) {
                setIsDone(true);
                return;
              }
              if (payload.content) {
                setReading((prev) => prev + payload.content);
              }
            } catch (err) {
              console.error("Failed to parse SSE event", err);
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        toast({
          title: "Connection Lost",
          description: "The cosmic alignment was disrupted. Please try again.",
          variant: "destructive",
        });
        onReset();
      }
    };

    fetchReading();

    return () => {
      abortController.abort();
    };
  }, [formData, onReset, toast]);

  const hasStartedStreaming = reading.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] bg-background relative selection:bg-primary/30"
    >
      <AnimatePresence mode="wait">
        {!hasStartedStreaming ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5 } }}
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden z-10"
          >
            {/* Stars background */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-primary rounded-full"
                  initial={{ opacity: Math.random() * 0.5 + 0.1 }}
                  animate={{ opacity: [0.1, 0.8, 0.1] }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Rotating Yantra */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 mb-12 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-primary/20 rounded-full"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_hsl(var(--secondary))]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_hsl(var(--secondary))]" />
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_hsl(var(--secondary))]" />
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_hsl(var(--secondary))]" />
              </motion.div>
              <img
                src="/mandala.png"
                alt="Cosmic Wheel"
                className="w-3/4 h-3/4 opacity-60 animate-spin"
                style={{ animationDuration: "60s" }}
              />
            </div>

            <motion.div
              key={loadingMsgIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="text-center font-serif"
            >
              <p className="text-2xl text-primary mb-2">{firstName},</p>
              <p className="text-xl text-muted-foreground italic">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative z-20 w-full max-w-3xl mx-auto px-6 py-24 min-h-screen flex flex-col"
          >
            {/* Elegant Header */}
            <div className="text-center mb-16 no-print">
              <div className="w-16 h-16 mx-auto mb-6 opacity-80 mix-blend-screen">
                <img src="/mandala.png" alt="Yantra" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4 tracking-tight">
                Your Cosmic Blueprint
              </h1>
              <div className="w-24 h-px bg-secondary mx-auto mb-4" />
              <p className="text-muted-foreground font-serif italic text-lg">
                Calculated for {formData.placeOfBirth} • {formData.dateOfBirth}
              </p>
            </div>

            {/* Reading Content */}
            <div className="flex-grow prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:font-medium prose-headings:text-primary prose-p:font-sans prose-p:leading-relaxed prose-a:text-secondary prose-strong:text-foreground prose-em:italic prose-table:border-border max-w-none kundali-reading">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ node: _node, ...props }) => (
                    <div className="mt-20 mb-10 text-center print-break-inside-avoid">
                      <div className="flex items-center justify-center gap-4 mb-5">
                        <div className="h-px w-16 bg-secondary/40" />
                        <Sparkles className="w-4 h-4 text-secondary/70" />
                        <div className="h-px w-16 bg-secondary/40" />
                      </div>
                      <h2
                        className="!mt-0 text-3xl md:text-4xl tracking-tight"
                        {...props}
                      />
                    </div>
                  ),
                  h3: ({ node: _node, ...props }) => (
                    <h3
                      className="mt-12 mb-4 text-xl md:text-2xl font-serif text-secondary border-l-2 border-secondary/40 pl-4"
                      {...props}
                    />
                  ),
                  p: ({ node: _node, ...props }) => (
                    <p
                      className="mb-5 text-foreground/85 leading-[1.8]"
                      {...props}
                    />
                  ),
                  blockquote: ({ node: _node, ...props }) => (
                    <blockquote
                      className="my-8 border-l-4 border-primary/60 bg-primary/5 px-6 py-4 rounded-r-md italic text-foreground/90 [&_p]:mb-0 [&_p]:text-foreground/90"
                      {...props}
                    />
                  ),
                  ul: ({ node: _node, ...props }) => (
                    <ul
                      className="my-5 space-y-2 list-none pl-0 [&_li]:relative [&_li]:pl-6 [&_li]:before:content-['◆'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-0 [&_li]:before:text-secondary/70 [&_li]:before:text-xs [&_li]:before:translate-y-[6px]"
                      {...props}
                    />
                  ),
                  ol: ({ node: _node, ...props }) => (
                    <ol
                      className="my-5 space-y-2 list-decimal marker:text-secondary/70 pl-6"
                      {...props}
                    />
                  ),
                  li: ({ node: _node, ...props }) => (
                    <li className="text-foreground/85 leading-relaxed" {...props} />
                  ),
                  table: ({ node: _node, ...props }) => (
                    <div className="my-8 overflow-x-auto rounded-md border border-border/60 bg-card/40 print-break-inside-avoid">
                      <table
                        className="w-full text-sm md:text-base !my-0 border-collapse"
                        {...props}
                      />
                    </div>
                  ),
                  thead: ({ node: _node, ...props }) => (
                    <thead className="bg-primary/10" {...props} />
                  ),
                  th: ({ node: _node, ...props }) => (
                    <th
                      className="text-left font-serif font-medium text-primary px-4 py-3 border-b border-border/60"
                      {...props}
                    />
                  ),
                  td: ({ node: _node, ...props }) => (
                    <td
                      className="px-4 py-3 align-top text-foreground/85 border-b border-border/30 last:border-b-0"
                      {...props}
                    />
                  ),
                  hr: ({ node: _node, ...props }) => (
                    <hr
                      className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent"
                      {...props}
                    />
                  ),
                  strong: ({ node: _node, ...props }) => (
                    <strong
                      className="text-primary font-semibold"
                      {...props}
                    />
                  ),
                  em: ({ node: _node, ...props }) => (
                    <em
                      className="italic text-muted-foreground/90 block first:mt-1 first:mb-3 [h2+&]:text-center [h2+&]:text-base"
                      {...props}
                    />
                  ),
                }}
              >
                {reading}
              </ReactMarkdown>

              {!isDone && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-2 h-5 bg-secondary align-middle ml-1 translate-y-[2px]"
                />
              )}
            </div>

            {/* Done Actions */}
            <AnimatePresence>
              {isDone && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="sticky bottom-8 mt-24 flex flex-col sm:flex-row items-center justify-center gap-4 no-print bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-2xl"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.print()}
                    className="w-full sm:w-auto font-serif text-lg border-primary/20 hover:bg-primary/5"
                  >
                    <Printer className="mr-2 h-5 w-5" />
                    Print Reading
                  </Button>
                  <Button
                    onClick={onReset}
                    size="lg"
                    className="w-full sm:w-auto font-serif text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Begin New Reading
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
