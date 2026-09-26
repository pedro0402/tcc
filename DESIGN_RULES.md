# DESIGN_RULES.md

## Purpose

This document defines the visual, interaction, composition, and implementation rules for this product.

Any AI assistant, designer, or developer working on the frontend must follow these rules before creating, modifying, or refactoring UI.

The objective is to produce interfaces that feel intentionally designed, production-ready, coherent, restrained, and human-made.

The UI must not resemble a generic AI-generated dashboard, landing page, or Dribbble concept.

---

# 1. Core Design Philosophy

The interface should feel:

- intentional
- restrained
- precise
- mature
- coherent
- useful
- production-ready
- information-driven
- typography-driven
- structurally clear

The interface should NOT feel:

- overly decorative
- futuristic without reason
- excessively soft
- excessively rounded
- template-like
- generated from generic SaaS patterns
- visually noisy
- designed primarily to impress rather than to be used

Every visual decision must have a functional reason.

Before adding any visual element, ask:

> What problem does this solve?

If the answer is only:

> "It looks nicer"

the element probably should not exist.

---

# 2. Primary Rule

## Function before decoration

Visual hierarchy should primarily come from:

1. typography
2. spacing
3. alignment
4. grouping
5. contrast
6. borders
7. surface differences
8. color
9. shadow
10. decoration

Do not reverse this hierarchy.

A well-designed interface should still make sense if:

- shadows are removed
- decorative colors are removed
- illustrations are removed
- animations are disabled

---

# 3. Avoid the "AI UI" Look

AI-generated interfaces frequently overuse the same visual patterns.

Avoid these patterns by default.

## Do not automatically use

- gradients
- glassmorphism
- blurred backgrounds
- glowing borders
- neon effects
- decorative background blobs
- random abstract shapes
- giant hero typography
- oversized cards
- cards inside cards
- excessive card grids
- excessive shadows
- colored icon boxes
- circular icon backgrounds
- large border radiuses
- pills for ordinary controls
- excessive badges
- unnecessary labels
- excessive helper text
- excessive whitespace
- centered layouts for application interfaces
- arbitrary accent colors
- arbitrary animations
- decorative charts without meaningful data
- large empty dashboard areas
- generic motivational copy
- excessive emoji usage
- excessive empty-state illustrations

These elements are not forbidden.

They require a functional reason.

---

# 4. Do Not Turn Everything Into a Card

One of the most important rules in this design system:

> A section does not automatically need a card.

Do not use cards simply because several elements belong together.

Prefer:

- spacing
- alignment
- headings
- dividers
- borders
- layout structure
- background hierarchy

before introducing a card.

## Good reasons to use a card

Use a card when the content behaves like an independent object or surface.

Examples:

- selectable entity
- draggable item
- dashboard widget
- summary object
- independent status module
- external integration
- preview
- actionable resource
- isolated form
- interactive data object

## Poor reasons to use a card

Avoid cards around:

- page headings
- simple KPIs
- filters
- search controls
- navigation
- table sections
- regular form sections
- descriptive text
- basic metadata
- tabs
- every individual metric

---

# 5. Avoid Nested Cards

Do not place cards inside cards unless the inner element represents a genuinely independent object.

Bad:

```text
┌───────────────────────────────┐
│ Card                          │
│                               │
│   ┌───────────────────────┐   │
│   │ Another card          │   │
│   └───────────────────────┘   │
│                               │
└───────────────────────────────┘
```

Prefer:

```text
Section title

Primary information

────────────────────────────

Secondary information
```

Nested visual containers quickly create the appearance of generic AI-generated UI.

---

# 6. Surface Economy

Minimize the number of visual surfaces on screen.

A page should not contain multiple competing background levels unless necessary.

Prefer approximately:

```text
Application background
    ↓
Primary surface
    ↓
Overlay / dropdown / modal
```

Avoid:

```text
background
→ container
→ panel
→ card
→ inner card
→ inset panel
```

Use as few elevation levels as possible.

---

# 7. Typography Is the Primary Hierarchy Tool

Use typography before boxes, colors, or decoration.

Hierarchy should be visible through:

- font size
- font weight
- line height
- spacing
- color contrast

Do not use bold everywhere.

If everything is emphasized, nothing is emphasized.

---

