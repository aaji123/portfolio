---
name: Light Novel, Volume 1
description: Aaron's portfolio as one open paperback on cobalt book cloth, with paper pages, black ink, screentone plates and a magenta colour insert.
colors:
  cloth: "#2335e8"
  cloth-deep: "#1a27b0"
  paper: "#fbfaf6"
  ink: "#121212"
  ink-soft: "#4a4a4a"
  magenta: "#ff2d7a"
typography:
  display:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "clamp(48px, 18cqi, 96px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "clamp(38px, 10cqi, 60px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  opener:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "clamp(48px, 17cqi, 96px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  long-title:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "clamp(19px, 5.2cqi, 26px)"
    fontWeight: 400
    lineHeight: 1.35
  afterword:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "clamp(28px, 9cqi, 44px)"
    fontWeight: 400
    lineHeight: 1.15
  title:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "clamp(24px, 6.4cqi, 32px)"
    fontWeight: 400
    lineHeight: 1.15
  episode-number:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "44px"
    fontWeight: 400
    lineHeight: 1
  balloon:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "clamp(15px, 4cqi, 22px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
  folio:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0.04em"
  page-mark:
    fontFamily: "Dela Gothic One, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    letterSpacing: "0.3em"
  body:
    fontFamily: "Zen Kaku Gothic New, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  prose:
    fontFamily: "Zen Kaku Gothic New, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.9
  contents-entry:
    fontFamily: "Zen Kaku Gothic New, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  button:
    fontFamily: "Zen Kaku Gothic New, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    letterSpacing: "0.06em"
  tab:
    fontFamily: "Zen Kaku Gothic New, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.14em"
  running-head:
    fontFamily: "Zen Kaku Gothic New, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.16em"
  credit:
    fontFamily: "Zen Kaku Gothic New, Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  tab: "6px"
  tab-compact: "4px"
  balloon: "50%"
spacing:
  spine: "64px"
  page-pad: "56px"
  gutter-pad: "68px"
  page-top: "64px"
  page-bottom: "76px"
  spread-gap: "44px"
  running-inset: "26px"
  page-pad-compact: "26px"
components:
  spine:
    backgroundColor: "{colors.cloth-deep}"
    textColor: "{colors.paper}"
    width: "{spacing.spine}"
  thumb-tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.tab}"
    rounded: "{rounded.tab}"
    padding: "16px 9px"
  thumb-tab-active:
    backgroundColor: "{colors.magenta}"
    textColor: "{colors.ink}"
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "64px 56px 76px"
  page-insert:
    backgroundColor: "{colors.magenta}"
    padding: "56px 40px"
  page-endpaper:
    backgroundColor: "{colors.cloth-deep}"
  speech-balloon:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.balloon}"
    rounded: "{rounded.balloon}"
    padding: "18px 28px 20px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "14px 20px"
  button-primary-hover:
    backgroundColor: "{colors.magenta}"
    textColor: "{colors.ink}"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "14px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.magenta}"
    textColor: "{colors.ink}"
  status-window:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "26px 26px 28px"
  plate:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
  afterword-link:
    textColor: "{colors.ink}"
    typography: "{typography.afterword}"
    padding: "12px 6px"
  afterword-link-hover:
    backgroundColor: "{colors.magenta}"
    padding: "12px 6px 12px 20px"
  reprint:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "12px 18px"
  reprint-hover:
    backgroundColor: "{colors.magenta}"
  pet-plate:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
---

# Design System: Light Novel, Volume 1

## Overview

**Creative North Star: "Light Novel, Volume 1"**

The site is one open paperback lying on cobalt book cloth. Every surface is a page of that book: paper, black ink, screentone, and one hot magenta colour insert at the front. Nothing floats as a card or a panel; content sits on verso and recto pages that pair into spreads, each with its running head and folio, and the gutter darkens where the paper curves into the binding. Desktop shows one spread per viewport at the bunko ratio (1 : 1.41 per page); narrower screens show one page at a time and the spine becomes the top edge.

The vocabulary is the genre's own. The photo speaks in a manga speech balloon, the intro is set as the famously long light-novel title, the contents page runs dotted leaders to page numbers, skills live in a double-ruled 【bracketed】 status window, projects are numbered episodes each with a generated screentone illustration plate, contact is the afterword (あとがき), and the colophon records the print run. Vertical Japanese page marks (口絵, 目次, あとがき) label pages the way the genre does.

