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
  title: "Indian Cookbook for Students — Easy, Fast, Budget Indian Recipes",
  description:
    "Clutter-free Indian recipe app built for hostel and college students. Instant search, filters by cookware, time, diet, and budget, plus Cook Mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-neutral-950 selection:bg-orange-100 selection:text-orange-900`}
      >
        {children}
      </body>
    </html>
  );
}
