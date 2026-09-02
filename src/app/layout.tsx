import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { PageCanvas } from "@/components/theme/PageCanvas";

export const metadata: Metadata = {
  title: "OneScripture",
  description: "Find it. Hear it. Keep it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body>
        <PageCanvas>
          <Nav />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </PageCanvas>
      </body>
    </html>
  );
}
