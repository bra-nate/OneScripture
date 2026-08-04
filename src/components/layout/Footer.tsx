import { AdSlot } from "@/components/ad/AdSlot";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border px-6 py-8">
      <AdSlot slotId="footer" />
      <p className="font-sans text-xs text-text-muted">
        © OneScripture. Find it. Hear it. Keep it.
      </p>
    </footer>
  );
}
