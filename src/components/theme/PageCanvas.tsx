"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { getPageTheme } from "@/components/theme/pageThemes";

interface PageCanvasProps {
  children: ReactNode;
}

export function PageCanvas({ children }: PageCanvasProps) {
  const pathname = usePathname();
  const theme = getPageTheme(pathname);

  return (
    <div className="page-canvas" data-page-theme={theme}>
      {children}
    </div>
  );
}
