import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Oddora AI V2 - Quantitative Sports Intelligence & Slip Solver",
  description: "Next-generation sports analytical engine with automated booking code synthesis",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 3,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("oddora_theme")||"light";if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");document.documentElement.setAttribute("data-theme","dark");}else{document.documentElement.classList.add("light");document.documentElement.classList.remove("dark");document.documentElement.setAttribute("data-theme","light");}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-[#070A0E] text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-black transition-colors duration-150">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
