# OneScripture Redesign Experiment

**Date:** 2026-09-03
**Branch:** `codex/redesign-experiment`

## Objective

Refine OneScripture into a more native, mature listening experience without changing its existing colors, page themes, grain texture, or core visual identity.

The experiment covers:

- A single native sans-serif typography system with no serif display face.
- Conventional, accessible audio-player iconography.
- A clearer hierarchy for playback and listening preferences.
- Selective liquid-glass enhancement for interface layers that float above content.

## Design principles

The SoundCloud reference in `design/` should be treated as a source of interaction and systems lessons rather than a theme to reproduce. OneScripture will retain its expressive palette and scripture-led identity while borrowing the reference's disciplined spacing, restrained chrome, flat components, and content-first hierarchy.

Liquid glass should represent a layer floating above content. It should not become the default treatment for ordinary document content or every interactive element.

## 1. Native typography

Remove Georgia and the serif display role. Use one system sans-serif family for interface text, headings, scripture references, and branding:

```css
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
Roboto,
Helvetica,
Arial,
sans-serif
```

This resolves to SF Pro on Apple platforms, Segoe UI on Windows, and the relevant native sans-serif on other platforms without distributing proprietary font files.

Replace presentation-oriented font names such as `font-display` with semantic typography roles:

- Display/page title
- Section heading
- Scripture reference
- Body
- Control label
- Caption/metadata

Create hierarchy through size, weight, line height, spacing, and contrast. Use regular weight for scripture and extended reading, medium or semibold for headings, and semibold for controls. Reserve uppercase and wide letter spacing for short metadata labels.

## 2. Media icon system

Introduce consistent icons for:

- Previous
- Play
- Pause
- Next
- Repeat
- Volume
- Preferences

Use native HTML buttons with SVG icons. Do not use visually rendered `div` elements as controls.

Every icon control must provide:

- An accessible name through `aria-label`.
- A visible keyboard-focus state.
- A minimum 44 by 44 pixel target.
- Hover, active, disabled, and loading states.
- `aria-pressed` for toggled controls.
- A tooltip for secondary or potentially unfamiliar actions.

Keep speed textual, such as `1x` or `1.25x`, because it is clearer than a speed icon. Keep voice selection textual. Do not add shuffle because random ordering conflicts with ordered scripture listening.

## 3. Player information architecture

Organize the player in this order:

1. Scripture reference and current position, such as “Verse 2 of 8.”
2. Playback progress.
3. Elapsed and total duration.
4. Primary transport controls: previous, play/pause, and next.
5. Secondary controls: repeat, speed, volume, and preferences.
6. Expandable voice and advanced preferences.
7. Preparation, interruption, and error status when applicable.

The play/pause control should be the dominant action at approximately 52–56 pixels. Other controls must remain at least 44 pixels.

Replace the separate “Play once” and “Repeat selection” buttons with one repeat toggle:

- Repeat off means play once.
- Repeat on means repeat the selection.

Reduce unnecessary borders and button containers. Use alignment, spacing, typography, and restrained dividers to define the player structure.

## 4. Liquid-glass placement

### Primary application

Apply liquid glass to one transport tray around the audio controls. Use a slightly stronger circular treatment for play/pause, but keep the remaining icons as conventional transparent buttons inside the shared glass surface.

The long-term expression can be a persistent bottom player that remains available while reading. Until playback state becomes global, apply the treatment to the existing in-page transport area.

### Secondary applications

In priority order:

1. Expanded player preferences popover.
2. Sticky navigation after content scrolls underneath it.
3. A future mobile bottom-navigation bar.

### Excluded applications

Do not apply liquid glass to:

- Scripture passages.
- Search results or book cards.
- Form fields.
- Status and error messages.
- Authentication panels.
- Advertisements.
- Full-page backgrounds.
- Every normal button.

## 5. Library assessment

Reference: [dashersw/liquid-glass-js](https://github.com/dashersw/liquid-glass-js)

The library produces a compelling refraction effect, but it should not be integrated unchanged as a production dependency.

Current risks include:

- No npm package, release history, TypeScript API, or React wrapper.
- Accessibility, performance optimization, mobile touch work, and framework wrappers remain roadmap items.
- Its button implementation creates non-semantic elements instead of native buttons.
- It captures the full document with `html2canvas` and uploads the snapshot as a WebGL texture.
- The blur shader performs a large number of texture samples per rendered pixel.
- Nested glass runs a continuous animation-frame loop.
- There is no clear lifecycle method to remove instances, listeners, WebGL resources, or animation loops during React unmounting.
- A static page snapshot can become stale when application content changes.
- Cross-origin images can complicate page capture and canvas export.

The project uses the MIT License, so selected implementation ideas can be adapted while retaining the required license notice.

## 6. Integration strategy

1. Complete the semantic player structure and icon controls independently of glass.
2. Build a CSS fallback using a translucent theme-aware surface, `backdrop-filter`, an inset highlight, and a restrained border.
3. Adapt only the refraction renderer into an isolated client-side `LiquidGlassSurface` component.
4. Preserve React children and native controls above the rendering canvas.
5. Add explicit setup, resize, snapshot refresh, cleanup, and WebGL context-loss behavior.
6. Enable WebGL enhancement only after capability and performance checks.
7. Disable the enhancement for unsupported browsers, printing, constrained devices, and relevant accessibility preferences.
8. Ensure the player remains fully functional when JavaScript enhancement, WebGL, or page capture fails.

The CSS fallback is the product baseline. WebGL refraction is progressive enhancement, not a playback dependency.

## 7. Delivery sequence

### Phase A — Typography foundation

- Replace the font stack.
- Remove the serif display token.
- Introduce semantic typography roles.
- Migrate all pages and components.
- Check text wrapping across supported viewport sizes.

### Phase B — Player structure and icons

- Add the reusable icon and icon-button primitives.
- Replace text transport controls.
- Consolidate repeat behavior into one toggle.
- Reorganize progress, time, transport, and preferences.
- Preserve all existing playback behavior.

### Phase C — CSS glass baseline

- Add theme-aware glass surface tokens.
- Build the transport tray using the fallback treatment.
- Verify contrast against every page theme.
- Tune borders, tint, and transparency without changing theme colors.

### Phase D — WebGL experiment

- Create the isolated client-side renderer.
- Add lifecycle cleanup and failure handling.
- Test one glass surface around the transport tray.
- Compare visual benefit, load cost, frame rate, and battery impact against the CSS baseline.
- Retain the WebGL layer only if it materially improves the experience.

### Phase E — Quality verification

- Update component and interaction tests.
- Test keyboard and screen-reader operation.
- Test mobile, tablet, and desktop layouts.
- Test current Safari, Chrome, Firefox, and Edge.
- Test reduced-motion, WebGL-disabled, context-loss, loading, error, and offline states.
- Confirm no existing page-theme colors were changed.

## Acceptance criteria

- No serif font is rendered anywhere in the application.
- Apple platforms receive SF Pro through the system stack.
- Standard transport actions use conventional icons.
- Every icon control remains understandable to assistive technology.
- All interactive targets are at least 44 by 44 pixels.
- Repeat is represented by one toggle.
- Playback remains usable at mobile widths and through keyboard input.
- The glass treatment is limited to floating interface layers.
- The CSS fallback works without WebGL.
- Glass failure never prevents playback.
- Existing playback behavior and automated tests continue to pass.
- OneScripture's existing colors and page-theme assignments remain unchanged.
