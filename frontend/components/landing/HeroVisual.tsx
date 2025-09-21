"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Bitcoin, Zap, Shield, Clock } from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative h-full flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Floating Cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-10 right-10"
        >
          <Card className="w-48 shadow-xl border-brand-teal/20 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-brand-teal" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Active Stream</p>
                  <p className="text-xs text-muted-foreground">0.00234 BTC/day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-20 left-5"
        >
          <Card className="w-52 shadow-xl border-brand-pink/20 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-brand-pink" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Secure Transfer</p>
                  <p className="text-xs text-muted-foreground">99.9% uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute top-32 left-16"
        >
          <Card className="w-44 shadow-xl border-foreground/10 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Real-time</p>
                  <p className="text-xs text-muted-foreground">Instant updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Central Visual Element */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-10"
      >
        <div className="w-80 h-80 rounded-3xl bg-card/95 backdrop-blur-sm border shadow-2xl flex items-center justify-center ring-1 ring-white/10">
          <div className="text-center space-y-6">
            {/* Bitcoin Flow Visualization */}
            <div className="flex items-center justify-center space-x-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 rounded-full bg-brand-pink flex items-center justify-center"
              >
                <Bitcoin className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex space-x-1"
              >
                <div className="w-2 h-2 rounded-full bg-brand-teal"></div>
                <div className="w-2 h-2 rounded-full bg-brand-teal"></div>
                <div className="w-2 h-2 rounded-full bg-brand-teal"></div>
              </motion.div>
              
              <motion.div
                animate={{ 
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-16 h-16 rounded-full bg-brand-teal flex items-center justify-center"
              >
                <Zap className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Continuous Flow</h3>
              <p className="text-sm text-muted-foreground">
                Bitcoin streams 24/7
              </p>
            </div>
            
            {/* Progress Indicator */}
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "75%" }}
                transition={{ duration: 2, delay: 1 }}
                className="h-full bg-brand-pink rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animated Background Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Teal dots */}
        {[...Array(35)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-brand-teal/25 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.6, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        {/* Pink accent dots */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`pink-${i}`}
            className="absolute w-1 h-1 bg-brand-pink/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>
    </div>
  );
}