# 8. Typography Scale

Prefer a small, disciplined type scale.

Recommended baseline:

```text
12px — captions, metadata, compact labels
14px — secondary UI text, table content, controls
16px — default body text
18px — emphasized body / small section titles
20px — section heading
24px — page-level heading
30–32px — important page title when justified
```

Avoid arbitrary sizes.

Avoid extremely large typography in product interfaces.

Sizes above `32px` should be uncommon in SaaS/product screens.

---

# 9. Font Weights

Use a limited weight system.

Recommended:

```text
400 — normal content
500 — controls, labels, moderate emphasis
600 — titles and important emphasis
```

Use `700+` sparingly.

Avoid making every heading bold.

Prefer:

```css
font-medium
```

over:

```css
font-bold
```

for many interface elements.

---

# 10. Text Hierarchy

Prefer:

```text
Page title
Supporting description

Section title
Secondary explanation

Primary information
Metadata
```

Avoid repeating the same information in multiple hierarchy levels.

Bad:

```text
Users

Manage Users

Here you can manage all your users.
```

Better:

```text
Users
Manage access, roles and account status.
```

---

# 11. Avoid Redundant Copy

Interfaces generated by AI frequently over-explain themselves.

Avoid text such as:

- "Welcome to your dashboard"
- "Here you can manage..."
- "Easily manage..."
- "Quickly access..."
- "Everything you need..."
- "Let's get started"
- "Your centralized hub for..."

unless genuinely appropriate to the product.

Prefer concise product language.

Bad:

> Manage your projects efficiently and stay on top of everything happening across your organization.

Better:

> Projects

or:

> Track active projects, owners and deadlines.

---

# 12. Spacing System

All spacing must come from a controlled scale.

Recommended:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Do not introduce arbitrary values such as:

```text
13px
17px
19px
27px
37px
```

unless required by an external constraint.

---

# 13. Spacing Hierarchy

Spacing must communicate relationship.

Elements that belong together should be closer.

Different conceptual sections should be farther apart.

Typical guidance:

```text
Icon ↔ label                 6–8px
Label ↔ input                6–8px
Related controls             8–12px
Elements in same group      12–16px
Form groups                 16–24px
Section title ↔ content     16–24px
Different sections          32–48px
Major page regions          48–64px
```

Do not use the same gap everywhere.

---

# 14. Avoid Excessive Padding

AI-generated UI frequently uses too much padding.

Do not automatically use:

```text
p-6
p-8
py-8
gap-8
```

for every container.

Common production values should often be closer to:

```text
p-3
p-4
p-5
gap-2
gap-3
gap-4
```

Density depends on context.

---

# 15. Interface Density

Default to moderate information density.

Application interfaces should not feel like marketing pages.

A dashboard should efficiently use screen space.

Prefer:

- compact toolbars
- concise forms
- useful table density
- reduced unnecessary vertical space
- clear alignment

Avoid creating huge empty gaps merely to make the design feel "premium."

---

# 16. Border Radius

Use restrained border radiuses.

Recommended:

```text
4px — compact controls
6px — inputs, buttons
8px — cards, menus, panels
10–12px — larger dialogs when appropriate
```

Avoid by default:

```text
rounded-xl
rounded-2xl
rounded-3xl
rounded-full
```

unless the shape has a specific reason.

Do not make every element look like a pill.

---

# 17. Pills

Use pill-shaped elements only for things that semantically behave like pills.

Appropriate:

- status
- filter chip
- tag
- token
- selected category
- compact segmented option

Usually inappropriate:

- standard buttons
- search fields
- navigation items
- regular form inputs
- large CTA buttons

---

# 18. Borders

Prefer subtle borders over shadows for static grouping.

Borders should usually be low-contrast.

Use borders for:

- separating sections
- defining inputs
- delimiting interactive objects
- distinguishing surfaces
- table structure

Avoid placing borders around everything.

---

# 19. Shadows

Shadows should communicate elevation.

Good uses:

- modal
- popover
- dropdown
- floating menu
- command palette
- floating action element
- dragged object

Usually unnecessary:

- normal cards
- dashboard widgets
- static sections
- tables
- navigation
- form containers

Avoid:

```text
shadow-lg
shadow-xl
shadow-2xl
```

on ordinary static content.

