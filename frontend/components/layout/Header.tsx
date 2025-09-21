"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { SimpleThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderLogo } from "@/components/ui/logo";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  LogOut, 
  Settings, 
  Wallet,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState<'login' | 'signup'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleOpenAuthModal = (type: 'login' | 'signup') => {
    setAuthModalType(type);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // Refresh will happen via useAuth
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          {/* Logo */}
          <HeaderLogo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/streams" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Streams
            </Link>
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/docs" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <SimpleThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User Info Display */}
                <div className="hidden lg:flex flex-col items-end text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.walletAddress ? (
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </span>
                    ) : (
                      user?.email
                    )}
                  </p>
                </div>
                
                {/* User Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-brand-pink text-white">
                          {user?.name ? getUserInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.walletAddress ? (
                            <span className="flex items-center gap-1">
                              <Wallet className="w-3 h-3" />
                              {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                            </span>
                          ) : (
                            user?.email
                          )}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/wallets" className="cursor-pointer">
                        <Wallet className="mr-2 h-4 w-4" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => handleOpenAuthModal('login')}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-brand-pink hover:bg-brand-pink/90 text-white"
                  onClick={() => handleOpenAuthModal('signup')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-16 left-0 right-0 z-40 border-t dark:bg-black bg-white  shadow-lg"
          >
              <div className="container mx-auto px-4 py-4 space-y-4">
                {/* Navigation Links */}
                <nav className="flex flex-col space-y-3">
                  <Link 
                    href="/" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/streams" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Streams
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/docs" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Documentation
                  </Link>
                </nav>

                {/* Mobile Actions */}
                <div className="flex flex-col space-y-3 pt-4 border-t">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-start px-3 py-2">
                    <span className="mr-2 text-sm">Theme:</span>
                    <SimpleThemeToggle />
                  </div>

                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-2 px-3 py-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-brand-pink text-white text-xs">
                            {user?.name ? getUserInitials(user.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user?.walletAddress ? (
                              <span className="flex items-center gap-1">
                                <Wallet className="w-3 h-3" />
                                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                              </span>
                            ) : (
                              user?.email
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        asChild
                      >
                        <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        asChild
                      >
                        <Link href="/dashboard/wallets" onClick={() => setIsMobileMenuOpen(false)}>
                          <Wallet className="mr-2 h-4 w-4" />
                          Wallet
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => {
                          handleOpenAuthModal('login');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="justify-start bg-brand-pink hover:bg-brand-pink/90 text-white"
                        onClick={() => {
                          handleOpenAuthModal('signup');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        type={authModalType}
        onSuccess={handleAuthSuccess}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}