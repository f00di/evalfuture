import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Evalfuture. | Rent vs Buy Property Comparison UAE",
    template: "%s"
  },
  description:
    "Compare renting, buying, financing, rental income, mortgage interest, service charges, and market movement with Evalfuture.",
  openGraph: {
    title: "Evalfuture. | Rent vs Buy Property Comparison UAE",
    description:
      "Compare renting, buying, financing, rental income, mortgage interest, service charges, and market movement with Evalfuture.",
    url: siteUrl,
    siteName: "Evalfuture.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
