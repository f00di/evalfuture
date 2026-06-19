import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evalfuture. Property Comparison and Financing Evaluation",
  description:
    "Rent-vs-buy property comparison, financing evaluation, and Excel comparison workflow."
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
