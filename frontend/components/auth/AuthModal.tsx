"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { walletService } from "@/lib/wallet/wallet-service";
import { useAuth } from "@/hooks/use-auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'signup';
  onSuccess: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, type, onSuccess, onAuthSuccess }: AuthModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleWalletAuth = async (authType: 'login' | 'signup') => {
    setIsWalletLoading(true);
    
    try {
      let result;
      
      if (authType === 'signup') {
        // Register with wallet
        result = await walletService.registerWithWallet();
        toast.success('Welcome to BitPay! Registration successful.');
      } else {
        // Login with wallet
        result = await walletService.loginWithWallet();
        toast.success('Welcome back to BitPay!');
      }

      if (result.success) {
        // Refresh auth state from cookies
        await refreshUser();
        
        // Call auth success callback to refresh header
        if (onAuthSuccess) {
          onAuthSuccess();
        }
        
        onSuccess();
        onClose();
        
        // Navigate to dashboard after auth state is refreshed
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else {
        toast.error(result.error || 'Wallet authentication failed');
      }
    } catch (error: any) {
      console.error('Wallet authentication error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsWalletLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters long');
          setIsLoading(false);
          return;
        }
      }

      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = type === 'login' 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(type === 'login' ? 'Welcome back to BitPay!' : 'BitPay account created successfully!');
        
        // Refresh auth state from cookies
        await refreshUser();
        
        // Call auth success callback to refresh header
        if (onAuthSuccess) {
          onAuthSuccess();
        }
        
        onSuccess();
        onClose();
        
        // Navigate to dashboard after auth state is refreshed
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else {
        toast.error(data.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsWalletLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {type === 'login' ? 'Welcome Back to BitPay' : 'Join BitPay'}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 mt-4"
        >
          {/* Wallet Authentication Section */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-brand-pink text-muted-foreground hover:bg-brand-pink hover:text-white transition-colors"
              onClick={() => handleWalletAuth(type)}
              disabled={isLoading || isWalletLoading}
            >
              {isWalletLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  {type === 'login' ? 'Login with Stacks Wallet' : 'Sign up with Stacks Wallet'}
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              Connect your Stacks wallet for secure Bitcoin streaming authentication
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading || isWalletLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading || isWalletLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading || isWalletLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isWalletLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {type === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading || isWalletLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || isWalletLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-brand-pink hover:bg-brand-pink/90 text-white"
              disabled={isLoading || isWalletLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {type === 'login' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                type === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>
        </motion.div>

        <div className="text-center text-sm text-muted-foreground">
          {type === 'login' ? (
            <>
              Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-brand-pink hover:text-brand-pink/80"
                onClick={() => {
                  // Switch to signup - parent component should handle this
                }}
                disabled={isLoading || isWalletLoading}
              >
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-brand-pink hover:text-brand-pink/80"
                onClick={() => {
                  // Switch to login - parent component should handle this
                }}
                disabled={isLoading || isWalletLoading}
              >
                Sign in
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}