The press is seeded. Each visit draws a fresh seed that prints the colour insert's focus lines and every plate; Reprint rolls a new seed, writes it to the URL, and the colophon shows it as the print run. Motion is a single page-settle: a gutter shadow sweeps off each page once as it first enters view.

**Key Characteristics:**
- Paper pages on cobalt cloth; one open spread fills the first desktop viewport.
- Ink and paper do all the work; magenta is a printed ground and a hover/active state, never a text colour.
- Grey surfaces exist only as screentone dots and gutter shading.
- Display type is Dela Gothic One; text is Zen Kaku Gothic New.
- Every page carries book furniture: running head, folio, optional vertical page mark.
- Seeded generative plates and focus lines, re-rollable with Reprint.

## Colors

A printed palette: cobalt cloth around the book, cool white paper, near-black ink, and one fluorescent magenta reserved for the colour insert and for states.

### Primary
- **Book-Cloth Cobalt** (cloth): the field around the book. Carries a fine white screentone (1.1px dots at 9px pitch, white at 9% alpha). Also the theme-color and the heavier layer of the insert's focus lines.
- **Spine Cobalt** (cloth-deep): the spine, the back endpaper (with a 1.6px paper dot at 11px pitch, 22% alpha), and the scrollbar track.

### Secondary
- **Colour-Insert Magenta** (magenta): the printed ground of the colour insert page; the active and hover thumb tab; hover fills for buttons, contents entries, project links, afterword links, Reprint and the back link; the 3px focus outline; text selection. Ink sits on it (about 5:1).

### Neutral
- **Cool Paper** (paper): every page, the speech balloon, the status window, plate backgrounds, thumb tabs, text on the spine and cloth.
- **Print Ink** (ink): all body and display text, rules, frames, the primary button fill, plate artwork.
- **Soft Ink** (ink-soft): secondary text only: running heads, dotted leaders, the episode credit line, the education subtitle, the Discord note, tag separators (8.6:1 on paper).

### Named Rules
**The Insert Rule.** Magenta is ink-on-paper's only colour, and it appears as a printed ground or a state fill. It is never a text colour.

**The Screentone Rule.** Tone comes from dots, not from flat grey fills: cloth tone, endpaper tone, the status page's fading dot field (ink dots, 7px pitch, 40% opacity, masked top to bottom) and the plates themselves.

## Typography

**Display Font:** Dela Gothic One 400 (with Yu Gothic, Hiragino Sans, Noto Sans JP, sans-serif)
**Body Font:** Zen Kaku Gothic New 400 / 700 (same fallbacks)

**Character:** A heavy, blunt Japanese gothic for anything a cover or a chapter page would shout, against a clean humanist Japanese gothic for reading. Both are self-hosted woff2 subsets (latin and latin-ext); Dela Gothic One latin is preloaded.

### Hierarchy
- **Display** (400, clamp 48–96px at 18cqi, 0.95, -0.02em): "I'm Aaron." on the title page; balanced wrap.
- **Opener** (400, clamp 48–96px at 17cqi): the Projects chapter opener heading. The colophon's ":]" uses the same face at clamp 64–96px (22cqi).
- **Headline** (400, clamp 38–60px at 10cqi, 1, -0.02em): every page's h2.
- **Long Title** (400, clamp 19–26px at 5.2cqi, 1.35): the intro, ruled 4px above and 1px below.
- **Afterword** (400, clamp 28–44px at 9cqi, 1.15): contact links.
- **Title** (400, clamp 24–32px at 6.4cqi, 1.15): episode titles; education h3 runs clamp 24–34px at 7cqi, 1.1.
- **Episode Number** (400, 44px, 1): 01–08 beside the episode title.
- **Body** (400, 16px, 1.7): default text; project descriptions at 16px/1.75, max 64ch.
- **Prose** (400, 16.5px, 1.9, max 64ch): the About pages, set like a translated novel: no paragraph gap beyond 0.4em, later paragraphs indented 1.6em.
- **Contents Entry** (700, 18px; episodes 400, 15px): contents lines; page numbers in display 14px tabular.
- **Button** (700, 14px, 0.06em): buttons, Reprint, project links.
- **Tab** (700, 12px, 0.14em, uppercase, vertical-rl on desktop): thumb-index tabs.
- **Running Head** (700, 11px, 0.16em, uppercase, ink-soft): top of each page.
- **Folio** (display 400, 13px, 0.04em, ink): page number at the bottom outer corner.
- **Page Mark** (display 400, 15px, 0.3em, vertical-rl): Japanese genre marks.
- **Credit** (400, 13px, 0.04em, ink-soft): the stack line after each episode.

