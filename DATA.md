# DATA.md — OneScripture

> **Legacy v1 reference:** This document describes the earlier Bible.is and
> download-oriented data model. For the active Kokoro rebuild, use `PHASE.md`,
> `docs/superpowers/plans/2026-08-30-self-hosted-kokoro-verse-audio-mvp.md`, and
> the numbered migrations in `supabase/migrations/`. Do not extend the Bible.is
> contracts below for new Phase 2+ work.

## Overview

This document defines the database schema, API data contracts, and data flow for OneScripture v1.

---

## Database — Supabase (PostgreSQL)

### Table: `profiles`
Extended user data linked to Supabase Auth `auth.users`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | FK → `auth.users.id` |
| `display_name` | `text` | Optional |
| `default_translation` | `text` | e.g. `"ESV"` — defaults to `"KJV"` |
| `default_language` | `text` | e.g. `"en"`, `"tw"` (Twi) |
| `created_at` | `timestamptz` | Auto |

---

### Table: `playlists`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `name` | `text` | User-defined playlist name |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto |

---

### Table: `playlist_items`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `playlist_id` | `uuid` | FK → `playlists.id` |
| `book_id` | `text` | Bible.is book ID (e.g. `"JHN"`) |
| `chapter` | `integer` | Chapter number |
| `verse_start` | `integer` | Nullable (null = full chapter) |
| `verse_end` | `integer` | Nullable |
| `translation_id` | `text` | Bible.is DAM ID |
| `display_ref` | `text` | e.g. `"John 3:16–17 · ESV"` |
| `order` | `integer` | Sort order within playlist |
| `created_at` | `timestamptz` | Auto |

---

### Table: `downloads`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` (nullable for anonymous) |
| `book_id` | `text` | Bible.is book ID |
| `chapter` | `integer` | Chapter number |
| `verse_start` | `integer` | Nullable |
| `verse_end` | `integer` | Nullable |
| `translation_id` | `text` | Bible.is DAM ID |
| `display_ref` | `text` | Human-readable reference |
| `downloaded_at` | `timestamptz` | Auto |

---

### Table: `favourites`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `book_id` | `text` | Bible.is book ID |
| `chapter` | `integer` | Chapter number |
| `verse_start` | `integer` | Nullable |
| `verse_end` | `integer` | Nullable |
| `translation_id` | `text` | Bible.is DAM ID |
| `display_ref` | `text` | Human-readable reference |
| `created_at` | `timestamptz` | Auto |

**Unique constraint:** `(user_id, book_id, chapter, verse_start, verse_end, translation_id)`

---

## RLS Policies (Row Level Security)

All tables are protected. Apply the following policies in Supabase:

| Table | Policy | Rule |
|---|---|---|
| `profiles` | Select own | `auth.uid() = id` |
| `profiles` | Update own | `auth.uid() = id` |
| `playlists` | All ops | `auth.uid() = user_id` |
| `playlist_items` | All ops | Via playlist ownership join |
| `downloads` | Select own | `auth.uid() = user_id` |
| `downloads` | Insert | `auth.uid() = user_id` |
| `favourites` | All ops | `auth.uid() = user_id` |

---

## Bible.is API — DBP4

**Base URL:** `https://4.dbt.io/api/`  
**Auth:** API key via `key` query param or `Authorization` header  
**Docs:** https://www.digitalbibleplatform.com/docs/

### Key Endpoints

#### List Bible Filesets (Translations)
```
GET /bibles?language_code=eng&media=audio
```
Returns available audio Bibles for a language. Use to populate the translation selector.

**Response shape (simplified):**
```json
{
  "data": [
    {
      "abbr": "ENGESV",
      "name": "English Standard Version",
      "language": "English",
      "filesets": {
        "dbp-prod": [
          { "id": "ENGESVN2DA", "type": "audio_drama" },
          { "id": "ENGESVN1DA", "type": "audio" }
        ]
      }
    }
  ]
}
```

#### List Books for a Bible
```
GET /bibles/books?bible_id=ENGESV
```

**Response shape:**
```json
{
  "data": [
    {
      "book_id": "GEN",
      "name": "Genesis",
      "chapters": 50,
      "testament": "OT"
    }
  ]
}
```

#### Get Audio for a Chapter
```
GET /bibles/filesets/{fileset_id}/{book_id}/{chapter}
```
Example: `GET /bibles/filesets/ENGESVN2DA/JHN/3`

**Response shape:**
```json
{
  "data": [
    {
      "book_id": "JHN",
      "book_name": "John",
      "chapter_start": 3,
      "verse_start": 1,
      "verse_end": 36,
      "timestamp": 0.0,
      "path": "https://cdn.dbt.io/audio/ENGESVN2DA/JHN/B01___03_John________ENGESVN2DA.mp3"
    }
  ]
}
```

The `path` field is the direct MP3 URL. This is the URL used for inline playback and download.

---

## Translation ID Map (Confirm at Integration)

| Translation | Language | Expected DAM ID | Type |
|---|---|---|---|
| KJV | English | `ENGKJV` | audio |
| NIV | English | `ENGNIV` | Confirm — may require licensing |
| ESV | English | `ENGESV` | audio_drama available |
| Twi (Asante) | Twi | Confirm via API | Confirm availability |
| Ga | Ga | Confirm via API | Confirm availability |

**Action required:** Query `GET /bibles?language_code=tw` and `GET /bibles?language_code=gaa` to confirm fileset availability before build.

---

## App Config — Feature Flags

Stored in `/src/config/app.ts`:

```typescript
export const APP_CONFIG = {
  ADS_ENABLED: false,
  DEFAULT_TRANSLATION: 'ENGESV',
  DEFAULT_LANGUAGE: 'en',
  MAX_PLAYLIST_ITEMS: 50,
  DOWNLOAD_HISTORY_LIMIT: 100,
} as const;
```

---

## Data Flow — Audio Download

1. User selects passage and clicks Download
2. App fetches audio URL from Bible.is API (or uses cached URL from player)
3. Download interstitial screen shown (S06)
4. On confirm, browser fetches MP3 via proxy route (`/api/download`) to avoid CORS issues
5. File served to browser with `Content-Disposition: attachment; filename="John-3-16-ESV.mp3"`
6. Download logged to `downloads` table (if user is authenticated)

**Proxy route is required** — direct browser download of Bible.is CDN URLs may be blocked by CORS or require auth headers.
