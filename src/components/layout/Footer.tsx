import { AdSlot } from "@/components/ad/AdSlot";
import { APP_CONFIG } from "@/config/app";

export function Footer() {
  return (
    <footer className="mt-20 bg-[var(--color-sunshine-pop)] px-6 py-12 text-[var(--color-ink)] md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="font-display text-4xl font-medium tracking-[-0.055em] md:text-6xl">
            Find it. Hear it. Keep it.
          </p>
          <p className="mt-3 max-w-xl font-sans text-sm leading-6">
            Scripture, ready for the moment you need it.
          </p>
        </div>
        <div>
          <AdSlot slotId="footer" />
          <p className="font-sans text-xs">© {APP_CONFIG.NAME}.</p>
        </div>
      </div>
    </footer>
  );
}
