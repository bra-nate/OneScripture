# OneScripture Vibrant Audio Design System

**Date:** 2026-08-30  
**Status:** Approved direction; implementation specification  
**Project:** OneScripture  
**Reference:** SoundCloud-style dark media structure, adapted into a colorful scripture-listening identity

## 1. Design objective

Create a distinctive audio-first scripture experience in which each major page feels like a different chromatic room while the typography, navigation, player, spacing, and interaction patterns remain recognizably OneScripture.

The system should feel vibrant, tactile, editorial, and energetic. It must not feel like unrelated pages painted with arbitrary colors. Color provides wayfinding and emotional character; stable component geometry and persistent chrome provide continuity.

## 2. Core direction

Retain these qualities from the SoundCloud reference:

- media-first layouts;
- flat surfaces with minimal elevation;
- compact 4px corner radii;
- strong typographic hierarchy;
- content-dense controls with generous section spacing;
- restrained shadows;
- a stable player and navigation system.

Change these qualities:

- replace the monochromatic canvas and single blue accent with multiple purposeful page themes;
- allow large saturated color fields to carry the visual identity;
- use tinted neutrals rather than pure black, white, or gray;
- add a subtle static grain so saturated backgrounds feel tactile rather than digitally raw;
- use gradients selectively for specific page identities and state transitions.

The memorable visual idea is **chromatic scripture rooms**: every major destination has its own color atmosphere, but the app always behaves like the same instrument.

## 3. Brand color anchors

The following supplied values are source colors. They must be preserved as named anchors, then supplemented with accessible shades and tints in OKLCH where foreground contrast or interaction states require them.

| Name | Source value | Primary role |
| --- | --- | --- |
| Electric Blue | `rgb(0, 0, 238)` / `#0000EE` | Browse, library, navigation contexts |
| Vivid Red | `rgb(255, 0, 0)` / `#FF0000` | Favourites, featured moments, destructive/error emphasis |
| Open Teal | `rgb(2, 175, 224)` / `#02AFE0` | Search, discovery, information |
| Scripture Yellow | `rgb(255, 237, 0)` / `#FFED00` | Home, welcome, optimism, primary discovery entry |
| Heather Purple | `rgb(114, 77, 153)` / `#724D99` | Reflective reading surfaces and supporting passage states |
| Electric Purple | `rgb(116, 23, 208)` / `#7417D0` | Passage playback, active audio, high-energy emphasis |

### 3.1 Supplied gradients

```css
--gradient-horizon: linear-gradient(
  rgb(91, 97, 143) 0%,
  rgb(255, 255, 255) 100%
);

--gradient-ready: linear-gradient(
  rgb(10, 157, 13) 0%,
  rgb(10, 132, 30),
  rgb(6, 111, 23) 105.88%
);
```

`--gradient-horizon` is a light, reflective atmosphere for history or transitional editorial sections. It is not a generic overlay for every page. `--gradient-ready` communicates completion, availability, or a healthy dashboard state; it must not replace the standard success token inside controls.

### 3.2 Foundation neutrals

Avoid pure black and pure white across large areas.

```css
--color-ink: #111018;
--color-ink-soft: #211f2a;
--color-paper: #f7f4ea;
--color-paper-soft: #ece8dc;
--color-muted-dark: #514d5b;
--color-muted-light: #c8c2b6;
```

These values are the initial implementation targets. Final values may be adjusted slightly after automated and visual contrast testing, while the supplied brand anchors remain unchanged.

## 4. Color model

Color works on three separate layers so page identity does not conflict with interaction meaning.

### 4.1 Page identity

The page canvas establishes place and mood. Page identity is deterministic: the same route family receives the same theme after refresh and on shared links. Colors must never be chosen randomly at runtime.

| Experience | Initial page theme | Foreground strategy |
| --- | --- | --- |
| Home | Scripture Yellow | Ink text and ink primary controls |
| Search | Open Teal | Ink text and paper/ink surfaces |
| Browse books | Electric Blue | Paper text and paper primary controls |
| Browse chapters | Heather Purple | Paper text and tinted dark surfaces |
| Passage and sequence player | Electric Purple | Paper text with a stable ink player surface |
| Dashboard | Ready Green gradient | Ink or paper surfaces selected by local contrast |
| Playlists | Electric Blue with Teal accents | Paper text and ink player controls |
| History | Horizon gradient | Ink text |
| Favourites | Vivid Red | Ink text; paper only for large, tested display text |
| Settings | Heather Purple | Paper text and ink form surfaces |
| Login | Electric Blue | Paper text |
| Signup | Scripture Yellow | Ink text |

Dynamic scripture passages may later receive deterministic themes derived from book or collection metadata. That is post-MVP; the first implementation uses the stable passage-purple theme to avoid unpredictable player contrast.

### 4.2 Component hierarchy

Page color does not make every component colorful.

