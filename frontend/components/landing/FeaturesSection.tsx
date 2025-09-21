"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  Bitcoin, 
  Zap, 
  Shield, 
  Clock,
  TrendingUp,
  Wallet
} from "lucide-react";
import { motion } from "framer-motion";

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Why Choose BitPay Streams?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built on Bitcoin's security with Stacks smart contracts for programmable money flows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-brand-pink/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-brand-pink/10 flex items-center justify-center">
                  <Bitcoin className="w-6 h-6 text-brand-pink" />
                </div>
                <h3 className="text-xl font-semibold">Bitcoin Native</h3>
                <p className="text-muted-foreground">
                  Stream real Bitcoin using sBTC, backed by the world's most secure blockchain network.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-brand-teal/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-brand-teal" />
                </div>
                <h3 className="text-xl font-semibold">Instant Streams</h3>
                <p className="text-muted-foreground">
                  Create and manage payment streams instantly with our intuitive dashboard and smart contracts.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-brand-pink/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-brand-pink/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-brand-pink" />
                </div>
                <h3 className="text-xl font-semibold">Secure & Trustless</h3>
                <p className="text-muted-foreground">
                  No intermediaries. Your funds are secured by Stacks smart contracts and Bitcoin's security.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-brand-teal/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-brand-teal" />
                </div>
                <h3 className="text-xl font-semibold">Flexible Scheduling</h3>
                <p className="text-muted-foreground">
                  Set custom durations, amounts, and schedules. Perfect for salaries, subscriptions, or investments.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 5 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-brand-pink/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-brand-pink/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-brand-pink" />
                </div>
                <h3 className="text-xl font-semibold">Real-time Analytics</h3>
                <p className="text-muted-foreground">
                  Monitor your streams with detailed analytics, transaction history, and performance metrics.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 6 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-brand-teal/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-brand-teal" />
                </div>
                <h3 className="text-xl font-semibold">Wallet Integration</h3>
                <p className="text-muted-foreground">
                  Connect with popular Stacks wallets like Leather and Xverse for seamless authentication.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}