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
  title: "注音打 | BOPOMO TYPING - 台湾の注音符号タイピングゲーム",
  description: "台湾の注音符号（ボポモフォ）をマスターするためのタイピング練習ゲームです。",
  icons: {
    icon: [
      { url: "/favicon.ico?v=1" },
      { url: "/favicon.webp?v=1", type: "image/webp" },
    ],
    apple: [
      { url: "/apple-icon.png?v=1", type: "image/png" },
    ],
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