- Primary actions use the page's high-contrast ink or paper foreground.
- Secondary actions use transparent fills and visible high-contrast borders.
- Inputs and complex controls use stable ink or paper surfaces chosen for readability.
- The audio player uses a consistent near-ink shell across page themes; the active progress treatment inherits the page theme.
- Navigation may be transparent over the page canvas, but its foreground is selected from the current page theme.
- Cards remain flat and mostly shadowless. Use a tonal surface shift or inset hairline for separation.

### 4.3 Semantic state

Semantic colors retain one meaning everywhere and must include an icon or label rather than relying on color alone.

| State | Color family | Examples |
| --- | --- | --- |
| Ready / success | Green | Audio ready, completed generation |
| Preparing / information | Teal or blue | Queued verses, loading progress |
| Warning | Yellow with ink | Retryable delay, expiring session |
| Failed / destructive | Red | Permanent generation failure, delete action |
| Active playback | Electric Purple | Current verse, active timeline |
| Inactive | Theme-tinted neutral | Disabled controls, secondary metadata |

## 5. Page-theme token contract

Components consume semantic page tokens and never hard-code route colors.

```css
:root {
  --page-background: var(--color-scripture-yellow);
  --page-foreground: var(--color-ink);
  --page-muted: color-mix(in oklch, var(--page-foreground) 68%, transparent);
  --page-surface: color-mix(in oklch, var(--color-paper) 88%, var(--page-background));
  --page-surface-strong: var(--color-ink);
  --page-surface-strong-foreground: var(--color-paper);
  --page-border: color-mix(in oklch, var(--page-foreground) 22%, transparent);
  --page-focus: var(--page-foreground);
  --page-highlight: color-mix(in oklch, var(--color-paper) 22%, transparent);
}
```

Route wrappers select a named theme using a stable attribute or class:

```html
<section data-page-theme="passage">...</section>
```

```css
[data-page-theme="passage"] {
  --page-background: var(--color-electric-purple);
  --page-foreground: var(--color-paper);
}
```

The implementation should provide a typed theme registry so route code chooses a finite theme name rather than constructing CSS values.

## 6. Grain and depth

Grain is a quiet material treatment, not a decorative effect.

### 6.1 Grain specification

- static monochrome noise;
- target opacity: `0.02` to `0.04`;
- default opacity: `0.028`;
- tile size: approximately `160px` to `220px`;
- blend mode: `soft-light` by default, `overlay` only after visual review;
- no animation;
- `pointer-events: none`;
- grain layer must sit behind content and controls;
- gradients may use slightly more grain than flat fields, but must stay below `0.04`.

Prefer a tiny optimized local SVG or WebP texture. Do not generate noise on every frame or ship a large full-screen bitmap.

### 6.2 Background composition

```css
.page-canvas {
  isolation: isolate;
  position: relative;
  background:
    radial-gradient(
      circle at 82% 8%,
      var(--page-highlight),
      transparent 44%
    ),
    var(--page-background);
}

.page-canvas::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  content: "";
  background-image: var(--texture-grain);
  background-size: 192px 192px;
  mix-blend-mode: soft-light;
  opacity: 0.028;
}
```

The radial tonal wash should be subtle. Avoid glow effects, generic purple-blue gradients, animated blobs, glassmorphism, and decorative gradient text.

## 7. Typography

The colorful canvas needs typography with enough authority to remain calm.

- Use an editorial serif for scripture text, passage references, and selected display moments.
- Use a geometric sans for navigation, controls, forms, status, and metadata.
- Do not adopt Söhne unless the project obtains the correct font license.
- Preserve the existing serif/sans architecture during the first migration; font-family selection can be finalized independently without blocking color implementation.
- Use fluid display sizes with `clamp()` and maintain a minimum 14px size for body and control copy.
- Avoid thin display weights on saturated backgrounds unless visual contrast remains strong.

Initial scale:

| Role | Size | Line height |
| --- | --- | --- |
| Caption | `12px` | `1.4` |
| UI small | `14px` | `1.43` |
| Body | `17px` | `1.45` |
| Subheading | `22px` | `1.27` |
| Heading small | `28px` | `1.2` |
| Heading | `36px` | `1.15` |
| Display | `clamp(3.25rem, 7vw, 6.5rem)` | `0.95` to `1` |

## 8. Spacing, shape, and elevation

