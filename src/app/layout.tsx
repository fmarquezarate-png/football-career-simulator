import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Football Career Simulator",
  description:
    "El simulador de carrera de fútbol más completo: elige tu club, toma decisiones, gana Balones de Oro y compárate con tus amigos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${inter.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
