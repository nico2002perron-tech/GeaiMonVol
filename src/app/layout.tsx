import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";


const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GeaiMonVol — Vols, Hôtels & Activités à Prix Cassés",
  description: "Vols, hôtels et activités aux meilleurs prix. Notre algorithme trouve ce que vous ne trouverez pas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
