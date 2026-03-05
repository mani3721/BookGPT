import type { Metadata } from "next";
import { IBM_Plex_Serif, Mona_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

import Navbar from "@/components/Navbar";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BookGPT - TNPC & Exam Prep AI Study Assistant",
    template: "%s | BookGPT",
  },
  description:
    "AI-powered study assistant for TNPC, TNPSC, and government exam preparation. Transform your books into interactive AI conversations. Chat with PDFs, get summaries, and ace your exams.",
  keywords: [
    "BookGPT",
    "TNPC",
    "TNPSC",
    "Tamil Nadu exam",
    "government exam preparation",
    "exam prep",
    "AI study assistant",
    "PDF chat",
    "book summary",
    "competitive exam",
    "UPSC",
    "study with AI",
    "voice chat",
    "reading assistant",
  ],
  authors: [{ name: "BookGPT" }],
  creator: "BookGPT",
  category: "Education",
  openGraph: {
    type: "website",
    siteName: "BookGPT",
    title: "BookGPT - TNPC & Exam Prep AI Study Assistant",
    description:
      "AI-powered study assistant for TNPC, TNPSC, and government exam preparation. Chat with your books, get summaries, and ace your exams.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookGPT - TNPC & Exam Prep AI Study Assistant",
    description:
      "AI-powered study assistant for TNPC, TNPSC, and government exam preparation. Chat with your books, get summaries, and ace your exams.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "hOlZTLKR1HSqaTqYckFvxMfTbJKny-7fBxfOICAfrbU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${ibmPlexSerif.variable} ${monaSans.variable} relative font-sans antialiased`}
        >
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-11ENTQSETP"
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-11ENTQSETP');
            `}
          </Script>
          <Navbar />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
