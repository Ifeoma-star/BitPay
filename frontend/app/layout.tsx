import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/lib/theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BitPay - Stream Bitcoin Continuously",
  description: "Create continuous streams of Bitcoin payments using sBTC. Built on Stacks for secure, programmable money flows.",
  keywords: "Bitcoin, sBTC, Stacks, streaming payments, cryptocurrency, DeFi",
  authors: [{ name: "BitPay Team" }],
  openGraph: {
    title: "BitPay - Stream Bitcoin Continuously",
    description: "Create continuous streams of Bitcoin payments using sBTC. Built on Stacks for secure, programmable money flows.",
    type: "website",
    url: "https://bitpay.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "BitPay - Stream Bitcoin Continuously",
    description: "Create continuous streams of Bitcoin payments using sBTC. Built on Stacks for secure, programmable money flows.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
