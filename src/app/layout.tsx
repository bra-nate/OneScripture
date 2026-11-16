import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { PageCanvas } from "@/components/theme/PageCanvas";
import { APP_CONFIG } from "@/config/app";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  applicationName: APP_CONFIG.NAME,
  title: {
    default: APP_CONFIG.NAME,
    template: `%s · ${APP_CONFIG.NAME}`,
  },
  description: "Find it. Hear it. Keep it.",
};

export const viewport: Viewport = {
  themeColor: [
    { color: "#f5f1e4", media: "(prefers-color-scheme: light)" },
    { color: "#151713", media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){var t;try{t=localStorage.getItem("onescripture-theme")}catch(e){}if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#151713":"#f5f1e4")})()`}
        </Script>
      </head>
      <body>
        <PageCanvas>
          <a
            className="sr-only rounded-control bg-surface-strong px-4 py-2 font-sans text-sm font-semibold text-surface-strong-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
            href="#main-content"
          >
            Skip to content
          </a>
          <Nav />
          <main className="flex flex-1 flex-col" id="main-content">
            {children}
          </main>
          <Footer />
        </PageCanvas>
      </body>
    </html>
  );
}