---

# 20. Colors

Use color intentionally.

The default UI should rely primarily on neutral colors.

Suggested conceptual palette:

```text
Background
Surface
Elevated surface
Border
Primary text
Secondary text
Muted text
Brand
Success
Warning
Error
Info
```

Do not introduce colors directly inside components when a semantic token exists.

---

# 21. Avoid Color Explosion

Do not assign different colors to every dashboard metric.

Bad:

```text
Revenue = blue
Users = purple
Orders = orange
Conversion = green
Retention = pink
```

Prefer a neutral interface where color communicates meaning.

Color should typically indicate:

- brand
- status
- warning
- error
- success
- selection
- actionable emphasis

Not decoration.

---

# 22. Accent Color

Use one dominant accent color.

Secondary accent colors should be rare.

Avoid simultaneously using:

- blue
- purple
- cyan
- pink
- orange
- green

merely for visual variety.

---

# 23. Gradients

Do not use gradients by default.

Avoid:

```css
bg-gradient-to-r
bg-gradient-to-br
from-purple-500
to-blue-500
```

especially in:

- buttons
- cards
- page backgrounds
- headings
- icon containers

A gradient must have a product-specific reason.

---

# 24. Icons

Icons are functional communication tools.

Use icons to:

- identify common actions
- improve scanability
- distinguish navigation
- communicate status

Do not add icons simply because an element looks empty.

---

# 25. Avoid Colored Icon Boxes

A common AI UI pattern is:

```text
┌───────────┐
│ 🟣 icon   │
│ Metric    │
│ 12,430    │
└───────────┘
```

Avoid putting every icon inside:

- colored squares
- circles
- gradient containers
- tinted backgrounds

Prefer standalone icons when possible.

---

# 26. Icon Size

Use consistent sizes.

Recommended:

```text
14px — tiny metadata/action
16px — default compact UI
18px — standard control
20px — navigation / prominent action
24px — occasional larger context
```

Avoid oversized icons in application interfaces.

---

# 27. Icon Consistency

Use a single icon family where possible.

For example:

- Lucide
- Phosphor
- Heroicons

Do not mix unrelated icon styles.

Maintain consistent:

- stroke width
- visual weight
- size
- alignment

---

# 28. Buttons

Buttons must clearly communicate priority.

Use visual hierarchy such as:

```text
Primary
Secondary
Ghost
Destructive
```

Do not have multiple primary buttons competing on the same screen.

Usually, there should be one obvious primary action per contextual region.

---

# 29. Button Restraint

Avoid:

- gradients
- oversized height
- huge horizontal padding
- heavy shadows
- unnecessary icons
- rounded-full by default

Recommended typical heights:

```text
32px — compact
36px — standard
40px — comfortable
```

Larger buttons should have a specific reason.

---

# 30. Button Labels

Prefer direct actions.

Good:

```text
Save
Create event
Add user
Delete
Export
Send invitation
```

Avoid unnecessarily verbose copy:

```text
Save your changes
Create a new event now
Proceed to add user
```

---

# 31. Forms

Forms should prioritize clarity and speed.

Use:

- labels above fields
- predictable spacing
- clear validation
- concise help text
- logical grouping

Do not wrap every field in its own decorative container.

---

# 32. Form Width

Do not stretch every form input across the full viewport.

Use widths appropriate to the expected data.

Examples:

```text
Name                medium
Email               medium
Date                 short
Quantity             short
Description          large
Search               contextual
```

---

# 33. Helper Text

Only show helper text when it adds information.

Avoid:

```text
Email
Enter your email address below.
```

The label and placeholder may already communicate enough.

---

# 34. Placeholders

Do not use placeholders as substitutes for labels.

Bad:

```text
[ Enter your email ]
```

Better:

```text
Email
[ name@company.com ]
```

---

# 35. Tables

Tables should feel like data tools, not collections of cards.

Prefer:

- compact row heights
- aligned columns
- clear headers
- restrained separators
- contextual row actions
- right alignment for numbers
- consistent formatting

Avoid converting tabular data into cards unless mobile usability requires it.

---

# 36. Table Density

Avoid excessively tall rows.

Typical table rows:

```text
36–48px
```

depending on content.

Avoid `64px+` rows unless the row contains genuinely rich content.

