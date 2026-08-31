import { bibleClient } from "@/lib/bible/client";

/**
 * Bible.is availability spike.
 *
 * For each target language, lists the audio Bibles + fileset IDs and attempts
 * to resolve a chapter audio path (John 3). The output is the raw material for
 * Slice 1's confirmed translation map — which of KJV / NIV / ESV / Twi / Ga the
 * API actually serves, and their real fileset IDs.
 *
 * Run once BIBLE_IS_API_KEY is set in .env.local:
 *   npm run spike
 */

const LANGS = ["eng", "tw", "gaa"];

async function main() {
  for (const lang of LANGS) {
    console.log(`\n=== ${lang} ===`);
    try {
      const bibles = await bibleClient.listBibles(lang);
      if (bibles.length === 0) {
        console.log("  (no audio Bibles returned)");
        continue;
      }
      for (const b of bibles) {
        const filesets = Object.values(b.filesets ?? {}).flat();
        const filesetList = filesets
          .map((f) => `${f.id}(${f.type})`)
          .join(", ");
        console.log(`${b.abbr} — ${b.name} — filesets: ${filesetList}`);

        const audio = filesets.find((f) => f.type?.startsWith("audio"));
        if (!audio) {
          console.log("  ↳ no audio fileset");
          continue;
        }
        try {
          const chapters = await bibleClient.getChapterAudio(audio.id, "JHN", 3);
          console.log(`  ↳ JHN 3 path: ${chapters[0]?.path ?? "NONE"}`);
        } catch (e) {
          console.log(`  ↳ JHN 3 error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      console.log(`listBibles error: ${(e as Error).message}`);
    }
  }
}

main();
