import type { Metadata } from "next";
import { Inter_Tight, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display family — Inter Tight, used everywhere.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Editorial serif — kept available for legacy pages, no longer the body default.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// Numerical — tabular figures for prices, percentages, tickers.
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://project-m2.alexisoscaretlik.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Invest Coach · Le coaching d'investissement pour les épargnants français",
    template: "%s — Invest Coach",
  },
  description:
    "Coaching d'investissement pour épargnants français : PEA, assurance-vie, PER, fiscalité IR. La même méthode pour chaque empreinte fiscale. Économiser de l'impôt, c'est gagner de l'argent.",
  keywords: [
    "PEA",
    "assurance-vie",
    "PER",
    "fiscalité",
    "investissement France",
    "épargne",
    "ETF",
    "déclaration impôts",
    "TMI",
    "PFU",
    "coaching financier",
  ],
  authors: [{ name: "Invest Coach" }],
  creator: "Invest Coach",
  publisher: "Invest Coach",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Invest Coach",
    title: "Invest Coach · Le coaching d'investissement pour les épargnants français",
    description:
      "PEA, assurance-vie, PER, fiscalité IR : la même méthode pour chaque empreinte fiscale. Économiser de l'impôt, c'est gagner de l'argent.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Invest Coach — Économiser de l'impôt, c'est gagner de l'argent.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invest Coach · Coaching d'investissement français",
    description:
      "PEA, AV, PER, fiscalité IR. Économiser de l'impôt, c'est gagner de l'argent.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    email: false,
    telephone: false,
  },
};

// Every page talks to Supabase or Stripe at request time — nothing here
// is safe to prerender during build, and env vars may not be populated
// in the build shell. Force dynamic globally.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${interTight.variable} ${sourceSerif.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
