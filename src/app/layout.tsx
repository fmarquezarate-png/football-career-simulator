import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Football Career Simulator",
    template: "%s · Football Career Simulator",
  },
  description:
    "Crea tu futbolista, toma las decisiones que definen una carrera y llega de canterano a leyenda mundial. Goles, títulos y Balones de Oro simulados con probabilidad real.",
  applicationName: "Football Career Simulator",
  openGraph: {
    title: "Football Career Simulator",
    description: "De canterano a leyenda mundial. Simulador de carrera futbolística.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${inter.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
