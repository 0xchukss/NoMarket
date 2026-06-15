---
version: alpha
name: Sealed Vault
description: Private combinatorial prediction market. Dark, instrument-grade.
colors:
  primary: "#C6F24E"
  secondary: "#7C5CFF"
  tertiary: "#0A0B0D"
  neutral: "#E7E9EC"
  muted: "#878D99"
  positive: "#34D399"
  negative: "#F25C5C"
typography:
  h1:
    fontFamily: "Space Grotesk, Inter, sans-serif"
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 1rem
  mono:
    fontFamily: "JetBrains Mono, monospace"
rounded:
  sm: 4px
  md: 8px
  lg: 16px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#0A0B0D"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "#14161A"
    rounded: "{rounded.lg}"
---

# Sealed Vault

The design language for NoMarket, a private combinatorial prediction market.
The feel is dark and instrument-grade: a quiet trading terminal, not a
consumer app. Surfaces are near-black, type is precise, and color is rationed.

## Principles

- Dark by default. The base is `#0A0B0D`. Surfaces step up in small,
  deliberate increments so depth reads without glow or gloss.
- Color is signal, not decoration. Cipher Lime (`#C6F24E`) marks the single
  primary action on a view. Signal Violet (`#7C5CFF`) is reserved for
  encryption and privacy UI. Everything else is neutral.
- One accent per view. If two things compete for the lime, neither is primary.
- Instrument-grade type. Space Grotesk for display, Inter for body, JetBrains
  Mono for data, addresses, and any sealed or numeric value.

## Color

| Token    | Value     | Use                                   |
| -------- | --------- | ------------------------------------- |
| base     | `#0A0B0D` | Page background                       |
| surface  | `#14161A` | Cards and panels                      |
| input    | `#1E2127` | Inputs and inset fields               |
| border   | `#2A2E37` | Hairlines and dividers                |
| text     | `#E7E9EC` | Primary text                          |
| muted    | `#878D99` | Secondary text                        |
| accent   | `#C6F24E` | Primary CTA only                      |
| accent-2 | `#7C5CFF` | Encryption and privacy UI only        |
| positive | `#34D399` | Gains, confirmed, settled true        |
| negative | `#F25C5C` | Losses, errors, settled false         |

## Typography

- Display: Space Grotesk, weight 700, tight line height for headings.
- Body: Inter for prose and UI labels.
- Mono: JetBrains Mono for numbers, addresses, and sealed values.

## Shape and spacing

Radii are `sm 4px`, `md 8px`, `lg 16px`. Spacing steps `sm 8px`, `md 16px`,
`lg 24px`. Cards use the large radius; buttons and inputs use medium.
