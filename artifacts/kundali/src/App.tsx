import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { Landing } from "@/components/Landing";
import { KundaliForm } from "@/components/KundaliForm";
import { ReadingView } from "@/components/ReadingView";
import type { GenerateKundaliBody } from "@workspace/api-client-react";

const queryClient = new QueryClient();

type AppState = "landing" | "form" | "reading";

function KundaliApp() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [formData, setFormData] = useState<GenerateKundaliBody | null>(null);

  const handleBegin = () => setAppState("form");
  
  const handleFormSubmit = (data: GenerateKundaliBody) => {
    setFormData(data);
    setAppState("reading");
  };

  const handleReset = () => {
    setFormData(null);
    setAppState("landing");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground dark selection:bg-primary/30">
      <AnimatePresence mode="wait">
        {appState === "landing" && (
          <Landing key="landing" onBegin={handleBegin} />
        )}
        {appState === "form" && (
          <KundaliForm key="form" onSubmit={handleFormSubmit} />
        )}
        {appState === "reading" && formData && (
          <ReadingView key="reading" formData={formData} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <KundaliApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;