---

# 37. Dashboard Metrics

Metrics do not automatically require cards.

Prefer layouts such as:

```text
Revenue
R$ 84.200
+8.4% vs previous month
```

arranged through grid and spacing.

Cards should be used only when the metric is an independent interactive widget.

---

# 38. Numbers

Numeric interfaces should emphasize numbers without turning every metric into giant typography.

Recommended:

```text
20–32px
```

for most dashboard metrics.

Use larger values only for the primary metric on the page.

---

# 39. Badges

Use badges sparingly.

Good:

```text
Active
Pending
Cancelled
Draft
Admin
```

Bad:

```text
NEW
POPULAR
FAST
SECURE
SMART
PRO
```

when they serve mainly as decoration.

---

# 40. Navigation

Navigation must be visually quieter than page content.

Do not make every navigation item look like a button.

Avoid:

- strong backgrounds on all items
- excessive rounded containers
- icons with colored backgrounds
- large vertical padding
- excessive section labeling

Use one clear active state.

---

# 41. Sidebars

A sidebar should prioritize scanability.

Recommended:

```text
Icon + label
compact vertical rhythm
subtle active state
clear grouping
```

Avoid:

```text
each item inside its own pill
large cards inside sidebar
decorative gradients
oversized logo areas
```

---

# 42. Headers

Application headers should be compact.

Typical header height:

```text
48–64px
```

Avoid marketing-style application headers occupying excessive vertical space.

---

# 43. Page Titles

Page titles should usually be left-aligned.

Good:

```text
Events                                  Create event
Manage your organization's events.
```

Avoid:

```text

                Events

        Manage all your events
     from one beautiful dashboard

```

for standard application screens.

---

# 44. Modals

Use modals only when interrupting the current context is justified.

Good uses:

- confirmation
- compact creation flow
- destructive action
- focused edit
- quick inspection

Avoid putting large multi-step workflows into small modals.

---

# 45. Modal Design

Modals may use stronger elevation because they are overlays.

However:

- keep radius restrained
- avoid giant headings
- avoid excessive padding
- keep actions predictable
- usually place primary action on the right

---

# 46. Empty States

Empty states should be useful, not theatrical.

Preferred structure:

```text
No events yet

Create your first event to start managing registrations.

[Create event]
```

Avoid:

- giant illustration
- multiple paragraphs
- inspirational copy
- decorative gradients
- huge empty containers

---

# 47. Loading States

Use loading states that resemble the final layout.

Prefer:

- subtle skeletons
- inline spinners
- button loading states

Avoid:

- full-screen loaders for small actions
- excessive animation
- decorative loading illustrations

---

# 48. Animation

Animation must communicate:

- continuity
- cause and effect
- state change
- spatial relationship

Do not animate simply because animation is available.

Recommended durations:

```text
100–150ms — immediate controls
150–200ms — dropdowns and small transitions
200–300ms — dialogs / larger transitions
```

Avoid long decorative animations.

---

# 49. Hover States

Hover should be subtle.

Prefer changing:

- background slightly
- border slightly
- text contrast
- icon contrast

Avoid:

- scale effects on every element
- large shadows
- glow
- dramatic transforms

---

# 50. Avoid Hover Scale

Do not use patterns like:

```css
hover:scale-105
hover:scale-110
```

for normal buttons, cards, table rows, or navigation.

Scaling is rarely appropriate for application UI.

---

# 51. Accessibility

Visual restraint must never reduce usability.

Always consider:

- text contrast
- focus states
- keyboard navigation
- semantic HTML
- aria attributes
- touch target size
- visible validation states

Do not remove focus outlines without providing an accessible replacement.

---

# 52. Alignment

Strong alignment is one of the easiest ways to make an interface feel professionally designed.

Align:

- labels
- controls
- titles
- columns
- numbers
- actions
- navigation

Avoid arbitrary horizontal offsets.

Whenever possible, elements should align to an obvious shared axis.

---

# 53. Grid

Use a consistent layout grid.

Suggested application layout:

```text
Page max-width: contextual

Content padding:
mobile: 16px
tablet: 24px
desktop: 24–32px
```

Do not center narrow dashboard content inside unnecessarily huge whitespace.

Use available screen width intelligently.

---

# 54. Maximum Width

