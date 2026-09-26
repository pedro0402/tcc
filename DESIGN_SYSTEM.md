# DESIGN SYSTEM

## Brand direction

Estruturalab is a teaching-focused interface for learning data structures through visual reasoning. The brand should feel:

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

### Typography

- font family: Inter, Segoe UI, sans-serif
- monospace: IBM Plex Mono, SFMono-Regular, ui-monospace, monospace
- headings: 600–800 weight, tight tracking for labels, balanced letter-spacing
- body copy: comfortable line-height, medium weight, readable contrast

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
