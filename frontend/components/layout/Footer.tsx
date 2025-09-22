"use client";

import Link from "next/link";
import { Github, Twitter, Globe, Bitcoin } from "lucide-react";
import { FooterLogo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <FooterLogo />
            <p className="text-sm text-muted-foreground max-w-xs">
              Stream Bitcoin payments continuously with sBTC. Built on Stacks for secure, programmable money flows.
            </p>
            <div className="flex items-center space-x-4">
              <Link 
                href="https://github.com/bitpay" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link 
                href="https://twitter.com/bitpay" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link 
                href="https://stacks.co" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Bitcoin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Product</h3>
            <div className="space-y-3 text-sm">
              <Link 
                href="/streams" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Bitcoin Streams
              </Link>
              <Link 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Dashboard
              </Link>
              <Link 
                href="/analytics" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Analytics
              </Link>
              <Link 
                href="/integrations" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Integrations
              </Link>
            </div>
          </div>

          {/* Developers */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Developers</h3>
            <div className="space-y-3 text-sm">
              <Link 
                href="/docs" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Documentation
              </Link>
              <Link 
                href="/docs/api" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                API Reference
              </Link>
              <Link 
                href="/docs/sdk" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                SDK
              </Link>
              <Link 
                href="/docs/examples" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Examples
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Company</h3>
            <div className="space-y-3 text-sm">
              <Link 
                href="/about" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                About
              </Link>
              <Link 
                href="/blog" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Blog
              </Link>
              <Link 
                href="/careers" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Careers
              </Link>
              <Link 
                href="/contact" 
                className="text-muted-foreground hover:text-foreground transition-colors block"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link 
                href="/privacy" 
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/security" 
                className="hover:text-foreground transition-colors"
              >
                Security
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BitPay. Built on Bitcoin & Stacks.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}