Do not apply `max-w-7xl mx-auto` automatically to every application.

Different screens require different widths.

Examples:

```text
Settings form        640–800px
Article/editor       720–900px
Dashboard            1200–1600px
Data table           wide / responsive
Modal                400–720px
```

Width should be based on content.

---

# 55. Responsive Design

Responsive behavior should not simply shrink desktop UI.

Determine:

- what remains visible
- what stacks
- what becomes scrollable
- what moves to a menu
- what changes priority
- what becomes full-screen

Do not convert every desktop card into an endless vertical stack without considering usability.

---

# 56. Mobile

On mobile:

- preserve hierarchy
- reduce decorative spacing
- keep primary actions reachable
- allow horizontal scrolling for dense data when appropriate
- use bottom sheets where useful
- avoid deeply nested containers

Do not over-simplify useful data.

---

# 57. Content Before Chrome

The product content should dominate the screen.

UI chrome should remain quiet.

The user should notice:

```text
their event
their customer
their report
their data
their task
their content
```

before noticing:

```text
the card
the shadow
the gradient
the container
```

---

# 58. Real Product Test

Before considering a screen finished, ask:

> Does this look like a real product people use every day, or a portfolio mockup?

Prefer real-product characteristics:

- dense enough
- predictable
- calm
- fast to scan
- consistent
- unremarkable where it should be
- distinctive only where it matters

---

# 59. Component Reuse

Do not create slightly different versions of the same component across pages.

Reuse existing:

- buttons
- badges
- inputs
- dialogs
- dropdowns
- tables
- navigation patterns
- empty states
- alerts

If a new variant is required, add it deliberately to the design system.

---

# 60. No One-Off Styling Without Reason

Avoid repeated arbitrary Tailwind classes such as:

```tsx
rounded-[13px]
px-[18px]
text-[15px]
bg-[#17181C]
```

Prefer semantic tokens and reusable variants.

One-off values require justification.

---

# 61. Tailwind Rules

Prefer semantic composition over long arbitrary class strings.

Bad:

```tsx
<div className="rounded-[18px] bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 shadow-xl p-7">
```

Prefer:

```tsx
<section className="border-b py-6">
```

or an established component variant.

---

# 62. shadcn/ui Rules

shadcn components are starting points, not the final visual identity.

Do not use every default shadcn component exactly as-is across the product.

Standardize:

- radius
- spacing
- typography
- heights
- focus states
- colors
- variants

The design system should feel like the product, not like the component library.

---

# 63. Component API Quality

Avoid components with dozens of style toggles.

Bad:

```tsx
<Card
  rounded
  shadow
  gradient
  glow
  elevated
  bordered
  colorful
/>
```

Prefer semantic variants:

```tsx
<Card variant="default" />
<Card variant="interactive" />
<Card variant="selected" />
```

---

# 64. Semantic Tokens

Prefer tokens such as:

```text
background
foreground
surface
surface-muted
border
border-strong
muted
muted-foreground
primary
primary-foreground
success
warning
destructive
```

Avoid exposing raw color names everywhere.

Bad:

```text
blue-500
zinc-800
red-400
```

Better:

```text
primary
surface
destructive
```

---

# 65. Recommended Radius Tokens

```css
--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 12px;
```

`12px` should already feel generous.

Avoid globally adopting 16–24px radius.

---

# 66. Recommended Spacing Tokens

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

---

# 67. Information Hierarchy Audit

Every screen must have a clear visual order.

Ask:

1. What should the user notice first?
2. What should they notice second?
3. What should they act on?
4. What information is secondary?
5. What can be hidden until requested?

If everything has similar visual weight, redesign the hierarchy.

---

# 68. Visual Weight

Primary elements may use:

- stronger contrast
- slightly larger type
- strategic spacing

Secondary elements should use:

- lower contrast
- smaller type
- quieter styling

Avoid giving secondary actions the same prominence as primary actions.

---

# 69. Progressive Disclosure

Do not display every possible action at once.

Hide low-frequency actions behind:

- contextual menus
- dropdowns
- expandable sections
- advanced options

This reduces visual noise.

---

# 70. Toolbars

Toolbars should contain frequent actions only.

Prefer:

```text
Search | Filter | Sort                      Create
```

rather than:

