import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VerseAudioCache } from "@/components/player/verseAudioCache";

const item = (url: string) => ({ id: "1", position: 0, reference: "John 3:16", url });

describe("VerseAudioCache", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:local/1");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("keeps a verse across signed-URL refreshes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => new Blob(["mp3"]) })));
    const cache = new VerseAudioCache();
    const onChange = vi.fn();

    await cache.download([item("https://s.test/JHN/003/016.mp3?token=a")], 0, new AbortController().signal, onChange);
    await cache.download([item("https://s.test/JHN/003/016.mp3?token=b")], 0, new AbortController().signal, onChange);

    expect(fetch).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledOnce();
    expect(cache.sourceFor(item("https://s.test/JHN/003/016.mp3?token=c"))).toBe("blob:local/1");
    expect(cache.hasAll([item("https://s.test/JHN/003/016.mp3?token=d")])).toBe(true);
  });

  it("falls back to streaming when a download fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    const cache = new VerseAudioCache();
    const signed = item("https://s.test/JHN/003/016.mp3?token=a");

    expect(cache.sourceFor(signed)).toBeUndefined();
    await cache.download([signed], 0, new AbortController().signal, vi.fn());
    await cache.download([signed], 0, new AbortController().signal, vi.fn());

    expect(cache.sourceFor(signed)).toBe(signed.url);
    expect(cache.hasAll([signed])).toBe(false);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("downloads from the playing verse onward and releases memory on clear", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => new Blob(["mp3"]) })));
    const cache = new VerseAudioCache();
    const urls = ["https://s.test/1.mp3", "https://s.test/2.mp3", "https://s.test/3.mp3"];

    await cache.download(urls.map(item), 1, new AbortController().signal, vi.fn());
    cache.clear();

    expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([urls[1], urls[2], urls[0]]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(cache.sourceFor(item(urls[0]))).toBeUndefined();
  });
});
