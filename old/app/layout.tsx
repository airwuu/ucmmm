import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import * as React from "react";
import {NextUIProvider} from "@nextui-org/react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ucmmm",
  description: "the better menu website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextUIProvider>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#161621] w-full`}
      >
          {children}
      </body>
    </html>
    </NextUIProvider>
  );
}