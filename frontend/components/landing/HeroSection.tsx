"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { 
  ArrowRight, 
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    router.push('/dashboard');
  };

  return (
    <>
      <section className="relative min-h-[85vh] overflow-hidden pt-16">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[75vh]">
            
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-6 lg:space-y-8 text-center lg:text-left">
              
              {/* Main heading */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-4 lg:space-y-6"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9]">
                  <span className="text-foreground">
                    BitPay
                  </span>
                  <br />
                  <span className="text-foreground font-light">
                    Stream Bitcoin
                  </span>
                  <br />
                  <span className="text-foreground font-light">
                    Continuously
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
                  The most advanced platform for continuous Bitcoin payments. 
                  Built on Stacks for secure, programmable money flows.
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  className="bg-brand-pink hover:bg-brand-pink/90 text-white text-lg px-8 py-6 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={handleGetStarted}
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Start Streaming'}
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-full font-medium border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <a href="/docs">
                    Documentation
                  </a>
                </Button>
              </motion.div>
            </div>
            
            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex justify-center lg:block"
            >
              <div className="w-full max-w-sm sm:max-w-md lg:max-w-none">
                <HeroVisual />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        type="signup"
        onSuccess={handleAuthSuccess}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}