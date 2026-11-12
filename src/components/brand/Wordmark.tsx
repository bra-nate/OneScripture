import Image from "next/image";

import { APP_CONFIG } from "@/config/app";

export interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <Image
      alt={APP_CONFIG.NAME}
      className={className}
      height={184}
      src="/brand/oneword-wordmark.svg"
      width={923}
    />
  );
}
