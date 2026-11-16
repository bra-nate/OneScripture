import Image from "next/image";

import { classNames } from "@/components/ui/classNames";
import { APP_CONFIG } from "@/config/app";

export interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <Image
      alt={APP_CONFIG.NAME}
      className={classNames("wordmark", className)}
      height={184}
      src="/brand/oneword-wordmark.svg"
      width={923}
    />
  );
}
