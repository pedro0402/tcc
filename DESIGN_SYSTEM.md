# DESIGN SYSTEM

## Brand direction

EstruturaViva is a teaching-focused interface for learning data structures through visual reasoning. The brand should feel:

- intelligent
- precise
- sober
- academic
- trustworthy
- technical without being cold

The product is not a generic dashboard or a playful app. It is a laboratory for understanding algorithmic behavior.

---

## Core visual language

### Tone

- restrained
- editorial
- structured
- human-made
- information-first

### Avoid

- neon palettes
- glass effects
- floating generative backgrounds
- oversized decorative accents
- card-heavy composition without reason
- generic SaaS patterns

---

## Design tokens

### Color tokens

- background: #f2f1ee
- background-soft: #eceae6
- panel: #f9f8f6
- surface: #ffffff
- line: #d9d2ca
- line-strong: #c8c0b5
- text: #171d1c
- text-muted: #5a6765
- accent: #1f5d4d
- accent-soft: #dfeee9
- accent-strong: #153d32
- amber: #9d5c2a
- amber-soft: #f4e7dc
- red: #9a3b35
- red-soft: #f5e1e0

### Dark Evergreen

- background: #121816
- background-soft: #18201c
- panel: #1b2420
- surface / elevated surface: #222d28
- line: #35443d
- line-strong: #52665b
- text: #f0f3ef
- text-muted: #acbbb3
- accent: #67c5a6
- accent-strong: #8fd3bc
- amber: #e5a16a
- amber-strong: #e8ac78
- red: #d98781

`src/styles/global.css` is the source of truth for both themes. Keep the
laboratory's `--ev-*` names as semantic aliases of those global tokens in
`src/components/viva/viva.module.css`; do not maintain a separate palette there.
The existing `data-theme` attribute controls both the site and the laboratory.

Use `--accent-contrast` and `--amber-contrast` for text on solid accent fills:
white in the light theme and dark Evergreen in the dark theme. Text on soft
accent surfaces uses the corresponding strong token.

The code panel remains dark in both themes. Use `--code-bg`, `--code-ink`,
`--code-muted` and `--code-accent` for its background, text, secondary text and
technical highlights. Avoid opacity on small code labels and line numbers.

### Typography

- body, controls, forms, navigation and explanations: `--font` (Inter, Segoe UI, system-ui, sans-serif)
- headings, main calls to action, brand and prominent numbers: `--display` (Space Grotesk, Inter, sans-serif)
- code, indices, variables and technical values: `--mono` (JetBrains Mono, SFMono-Regular, ui-monospace, monospace)
- headings: 500–700 weight, balanced letter-spacing; button labels remain Inter
- body copy: comfortable line-height, medium weight, readable contrast

`index.html` loads only the weights used by the interface: Inter 400/500/600/700,
Space Grotesk 500/600/700 and JetBrains Mono 400/600, with `display=swap` and
system fallbacks. Native `h1`–`h6` and code elements use their global font tokens;
non-heading title elements opt into `--display` in their CSS module.

### Space scale

- 4, 8, 12, 16, 20, 24, 32

### Radius

- 10px for controls and small surfaces
- 12px for standard panels and cards
- avoid oversized radii unless there is a real reason

### Shadows

- minimal and functional
- subtle elevation only
- never decorative or dramatic

---

## Component rules

### Navigation

- simple, compact, text-first
- uppercase labels with restrained spacing
- active item uses subtle accent background, not loud color bombardment

### Panels

- use borders and spacing before cards
- keep the visual surface minimal
- panels should feel like structured regions, not promotional blocks

### Buttons

- rectangular or slightly rounded
- strong text labels
- only one accent color for meaningful action
- disabled state must be clearly muted

### Operation selectors

- compact chips or segmented controls
- selected state should use accent color and subtle background increase
- no glowing or floating UI

### Visualization canvas

- same visual language across stack and list
- active element should have stronger border or tonal emphasis
- labels must remain readable and technical, not decorative

### Playback controls

- compact but clear
- focus on reading state progression and revealing algorithmic steps
- avoid showing too many visual layers or UI chrome

### Engagement elements

- keep microcopy concise and explanatory
- feedback should be informative, not performative

---

## Layout principles

- primary focus should remain on the visualized structure
- narrative, code, and explanation should align in a clear reading flow
- avoid nested containers unless they represent real independent objects
- use a small number of surfaces and a disciplined hierarchy
- one idea per region

---

## Acceptance checklist

Before shipping a view, verify:

- the structure remains the dominant visual object
- the code and explanation are aligned with the state shown
- the UI is readable without decoration
- spacing and hierarchy are strong without being noisy
- colors communicate meaning, not just style
- the interface still looks coherent without shadows or gradients

---

## Implementation intent

The product should feel like a scientific visualization tool for learning, not a generic educational app. The interface must feel serious enough to support technical understanding and calm enough to support concentration.
