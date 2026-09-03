---
name: Kinetic Obsidian
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#baccb0'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#85967c'
  outline-variant: '#3c4b35'
  surface-tint: '#2ae500'
  primary: '#efffe3'
  on-primary: '#053900'
  primary-container: '#39ff14'
  on-primary-container: '#107100'
  inverse-primary: '#106e00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#eeffe2'
  on-tertiary: '#033900'
  tertiary-container: '#7cf862'
  on-tertiary-container: '#0b7100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79ff5b'
  primary-fixed-dim: '#2ae500'
  on-primary-fixed: '#022100'
  on-primary-fixed-variant: '#095300'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#81fe67'
  tertiary-fixed-dim: '#65e04d'
  on-tertiary-fixed: '#012200'
  on-tertiary-fixed-variant: '#065300'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style

The design system is engineered for high-performance health and sports SaaS environments. It targets athletes, coaches, and data-driven users who require precision and speed. The visual language is rooted in a **Modern Technical** aesthetic, blending the high-contrast energy of performance gear with the refined minimalism of professional developer tools.

The brand personality is authoritative, energetic, and premium. It utilizes deep blacks and high-visibility neon accents to create a "heads-up display" (HUD) atmosphere. The UI remains unobtrusive to keep the focus on metrics and performance data, using whitespace not just for breathing room, but as a tool for structural clarity.

## Colors

This design system utilizes a high-contrast dark palette to reduce eye strain during intensive data monitoring and to evoke a premium "pro" feel.

- **Primary (#39FF14):** A "Neon Green" used exclusively for primary actions, success states, and critical performance peaks. It should be used sparingly to maintain its impact.
- **Surface Layers:** The background is pure `#000000` to ensure infinite depth on OLED screens. UI containers and cards use `#121212` (Zinc-950 equivalent) to create subtle separation.
- **Accents:** A darker forest green is used for hover states and secondary data visualizations to provide depth without competing with the primary action color.
- **Neutral/Borders:** Grays are kept in the Zinc/Slate family to maintain a cold, technical temperature.

## Typography

The typography strategy prioritizes legibility and technical precision. **Geist** is used for headings and UI labels to provide a clean, monolinear, and modern feel. **Inter** is utilized for body copy and long-form data due to its exceptional readability at small sizes.

For numeric data (heart rates, splits, timestamps), always enable tabular figures (`tnum`) to ensure columns of numbers align perfectly during real-time updates. Large display headings should use tight letter spacing to appear more "engineered" and impactful.

## Layout & Spacing

This design system uses a strict 4px grid system. Layouts follow a **Fluid-to-Fixed** hybrid model: 
- **Desktop:** A 12-column grid with a maximum width of 1280px, centered in the viewport.
- **Tablet:** An 8-column grid with 24px side margins.
- **Mobile:** A 4-column grid with 16px side margins.

Data-heavy dashboards should utilize a "bento-box" layout style, where components are grouped into logical containers of varying sizes that reflow based on screen width. Use `md` (16px) as the standard padding for cards and `lg` (24px) for section spacing.

## Elevation & Depth

In a pure black environment, traditional shadows are ineffective. Elevation is conveyed through **Tonal Layering** and **Subtle Outlines**:

1.  **Level 0 (Base):** `#000000` - Used for the main application background.
2.  **Level 1 (Card/Surface):** `#121212` - Used for primary UI containers.
3.  **Level 2 (Popovers/Modals):** `#18181B` - Used for elements that sit on top of cards.

All elevated elements must feature a 1px border using `#27272A` (Zinc-800) to define their edges. For high-priority elements like active modals, a very subtle, diffused glow of the primary color (opacity 5-10%) can be applied as an outer shadow to simulate a light-emitting display.

## Shapes

The shape language is "Soft-Technical." While the system feels precise, it avoids harsh 0px corners to remain approachable and modern. 

- **Buttons & Inputs:** Use the standard `rounded-md` (0.5rem) for a balanced look.
- **Cards & Dashboard Widgets:** Use `rounded-lg` (1rem) to create clear visual containment.
- **Status Pills:** Always use full-round (pill) shapes for status indicators (e.g., "Active", "Complete").

## Components

### Buttons
- **Primary:** Background `#39FF14`, Text `#000000`. Bold weight. No shadow, or a slight neon outer glow on hover.
- **Secondary:** Border 1px `#27272A`, Background transparent. Text `#FFFFFF`.
- **Ghost:** Transparent background, text `#A1A1AA`. Becomes `#FFFFFF` on hover.

### Input Fields
Inputs should be minimal. Use a background of `#09090B` (Zinc-950) with a 1px border of `#27272A`. On focus, the border transitions to the primary neon green, and a subtle 2px outer glow is applied.

### Cards
Cards are the primary container. Use `#121212` background with a 1px border. Titles within cards should be in `label-caps` typography to denote technical categories.

### Chips & Badges
Small, low-profile badges. For health metrics, use a secondary background (e.g., dark green at 10% opacity) with the primary neon green for the text.

### Progress Bars & Charts
Charts should use a "Glow-line" style. The primary data line should have a subtle drop-shadow of the same color to create a "lit" effect against the black background. Grid lines in charts must be kept at very low contrast (`#18181B`).