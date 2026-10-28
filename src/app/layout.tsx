import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oddora AI V2 - Quantitative Sports Intelligence & Slip Solver",
  description: "Next-generation sports analytical engine with automated booking code synthesis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070d1e] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

