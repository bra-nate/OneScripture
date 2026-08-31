# Kokoro Phase 0 — Rights and technical proof

**Decision date:** 2026-08-30
**Status:** Complete — rights, technical proof, and both voices accepted
**Scope:** OneScripture self-hosted verse-audio MVP

This record is an engineering rights review, not legal advice. Recheck the pinned
source artifacts and licenses before production release.

## Selected scripture source

- **Translation:** World English Bible, updated 66-book protocanon (`engwebp`)
- **Publisher/source:** eBible.org
- **Text edition:** 2020 stable text edition
- **Spike snapshot:** source files dated 2026-08-26
- **Canonical source:** <https://ebible.org/engwebp/>
- **Rights statement:** <https://ebible.org/engwebp/copyright.htm>

The publisher dedicates the translation to the public domain and explicitly
permits copying, publishing, distribution, sale, public proclamation, broadcast,
Internet posting, reproduction, and other use. “World English Bible” remains an
eBible.org trademark: if OneScripture changes the text or punctuation, it must
not identify the changed text as the World English Bible.

| Capability | MVP decision | Basis / constraint |
| --- | --- | --- |
| Display text | Allowed | Public-domain text may be reproduced and posted online. |
| Generate narration | Allowed | Public proclamation, broadcast, reproduction, and unrestricted use are expressly permitted. |
| Stream generated audio | Allowed | Broadcast/transmission and Internet posting are expressly permitted. |
| Server/browser cache | Allowed | Copying and backup are expressly permitted. Signed URLs remain an application security decision. |
| Download generated audio | Allowed by source rights | The MVP still omits downloads as a product decision, not a scripture-rights restriction. |

Operational constraints:

- Import a pinned official eBible.org artifact and retain its hash and source date.
- Store the canonical text unchanged. Speech-only normalization must not overwrite it.
- Retain the translation name exactly only for faithful copies.
- Recheck the source snapshot before a future catalogue refresh.

## Selected model and voices

- **Model:** `hexgrad/Kokoro-82M`, v1.0
- **Pinned revision:** `f3ff3571791e39611d31c381e3a41a3af07b4987`
- **Model SHA-256:** `496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4`
- **Model repository:** <https://huggingface.co/hexgrad/Kokoro-82M>
- **Model license:** Apache License 2.0
- **Female voice:** `af_heart` (American English, grade A)
- **Female voice SHA-256:** `0ab5709b8ffab19bfd849cd11d98f75b60af7733253ad0d67b12382a102cb4ff`
- **Male voice:** `am_michael` (American English, grade C+)
- **Male voice SHA-256:** `9a443b79a4b22489a5b0ab7c651a0bcd1a30bef675c28333f06971abbd47bd37`
- **Voice listing:** <https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md>

The model repository is marked Apache-2.0 and contains both selected voice packs.
The upstream model card describes the model weights as Apache-licensed and
suitable for production deployment. The voice list assigns separate CC-BY
provenance where it applies to particular voices; it does not list a separate
attribution requirement for `af_heart` or `am_michael`. The MVP therefore accepts
both under the repository's Apache-2.0 license. Preserve the upstream Apache
license and notices with deployed model artifacts.

## Reproducible proof

Prerequisites:

- Python 3.10–3.12
- FFmpeg with `libmp3lame`
- Internet access on the first run to install Python packages and fetch the
  model and voice files

Run the four female-voice proof samples:

```sh
npm run kokoro:proof
```

Run the same four samples with the male voice:

```sh
npm run kokoro:proof:male
```

The command runs inference on CPU, keeps the source WAV for measurement, and
writes MP3 files plus `benchmark.json` under `artifacts/kokoro-phase0/`.

Pinned generation defaults:

