import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SSEProvider } from "@/components/layout/SSEProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HeartMuLa Studio",
  description: "AI Music Generation Studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SSEProvider>
          <AppShell>
            {children}
          </AppShell>
        </SSEProvider>
        <Toaster />
      </body>
    </html>
  );
}