```text
Search | Filter | Sort | Export | Import | Refresh | Settings | Columns | Help | More
```

Expose secondary actions progressively.

---

# 71. Avoid Fake Complexity

Do not add UI just to make the product appear sophisticated.

Avoid:

- meaningless charts
- unnecessary metrics
- fake trend indicators
- decorative analytics
- status panels that repeat existing information

Every displayed element should help the user decide or act.

---

# 72. Charts

Charts should answer a question.

Before adding a chart, define the question.

Examples:

> How is revenue changing over time?

> Which channel generates the most conversions?

> Where are users dropping off?

Do not add a chart merely because the screen is called "Analytics."

---

# 73. Chart Styling

Prefer:

- restrained grid lines
- limited colors
- readable labels
- direct tooltips
- minimal decoration

Avoid:

- gradients below every line
- excessive rounded charts
- glowing lines
- 3D charts
- unnecessary legends

---

# 74. Data Formatting

Maintain consistent formatting for:

- currency
- percentages
- dates
- time
- quantities
- abbreviations

Example:

```text
R$ 12.450,00
12,4%
25 set 2026
18:30
```

Do not mix formats across screens.

---

# 75. Status Color

Status colors should mean the same thing throughout the product.

Example:

```text
green  → success / active
yellow → warning / attention
red    → error / destructive
blue   → informational / selected when appropriate
gray   → neutral / inactive
```

Do not use semantic colors decoratively.

---

# 76. Destructive Actions

Destructive UI should be visually restrained until necessary.

Do not make every delete action a large red button.

Prefer:

- menu item
- ghost destructive action
- confirmation dialog

Use strong destructive styling at the confirmation point.

---

# 77. Contextual Actions

Actions should appear near the objects they affect.

Avoid detached controls whose target is ambiguous.

---

# 78. Consistency Beats Novelty

When deciding between:

A. a familiar pattern already used elsewhere

and

B. a visually interesting new pattern

prefer A unless B materially improves usability.

---

# 79. Familiarity Is Good

Do not reinvent standard interaction patterns without reason.

Use familiar behavior for:

- dropdowns
- dialogs
- pagination
- tabs
- breadcrumbs
- tables
- search
- filters
- forms

Product personality should come from refinement, not from making basic controls unfamiliar.

---

# 80. Avoid "Premium" Clichés

Do not automatically interpret "premium" as:

- black backgrounds
- gold gradients
- huge spacing
- glossy surfaces
- glass
- blur
- serif headlines
- oversized typography

Premium product design usually comes from:

- precision
- restraint
- typography
- consistency
- excellent interaction
- appropriate density
- polished details

---

# 81. Avoid "Modern" Clichés

Do not automatically interpret "modern" as:

- gradient
- rounded-2xl
- glassmorphism
- purple
- cyan
- glowing borders
- animations everywhere

Modern means appropriate to contemporary interaction patterns, not decorative trends.

---

# 82. Avoid Generic SaaS Layouts

Do not automatically generate:

```text
Greeting
4 KPI cards
Large chart
Recent activity card
Quick actions card
```

Instead design around the actual workflow of the product.

Ask:

> What does the user come here to accomplish?

Structure the screen around that task.

---

# 83. Avoid Generic Dashboard Greeting

Do not start dashboards with:

```text
Good morning, John 👋
Here's what's happening with your business today.
```

unless this genuinely serves the product.

Prefer useful content immediately.

---

# 84. Avoid Decorative Microcopy

Avoid unnecessary phrases such as:

- "You're doing great!"
- "Keep it up!"
- "Amazing work!"
- "Let's make magic happen."
- "Ready to get started?"

unless the brand explicitly requires this tone.

---

# 85. Reduce Visual Containers

After generating a page, perform a "container deletion pass."

Ask of every container:

> Can this background, border, or card be removed while preserving hierarchy?

If yes, remove it.

---

# 86. Reduce Decoration

Perform a "decoration deletion pass."

Inspect:

- shadows
- icons
- badges
- gradients
- animations
- background colors
- borders

Remove anything that does not contribute to hierarchy, state, interaction, or meaning.

---

# 87. Reduce Copy

Perform a "copy deletion pass."

Remove:

- repeated labels
- obvious helper text
- generic descriptions
- unnecessary subtitles
- duplicated state information

