"use client";

import { motion } from "framer-motion";
import { Wallet, Settings, TrendingUp, ArrowRight } from "lucide-react";

export function HowItWorksSection() {
  return (
    <section className="py-32 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Get started with Bitcoin streaming in three simple steps
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Connection Lines */}
          <div className="hidden md:block absolute top-20 left-1/2 transform -translate-x-1/2 w-full">
            <div className="flex items-center justify-between px-32">
              <ArrowRight className="w-8 h-8 text-brand-teal/30" />
              <ArrowRight className="w-8 h-8 text-brand-pink/30" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative text-center space-y-6 group"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-brand-pink shadow-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-bold shadow-md">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold">Connect Wallet</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
                Connect your Stacks wallet (Leather, Xverse) or create an account with email.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative text-center space-y-6 group"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-brand-teal shadow-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-sm font-bold shadow-md">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold">Create Stream</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
                Set recipient, amount, duration, and let our smart contract handle the rest.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="relative text-center space-y-6 group"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-brand-pink shadow-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-bold shadow-md">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold">Track & Manage</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
                Monitor your streams in real-time and withdraw funds as they vest.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}