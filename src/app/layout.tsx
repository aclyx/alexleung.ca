import { PropsWithChildren } from "react";
import { JsonLd } from "react-schemaorg";

import type { Metadata, Viewport } from "next";

import { GoogleAnalytics } from "@next/third-parties/google";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SiteLinkAnalytics } from "@/components/SiteLinkAnalytics";
import { BASE_URL } from "@/constants";
import {
  buildPersonSchema,
  buildSiteNavigationSchema,
  buildWebsiteSchema,
} from "@/lib/seo";

import "./globals.css";

const title = "Alex Leung | Software Engineer and Writer";
const description =
  "Alex Leung's personal website, with experience and writing about software, AI tools, books, and life outside work.";

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
  metadataBase: new URL(BASE_URL),
  alternates: {
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
        alt: "Alex Leung in an art studio",
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
        alt: "Alex Leung in an art studio",
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
  themeColor: "#f4f1e9",
  colorScheme: "light",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="flex grow flex-col">{children}</main>
        <Footer />
        <SiteLinkAnalytics />
        <JsonLd item={buildPersonSchema()} />
        <JsonLd item={buildWebsiteSchema({ description })} />
        <JsonLd item={buildSiteNavigationSchema()} />
        {googleAnalyticsId ? (
          <GoogleAnalytics gaId={googleAnalyticsId} />
        ) : null}
      </body>
    </html>
  );
}