Interfaces should be concise.

---

# 88. Reduce Actions

Perform an "action hierarchy pass."

Determine:

```text
Primary action
Secondary actions
Low-frequency actions
Destructive actions
```

Do not render all of them with equal prominence.

---

# 89. AI Design Review Checklist

Before completing any screen, explicitly review it for AI-generated design patterns.

Check:

- Are there too many cards?
- Are there cards inside cards?
- Are border radiuses too large?
- Are shadows unnecessary?
- Are there decorative gradients?
- Are there decorative icon containers?
- Is there too much whitespace?
- Is the typography oversized?
- Are badges overused?
- Are colors being used decoratively?
- Is every section inside a box?
- Are labels redundant?
- Are there unnecessary descriptions?
- Does every metric have its own card?
- Are buttons unnecessarily pill-shaped?
- Are components too visually large?
- Is the page centered when it should use available width?
- Are there too many competing primary elements?
- Could borders replace shadows?
- Could spacing replace containers?
- Could typography replace decoration?

If several answers are yes, simplify the interface before finishing.

---

# 90. Three-Level Simplification Test

For every screen, perform three passes.

## Pass 1 — Structure

Check:

- hierarchy
- layout
- alignment
- information architecture
- spacing

Ignore decoration.

## Pass 2 — Interaction

Check:

- actions
- controls
- states
- feedback
- accessibility

## Pass 3 — Polish

Only then consider:

- subtle colors
- transitions
- shadows
- visual refinement

Never start with polish.

---

# 91. Greyscale Test

A screen should remain understandable when viewed in grayscale.

If hierarchy depends almost entirely on color, redesign it.

Hierarchy should survive through:

- spacing
- size
- weight
- borders
- positioning

---

# 92. Squint Test

Blur your vision or mentally reduce detail.

The major hierarchy should remain obvious.

You should still understand:

- page title
- primary content
- primary action
- major sections

If everything has equal visual weight, simplify.

---

# 93. Screenshot Test

Imagine seeing the interface in a product screenshot without context.

Ask:

> Does this look like a generic AI SaaS template?

Common warning signs:

- four identical KPI cards
- purple gradients
- rounded-2xl everywhere
- glowing icon boxes
- huge welcome message
- generic analytics graph
- excessive empty space

If yes, redesign.

---

# 94. Production Test

Ask:

> Would a team maintaining this product for five years want to preserve this pattern?

If the answer is no because the design is:

- too decorative
- difficult to scale
- inconsistent
- overly custom
- dependent on one-off values

simplify it.

---

# 95. Design System First

Before creating a new interface pattern, check whether the design system already provides:

- component
- variant
- spacing
- color
- typography
- interaction pattern

Do not invent local patterns unnecessarily.

---

# 96. New Component Rule

Create a new component only when at least one is true:

- it will be reused
- it contains meaningful behavior
- it establishes an important product pattern
- it meaningfully reduces complexity

Do not componentize every wrapper.

---

# 97. AI Instructions When Generating UI

When an AI assistant creates or modifies UI, it must:

1. inspect existing components first
2. inspect existing design tokens
3. reuse established patterns
4. avoid introducing arbitrary values
5. avoid unnecessary dependencies
6. preserve accessibility
7. preserve responsive behavior
8. preserve information density
9. perform an AI-pattern review
10. simplify before finalizing

---

# 98. AI Must Not "Make It Prettier"

If asked to improve visual quality, do NOT automatically:

- add gradients
- add shadows
- increase radius
- increase padding
- add animations
- add icons
- add cards

Instead evaluate:

- hierarchy
- typography
- alignment
- density
- spacing
- consistency
- contrast
- component quality

Visual quality usually improves by fixing structure, not by adding decoration.

---

# 99. Preferred Refactoring Order

When improving an existing screen, use this order:

```text
1. Information architecture
2. Layout
3. Alignment
4. Hierarchy
5. Typography
6. Spacing
7. Density
8. Component consistency
9. Colors
10. Borders
11. Shadows
12. Animation
```

Do not begin with items 9–12.

---

# 100. Final Principle

The goal is not to create a UI that looks "designed."

The goal is to create a UI where the design feels inevitable.

A strong interface should make the user think:

> Of