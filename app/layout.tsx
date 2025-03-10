import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import 'katex/dist/katex.min.css';
import './katex-styles.css';

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "DeepSeek AI Chat",
  description: "An intelligent AI assistant powered by DeepSeek",
  keywords: ["AI", "chatbot", "DeepSeek", "artificial intelligence", "machine learning"],
  authors: [{ name: "DeepSeek AI" }],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
