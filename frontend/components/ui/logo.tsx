"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bitcoin, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface LogoProps {
  variant?: "default" | "icon-only" | "text-only" | "minimal";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string;
  showTagline?: boolean;
  animated?: boolean;
}

export function Logo({ 
  variant = "default", 
  size = "md", 
  className,
  href = "/",
  showTagline = false,
  animated = false
}: LogoProps) {
  const sizeClasses = {
    xs: {
      icon: "h-5 w-5",
      text: "text-lg",
      container: "space-x-2",
      tagline: "text-xs"
    },
    sm: {
      icon: "h-6 w-6",
      text: "text-xl",
      container: "space-x-2",
      tagline: "text-sm"
    },
    md: {
      icon: "h-8 w-8",
      text: "text-2xl",
      container: "space-x-2.5",
      tagline: "text-sm"
    },
    lg: {
      icon: "h-10 w-10",
      text: "text-3xl",
      container: "space-x-3",
      tagline: "text-base"
    },
    xl: {
      icon: "h-12 w-12",
      text: "text-4xl",
      container: "space-x-3.5",
      tagline: "text-lg"
    }
  };

  const IconComponent = () => (
    <motion.div 
      className={cn(
        "relative flex items-center justify-center rounded-xl shadow-lg",
        "bg-brand-pink",
        "border border-white/20 dark:border-white/10",
        sizeClasses[size].icon
      )}
      whileHover={animated ? { 
        scale: 1.05
      } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Main Bitcoin Icon */}
      <Bitcoin className={cn(
        "text-white drop-shadow-sm",
        size === "xs" ? "h-3 w-3" :
        size === "sm" ? "h-3.5 w-3.5" :
        size === "md" ? "h-4 w-4" :
        size === "lg" ? "h-5 w-5" : "h-6 w-6"
      )} />
      
      {/* Lightning Bolt Overlay */}
      <Zap className={cn(
        "absolute text-yellow-200 drop-shadow-sm",
        size === "xs" ? "h-2 w-2 -top-0.5 -right-0.5" :
        size === "sm" ? "h-2.5 w-2.5 -top-0.5 -right-0.5" :
        size === "md" ? "h-3 w-3 -top-1 -right-1" :
        size === "lg" ? "h-3.5 w-3.5 -top-1 -right-1" : "h-4 w-4 -top-1 -right-1"
      )} />
    </motion.div>
  );

  const TextComponent = () => (
    <div className="flex flex-col justify-center">
      <motion.div
        className="flex items-center"
        whileHover={animated ? { scale: 1.02 } : {}}
      >
        <span className={cn(
          "font-black tracking-tight",
          "text-gray-900 dark:text-white",
          sizeClasses[size].text
        )}>
          BitPay
        </span>
      </motion.div>
      
      {showTagline && (
        <span className={cn(
          "font-medium mt-0.5",
          "text-gray-600 dark:text-gray-400",
          sizeClasses[size].tagline
        )}>
          Stream Bitcoin
        </span>
      )}
    </div>
  );

  const LogoContent = () => {
    switch (variant) {
      case "icon-only":
        return <IconComponent />;
      case "text-only":
        return <TextComponent />;
      case "minimal":
        return (
          <div className={cn("flex items-center", sizeClasses[size].container)}>
            <IconComponent />
            <TextComponent />
          </div>
        );
      default:
        return (
          <motion.div 
            className={cn("flex items-center", sizeClasses[size].container)}
            whileHover={animated ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <IconComponent />
            <TextComponent />
          </motion.div>
        );
    }
  };

  if (href) {
    return (
      <Link 
        href={href} 
        className={cn(
          "inline-flex items-center transition-all duration-200",
          "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-pink/20 rounded-lg p-1",
          className
        )}
      >
        <LogoContent />
      </Link>
    );
  }

  return (
    <div className={cn("inline-flex items-center", className)}>
      <LogoContent />
    </div>
  );
}

// Specialized logo variants for different use cases
export function HeaderLogo(props: Omit<LogoProps, "variant">) {
  return <Logo variant="default" size="sm" animated={false} {...props} />;
}

export function FooterLogo(props: Omit<LogoProps, "variant">) {
  return <Logo variant="default" size="sm" showTagline animated={false} {...props} />;
}

export function DashboardLogo(props: Omit<LogoProps, "variant">) {
  return <Logo variant="default" size="md" animated={false} {...props} />;
}

export function LoadingLogo(props: Omit<LogoProps, "variant">) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Logo variant="default" size="xl" showTagline animated={true} {...props} />
    </motion.div>
  );
}