### Named Rules
**The Two Voices Rule.** Display face for what a book would print large (titles, numbers, folios, marks, the balloon); text face for reading and controls. Never set paragraphs in Dela Gothic One.

**The Container Scale Rule.** Display sizes scale with the page (cqi on the page's inline-size container), not with the viewport, so type keeps its relation to the page at every size.

## Layout

The book is a two-column grid of equal pages, `min(1200px, 100vw - 200px, (100vh - 56px) * 1.41)` wide, centred, offset 64px for the fixed spine; each page is at least half that width times 1.41 tall. Spreads stack with a 44px gap. Pages pad 64px top, 76px bottom and 56px on the outer edge; the gutter edge pads 68px. Running heads and folios sit 26px from top and bottom on the outer edge (left on verso, right on recto). Page marks hang vertically 22px from the outer edge, 64px down.

Chapters use `display: contents` so their pages join the book grid directly. The thumb-index tabs are fixed on the fore-edge at the book's right edge, 96px from the top, stacked 6px apart.

Breakpoints: at 1099px and below the book becomes one column (max 680px, 12px side margin), pages pad 26px on both sides with 56px top and 64px bottom, the spine becomes a static top bar with horizontal tabs, all running heads and folios move to the right, and page marks shrink to 13px at 8px from the edge. At 700px and below the first screen is tightened so the insert, the name and both actions fit together (insert photo 44% wide, balloon 13px). At 420px and below the education item stacks.

## Elevation & Depth

Depth is physical and soft: the book lies on cloth, the spine casts onto it, tabs lift off the fore-edge, and the insert photo is a print laid on the page. Flat ink artwork carries no shadow. Shading inside a page comes from gradients that model paper curving into the binding.

### Shadow Vocabulary
- **Page** (`box-shadow: 0 26px 48px -22px rgba(0, 0, 0, 0.7)`): every page, lifting the book off the cloth.
- **Spine** (`box-shadow: 6px 0 24px rgba(0, 0, 0, 0.35)`): the fixed spine over the cloth; removed on narrow screens.
- **Thumb Tab** (`box-shadow: 4px 6px 16px -6px rgba(0, 0, 0, 0.6)`): fore-edge tabs; removed on narrow screens.
- **Insert Print** (`box-shadow: 0 28px 44px -16px rgba(0, 0, 0, 0.75)`): the photo print on the colour insert, rotated -2.5deg.
- **Gutter** (`linear-gradient(to left|right, rgba(18,18,18,0.16), rgba(18,18,18,0.04) 28px, transparent 72px)`): inner edge of verso and recto pages; on one-column screens a single 18px fade on the left.

### Named Rules
**The Paper Object Rule.** Shadows belong to physical objects (pages, spine, tabs, a print). Nothing inside a page casts a shadow.

## Shapes

Pages, frames, plates, buttons and the status window are square-cornered (0px). Rules do the shaping: 4px ink rules open sections (intro, education item, afterword list, colophon), 1px ink rules separate rows, a 6px double rule frames the status window, a 1px dashed rule divides its groups, 2px ink frames hold plates and pet plates, and 2px dotted ink-soft leaders run the contents. Only two things curve: thumb tabs round their outer corners (6px, 4px when horizontal) and the speech balloon is an ellipse (50%) with a 3px ink outline and a skewed wedge tail.

## Components

### Spine and Thumb-Index Tabs
The book's spine is a 64px Spine Cobalt bar fixed down the left, with "Portfolio" set vertically at the top and "Vol. 1" at the foot in paper display type. The tabs (About, Projects, Skills, Contact) are paper tabs sticking out of the fore-edge: vertical text, padding 16px 9px, outer corners rounded 6px, a soft lift shadow. Hover and the current chapter (`aria-current`, set while scrolling) fill magenta and slide 4px outward (200ms, ease-out). On narrow screens the spine is a top bar, the tabs run horizontally with 4px corners and no slide.

### Page (Verso and Recto)
Every section is a paper page with running head, folio and gutter shading; verso pages shade on the right, recto on the left. Page marks may sit on the outer edge in paper (on the insert) or ink (`page-mark--ink`). On first view each page's gutter shadow sweeps off once (900ms, ease-out); this is disabled under reduced motion.

### Colour Insert
The verso of spread one: a magenta page with a seeded canvas of focus lines (220 cobalt wedges, then 130 paper wedges) that start outside the photo's frame and never cross it. The mugshot is a print with a 10px white border, rotated -2.5deg, about 70% of the page width (max 380px). The page mark 口絵 sits low on the outer edge.

### Speech Balloon
"HELLO, WORLD!" spoken by the photo: a paper ellipse with a 3px ink outline, rotated -4deg, display type, with a tail built from an ink wedge and a paper wedge skewed -24deg. Top-left of the insert; 2px outline and 13px type on phones.

### Title Page Buttons
- **Primary** (View my projects): ink fill, paper text, 2px ink border, square corners, 14px 20px.
- **Secondary** (Contact me): transparent with ink text and the same 2px ink border.
- **Hover:** magenta fill, ink text (150ms). Focus: 3px magenta outline offset 3px (paper outline on the spine).

### Contents with Leaders
An ordered list of chapter entries, each a flex line of label, a 2px dotted ink-soft leader, and a display-face page number (tabular, right-aligned). Episodes nest 22px in at 15px. Hover fills the label magenta.

### Prose Page
About text at 16.5px/1.9, first-line indents from the second paragraph on, max 64ch.

### Status Window
Skills inside a paper box framed by a 6px double ink rule (padding 26px). Each group heading is wrapped in 【 】 (decorative, hidden from assistive text); entries run inline separated by ／ in ink-soft. Groups divide on a 1px dashed rule. A screentone dot field fades up the bottom 42% of the page behind it.

### Screentone Plate
A canvas illustration framed by a 2px ink rule on paper, 4 : 3 (3 : 2 for the education plate; flexible, min 320px, for the chapter opener). Drawn only with ink and paper from the seed: flow, speed, rings, hatch, stipple, halftone, focus and stars for episodes 01–08, flash for the opener, halftone elsewhere. Plates are hidden when JavaScript is absent and in forced-colours and print.

### Episode Lockup
Each project page is one episode: plate, then the episode number (44px display) and title (display, balanced) on one baseline 16px apart, the description, the stack as a credit line (13px ink-soft), and links underlined with a 2px ink rule that fill magenta on hover.

### Afterword
Contact as the book's afterword (あとがき): a short intro, then a column of large display links between a 4px top rule and 1px row rules. Hover and focus fill magenta and indent the link from 6px to 20px (200ms ease-out). The Discord username follows as a 15px ink-soft note.

### Colophon and Reprint
The last spread pairs a colophon verso with the back endpaper (Spine Cobalt with paper dots). The colophon is a giant ":]" over a 4px-ruled definition list: Print run (the seed, `aria-live`) and Printed (in your browser). Reprint is a paper button with a 2px ink border (12px 18px) that fills magenta on hover; it rolls a new seed, writes `#s=<seed>` to the URL and reprints the insert, every plate and the favicon. Both appear only when JavaScript runs.

### Appendix Pages and Pet Plates
`roblox.html` continues the same volume as appendix pages (folios 17–21): a project page with a display h1 (clamp 40–80px at 14cqi) and a primary button, pet pages, and a back-link page with a large display link over a 4px ink rule. Each pet is a captioned plate: two square views side by side inside one 2px ink frame with a 2px ink divider, captioned in 15px display type; plates sit two to a row (26px by 20px gaps).

## Do's and Don'ts

### Do:
- **Do** put every new section on a verso or recto page with its running head and folio, so spreads stay paired.
- **Do** keep ink text on paper or on magenta; use ink-soft only for secondary furniture and credits.
- **Do** use magenta only as a ground or a state fill (hover, current tab, focus outline, selection).
- **Do** draw new illustration from the seed, in ink on paper, inside a 2px ink frame.
- **Do** shade with screentone dots or gutter gradients rather than flat grey.
- **Do** scale display type with the page container (cqi clamps), not the viewport.
- **Do** keep motion to the one page-settle and short state transitions (150–200ms, `cubic-bezier(0.16, 1, 0.3, 1)`), and turn both off under reduced motion.

### Don't:
- **Don't** set any text in magenta.
- **Don't** introduce grey fills, panels or cards; the only surfaces are paper, cloth and the magenta insert.
- **Don't** round pages, frames, plates or buttons; curves belong to the thumb tabs and the speech balloon.
- **Don't** let the focus lines or any effect cross the photo; the face stays clear.
- **Don't** use `Math.random()` for anything drawn; every mark comes from the seed so a print run can be shared.
- **Don't** set paragraphs in Dela Gothic One.
