import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ボポ打 | BOPO TYPING",
  description: "台湾の注音符号（ボポモフォ）をマスターするためのタイピング練習ゲーム。",
  openGraph: {
    title: "ボポ打 | BOPO TYPING",
    description: "台湾の注音符号（ボポモフォ）をマスターしよう",
    url: "https://bopomo-typing.vercel.app", 
    siteName: "ボポ打",
    images: [
      {
        url: "/opengraph-image.png", // app直下に置くとNext.jsが自動認識します
        width: 1200,
        height: 630,
        alt: "ボポ打 | BOPO TYPING",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ボポ打 | BOPO TYPING",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}