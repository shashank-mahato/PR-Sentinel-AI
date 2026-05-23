import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PR Sentinel AI",
  description: "AI code reviews before bugs reach production."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
