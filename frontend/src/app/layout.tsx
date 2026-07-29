import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Evalfuture. | Rent vs Buy Property Comparison",
    template: "%s"
  },
  description:
    "Compare renting, buying, financing, rental income, mortgage interest, service charges, and market movement with Evalfuture.",
  openGraph: {
    title: "Evalfuture. | Rent vs Buy Property Comparison",
    description:
      "Compare renting, buying, financing, rental income, mortgage interest, service charges, and market movement with Evalfuture.",
    url: siteUrl,
    siteName: "Evalfuture.",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Evalfuture. | Rent vs Buy Property Comparison",
    description:
      "Compare renting, buying, financing, rental income, service charges, and market movement."
  },
  icons: {
    icon: "/evalfuture/favicon.svg"
  },
  robots: { index: true, follow: true },
  category: "finance"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Evalfuture.",
    url: `${siteUrl}/`,
    description:
      "Property comparison and financing evaluation for rent-vs-buy decisions."
  };

  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
