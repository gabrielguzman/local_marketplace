import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { VerifyBanner } from "@/components/verify-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: "Mercato — comprá y vendé en tiendas de tu zona",
    template: "%s | Mercato",
  },
  description:
    "El marketplace de los negocios de tu zona. Comprá directo, vendé fácil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Saltar al contenido
        </a>
        <div className="print:hidden">
          <Header />
          <VerifyBanner />
        </div>
        <main
          id="contenido"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:max-w-none print:px-0 print:py-0"
        >
          {children}
        </main>
        <div className="print:hidden">
          <Footer />
        </div>
      </body>
    </html>
  );
}
