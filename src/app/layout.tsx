import { PropsWithChildren } from "react";
import { JsonLd } from "react-schemaorg";

import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";

import { GoogleAnalytics } from "@next/third-parties/google";

import { AppBackground } from "@/components/AppBackground";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BASE_URL } from "@/constants";
import {
  buildPersonSchema,
  buildSiteNavigationSchema,
  buildWebsiteSchema,
} from "@/lib/seo";

import "./globals.css";

const title = "Alex Leung | Software Engineer and Occasional Writer";
const description =
  "Alex Leung is a San Francisco-based software engineer writing notes on software systems, AI tools, and small experiments from his own projects.";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "900"],
  display: "swap",
});

const googleAnalyticsId =
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true"
    ? "G-KJXZVT8X1E"
    : undefined;

export const metadata: Metadata = {
  title: title,
  description: description,
  authors: [{ name: "Alex Leung" }],
  creator: "Alex Leung",
  publisher: "Alex Leung",
  robots: "index, follow",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        {
          url: "/feed.xml",
          title: "Alex Leung Blog RSS Feed",
        },
      ],
    },
  },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: BASE_URL,
    siteName: "Alex Leung",
    locale: "en_CA",
    images: [
      {
        url: "/assets/alex_vibing.webp",
        width: 1536,
        height: 1024,
        alt: "Portrait of Alex Leung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: title,
    description: description,
    images: [
      {
        url: "/assets/alex_vibing.webp",
        alt: "Portrait of Alex Leung",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Alex Leung",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className={`${lato.className} flex min-h-screen flex-col`}>
        <AppBackground />
        <Header />
        <main className="flex grow flex-col">{children}</main>
        <Footer />
        <JsonLd item={buildPersonSchema({ description })} />
        <JsonLd item={buildWebsiteSchema({ description })} />
        <JsonLd item={buildSiteNavigationSchema()} />
      </body>
      {googleAnalyticsId ? <GoogleAnalytics gaId={googleAnalyticsId} /> : null}
    </html>
  );
}
