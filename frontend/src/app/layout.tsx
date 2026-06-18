import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evalfuture. Property Evaluation Model",
  description: "Interactive property evaluation model with XLSX export."
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
