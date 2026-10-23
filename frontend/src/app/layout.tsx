import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Oddora AI - Autonomous Sports Intelligence & Combinatorial Betslip Engine",
  description: "AI-driven quantitative sports picks, 20,000x accumulator slips, and daily self-learning autopsy.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#060913] text-[#ededed] overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-20 md:pb-8 overflow-x-hidden">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
