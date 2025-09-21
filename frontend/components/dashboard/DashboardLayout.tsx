"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardLogo, LoadingLogo } from "@/components/ui/logo";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu,
  Home,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  Copy,
  Check,
  Zap,
  Plus
} from "lucide-react";
import { SimpleThemeToggle } from "@/components/ui/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  authMethod?: string;
  walletAddress?: string;
  walletType?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const pathname = usePathname();

  // Format wallet address for display (first 6 + last 4 characters)
  const formatWalletAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy wallet address to clipboard with animation
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      // Use fetch with credentials to include HTTP-only cookies
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // This ensures cookies are sent
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        // Not authenticated or token expired
        window.location.href = '/';
      } else {
        // Other error, redirect to login
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      window.location.href = '/';
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingLogo href={undefined} />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const sidebarItems = [
    { icon: Home, label: "Overview", href: "/dashboard", active: pathname === "/dashboard" },
    { 
      icon: Zap, 
      label: "Streams", 
      href: "/dashboard/streams", 
      active: pathname.startsWith("/dashboard/streams"),
      hasSubmenu: true,
      submenu: [
        { label: "All Streams", href: "/dashboard/streams" },
        { label: "Create Stream", href: "/dashboard/streams/create", icon: Plus },
      ]
    },
    { icon: Wallet, label: "Wallets", href: "/dashboard/wallets", active: pathname === "/dashboard/wallets" },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: pathname === "/dashboard/analytics" },
    ...(user?.role === 'admin' ? [
      { icon: Users, label: "Users", href: "/dashboard/users", active: pathname === "/dashboard/users" }
    ] : []),
    { icon: Settings, label: "Settings", href: "/dashboard/settings", active: pathname === "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : 240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-40 h-screen bg-card border-r hidden lg:block"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div
                  key="logo-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center space-x-2"
                >
                  <DashboardLogo href="/" className="hover:opacity-80 transition-opacity" />
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto"
                >
                  <DashboardLogo href="/" variant="icon-only" className="hover:opacity-80 transition-opacity" />
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    item.active 
                      ? "bg-brand-pink text-white" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                
                {/* Submenu for Streams */}
                {item.hasSubmenu && item.active && !sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-6 mt-1 space-y-1"
                  >
                    {item.submenu?.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className={cn(
                          "flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          pathname === subitem.href
                            ? "bg-brand-pink/20 text-brand-pink" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {subitem.icon && <subitem.icon className="h-3 w-3" />}
                        <span>{subitem.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </motion.aside>


      {/* Main Content */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          "lg:pl-60", // Default desktop sidebar width
          sidebarCollapsed && "lg:pl-[60px]" // Collapsed sidebar width
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center px-4 border-b">
                  <DashboardLogo href="/" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4">
                  {sidebarItems.map((item) => (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          item.active 
                            ? "bg-brand-pink text-white" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                      
                      {/* Submenu for Streams */}
                      {item.hasSubmenu && item.active && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.submenu?.map((subitem) => (
                            <Link
                              key={subitem.href}
                              href={subitem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                pathname === subitem.href
                                  ? "bg-brand-pink/20 text-brand-pink" 
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              {subitem.icon && <subitem.icon className="h-3 w-3" />}
                              <span>{subitem.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            <SimpleThemeToggle />

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-brand-pink"></Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-brand-pink text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    {user.authMethod === 'wallet' && user.walletAddress ? (
                      <div className="flex items-center space-x-2 text-xs leading-none text-muted-foreground">
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          {formatWalletAddress(user.walletAddress)}
                        </code>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            copyWalletAddress(user.walletAddress!);
                          }}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Copy wallet address"
                        >
                          <motion.div
                            initial={false}
                            animate={copiedAddress ? { scale: 1.1 } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {copiedAddress ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </motion.div>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}