| Setting | Value |
| --- | --- |
| Voices | `af_heart`, `am_michael` |
| Speed | `0.95` |
| WAV | mono PCM 16-bit, 24 kHz |
| MP3 | `libmp3lame`, mono, 24 kHz, constant 64 kbps |
| Loudness filter | `loudnorm=I=-18:LRA=7:TP=-1.5` |
| Inter-chunk pause | 180 ms |

The retained WAV files are only Phase 0 evidence. The production worker must
delete temporary WAV files after a successful MP3 upload.

## Benchmark result

The proof ran successfully on 2026-08-31 using CPU inference on an Apple Silicon
Mac (`arm64`, 10 logical CPUs, 8 Torch threads), Python 3.12.3, Torch 2.13.0,
and FFmpeg 8.1.2. Cold model initialization—including the first download—took
129.424 seconds; the verified warm-cache load took 5.895 seconds. Maximum
observed process RSS was 3,136.00 MB. All outputs decoded fully with FFmpeg and
probed as mono MP3, 24 kHz, 64 kbps. Post-encode EBU R128 measurements ranged
from -19.0 to -18.5 LUFS, which is close to the configured -18 LUFS target.

| Sample | Audio | Generation wall / CPU | Real-time factor | Peak RSS | WAV | MP3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| John 3:16 | 8.550 s | 1.236 / 3.284 s | 0.1446× | 1,797.39 MB | 410,444 B | 69,165 B |
| Psalm 23:1–6 | 38.025 s | 4.444 / 13.265 s | 0.1169× | 2,453.38 MB | 1,825,244 B | 304,941 B |
| Esther 8:9 | 27.300 s | 2.881 / 10.104 s | 0.1055× | 2,803.53 MB | 1,310,444 B | 219,117 B |
| 1 Chronicles 1:1–7 | 21.350 s | 2.421 / 8.194 s | 0.1134× | 3,136.00 MB | 1,024,844 B | 171,501 B |

These are development-machine measurements, not VPS capacity guarantees. Phase
1 should repeat the same CPU benchmark on the selected VPS before fixing worker
resource limits or throughput targets.

### Male voice benchmark

The `am_michael` proof used the same model, environment, synthesis settings,
and MP3 encoding. Its verified warm-cache load took 6.373 seconds; maximum
observed process RSS was 2,896.94 MB. All four MP3s decoded fully, with
post-encode EBU R128 measurements from -19.3 to -18.6 LUFS.

| Sample | Audio | Generation wall / CPU | Real-time factor | Peak RSS | WAV | MP3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| John 3:16 | 9.675 s | 1.547 / 4.058 s | 0.1599× | 1,764.31 MB | 464,444 B | 78,189 B |
| Psalm 23:1–6 | 43.425 s | 5.510 / 15.227 s | 0.1269× | 2,490.64 MB | 2,084,444 B | 348,141 B |
| Esther 8:9 | 30.225 s | 3.212 / 11.376 s | 0.1063× | 2,896.94 MB | 1,450,844 B | 242,541 B |
| 1 Chronicles 1:1–7 | 22.875 s | 2.532 / 8.870 s | 0.1107× | 2,896.94 MB | 1,098,044 B | 183,789 B |

## Required listening review

Listen to every generated MP3 using headphones and a phone speaker. Record
pass/fail and notes for pacing, pronunciation, glitches, clipping, and fatigue.

The female `af_heart` proof and male `am_michael` proof were accepted in user
feedback on 2026-08-31:

| Male sample | Purpose | Result | Notes |
| --- | --- | --- | --- |
| John 3:16 | Short, familiar verse | Pass | Male voice accepted. |
| Psalm 23:1–6 | Multi-verse passage and cadence | Pass | Male voice accepted. |
| Esther 8:9 | Long verse | Pass | Male voice accepted. |
| 1 Chronicles 1:1–7 | Difficult biblical names | Pass | Male voice accepted. |

Phase 0 is complete. The approved Phase 1 inputs are the WEB `engwebp` source,
Kokoro v1.0, `af_heart`, `am_michael`, and the recorded MP3 settings.
