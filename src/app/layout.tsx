import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
  title: {
    default: APP_CONFIG.NAME,
    template: `%s · ${APP_CONFIG.NAME}`,
  },
  description: "Find it. Hear it. Keep it.",
};

export const viewport: Viewport = {
  // Matches the body ground the page canvas sits on, so mobile browser chrome
  // does not clash with the full-bleed route themes.
  themeColor: "#f5f1e4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
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
