import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@nextui-org/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers>
          <div className="relative flex flex-col h-screen items-center ">
            <Navbar />
            <main className="container w-full flex-grow overflow-x-hidden">
              {children}
            </main>
            <footer className="w-full flex items-center justify-center py-1">
              <Link
                className="flex items-center gap-1 text-current"
                href="/about"
                title="about"
              >
                <span className="text-default-600">made by the </span>
                <p className="text-primary">ucmmm team</p>
              </Link>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
