import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Moon, Sun } from "lucide-react";

interface LandingProps {
  onBegin: () => void;
}

export function Landing({ onBegin }: LandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      className="flex flex-col min-h-[100dvh]"
    >
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center p-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Celestial night sky" 
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/50 to-background" />
        </div>
        
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 max-w-4xl mx-auto space-y-8"
        >
          <div className="mx-auto w-32 h-32 mb-8 rounded-full overflow-hidden border border-primary/20 bg-background/50 backdrop-blur-sm flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
             <img src="/mandala.png" alt="Yantra Mandala" className="w-24 h-24 opacity-80" />
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-primary tracking-tight font-medium drop-shadow-sm">
            Kundali
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Discover the cosmic architecture of your soul. An ancient Vedic reading, translated for your modern journey.
          </p>
          
          <div className="pt-8">
            <Button 
              size="lg" 
              onClick={onBegin}
              className="font-serif text-lg px-10 py-6 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Begin Your Reading
              <Sparkles className="ml-2 h-5 w-5 opacity-70" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Info Section */}
      <section className="py-24 px-6 relative z-10 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-serif text-primary mb-6">What is a Janam Kundali?</h2>
            <div className="w-16 h-px bg-secondary mx-auto mb-6" />
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              In Vedic astrology, your Janam Kundali is a snapshot of the cosmos at the exact moment of your birth. It reveals the karmic patterns, innate strengths, and timeline of your life's unfolding.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 mt-16">
            {[
              { icon: Star, title: "1. Precision", desc: "Using your exact birth time and coordinates, we calculate the precise planetary positions." },
              { icon: Moon, title: "2. Depth", desc: "A comprehensive 11-part reading covering career, love, health, wealth, and destiny." },
              { icon: Sun, title: "3. Guidance", desc: "Actionable remedies and spiritual guidance tailored to your unique cosmic blueprint." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-12 h-12 rounded-full border border-secondary/30 flex items-center justify-center text-secondary mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-serif text-primary">{feature.title}</h3>
                <p className="text-foreground/70 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border/40 text-center text-muted-foreground font-serif italic relative z-10 bg-background">
        <p>"As above, so below. As within, so without."</p>
      </footer>
    </motion.div>
  );
}