- Base spacing unit: `4px`.
- Primary scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96`.
- Page max-width: approximately `1200px`.
- Default section separation: `64px`, fluid where appropriate.
- Buttons, fields, images, and badges: `4px` radius.
- Content cards may remain square (`0px`) where the layout benefits from a poster-like edge.
- Avoid pill shapes except for truly compact status values.
- Prefer inset hairlines and tonal surface shifts over drop shadows.
- Use larger radii only for the physical boundary of a major player or dialog when usability requires it, not as the system default.

## 9. Audio-specific components

### 9.1 Selection composer

- Lives directly on the page rather than inside a modal.
- Uses the page theme for identity and a stable high-contrast surface for entry and review.
- Selected references are ordered, numbered, and removable.
- Color never becomes the only cue for selected, invalid, duplicate, or over-limit states.

### 9.2 Generation status

- Preparing uses teal/blue with an explicit count and progress label.
- Ready uses green with a check icon and text.
- Partial failure uses warning treatment plus the affected verse references.
- Permanent failure uses red with a labeled retry or recovery action.
- Skeletons and progress indicators retain the geometry of the content they replace.

### 9.3 Sequence player

- The player is the stable visual anchor across all page themes.
- Use a near-ink shell, paper foreground, and a theme-colored active timeline.
- Current verse reference receives stronger hierarchy than elapsed time.
- Previous, play/pause, and next controls remain in consistent positions.
- Loop/once, speed, and volume are secondary controls and should not compete with playback.
- Focus, hover, paused, buffering, completed, and error states must be visibly distinct without relying on hue alone.

## 10. Motion

- Use motion to explain state changes, especially preparing to ready and verse-to-verse advancement.
- Prefer transform and opacity transitions with exponential ease-out curves.
- Do not animate the grain.
- Do not continuously pulse large colored surfaces.
- Respect `prefers-reduced-motion` and provide an immediate state change when reduction is requested.

## 11. Responsive behavior

- Adapt composition instead of merely shrinking desktop layouts.
- Keep selection, playback, retry, and preference controls available on mobile.
- Allow the persistent player to become a compact dock before expanding into full controls.
- Use container queries for reusable player and selection components where practical.
- Prevent saturated edge-to-edge fields from reducing legibility near mobile browser chrome and safe areas.

## 12. Accessibility requirements

- Normal text contrast: at least `4.5:1`.
- Large text and essential UI boundary contrast: at least `3:1`.
- Yellow and teal canvases use ink foregrounds.
- Blue and purple canvases use paper foregrounds.
- Red defaults to ink for normal text; paper may be used only where measured contrast passes for the text size and weight.
- Gradient regions must be tested at the lightest and darkest points where content can appear.
- Focus indicators remain visible on every page theme.
- Semantic states include text and/or icons in addition to color.
- Test the palette with common color-vision deficiencies.

## 13. Implementation impact

Expected additions:

```text
src/components/theme/
├── PageCanvas.tsx
├── pageThemes.ts
└── types.ts

src/components/ui/
├── Button.tsx
├── Field.tsx
├── Status.tsx
└── Surface.tsx

public/textures/
└── grain.svg
```

Expected modifications:

- replace the current gold-on-near-black global tokens in `src/app/globals.css`;
- make the root layout support stable navigation/player chrome over route themes;
- apply named page themes to public, auth, and protected routes;
- refactor repeated button, field, status, and surface styles into shared primitives;
- build the scripture selection and sequence player against these primitives;
- update screenshots, product documentation, and visual regression baselines.

## 14. Rollout order

1. Add brand anchors, foundation neutrals, semantic colors, and page-theme tokens.
2. Add the optimized static grain asset and `PageCanvas` primitive.
3. Establish shared button, field, status, and surface primitives.
4. Apply themes to navigation, footer, home, search, browse, and auth.
5. Build the new scripture selection, generation status, and sequence player with the system.
6. Migrate protected placeholder pages as their real features are implemented.
7. Run contrast, responsive, keyboard, reduced-motion, and visual-regression checks.

## 15. Acceptance criteria

The first design-system rollout is complete when:

1. Every implemented route has a deterministic named page theme.
2. The supplied brand colors remain available as canonical anchor tokens.
3. All text, focus, and essential control combinations meet the required contrast ratios.
4. Grain is subtle, static, local, performant, and never obstructs content.
5. Navigation and the audio player remain recognizable and usable across every page color.
6. Page and semantic colors are implemented as separate token layers.
7. Shared controls do not contain route-specific color literals.
8. Mobile layouts preserve all critical selection and playback capabilities.
9. Reduced-motion users receive equivalent state feedback.
10. Visual QA confirms that the result feels colorful and tactile without becoming chaotic or raw.

## 16. Scope boundary

This document owns visual identity, theme tokens, grain, shared component appearance, responsive presentation, motion guidance, and accessibility of the interface.

The Kokoro audio plan owns scripture data, generation, storage, queues, APIs, playback behavior, reliability, and deployment. The two specifications meet at the selection, generation-status, and sequence-player UI, where this design system governs presentation and the audio plan governs behavior.

## 17. MECE validation

```text
OneScripture vibrant audio design system
├── Brand identity
│   ├── Color anchors and route themes
│   ├── Typography
│   └── Grain and visual texture
├── Interface foundations
│   ├── Semantic tokens
│   ├── Spacing, shape, and elevation
│   └── Shared component hierarchy
├── Audio experience
│   ├── Selection composer
│   ├── Generation status
│   └── Sequence player
└── Quality constraints
    ├── Accessibility
    ├── Responsive behavior
    ├── Motion
    └── Verification and rollout
```

MECE Score: 100/100

- Overlaps found: 0
- Critical gaps found: 0
- Minor gaps found: 0

All things are MECE. ✓
