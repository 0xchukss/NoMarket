# NoMarket — Brand & Design System

---

## A. Brand Core

**What it is:** A private combinatorial prediction market on Ethereum Sepolia. Users build Boolean logic bets across multiple events, encrypt their position using Zama FHE before it hits the chain, and settle outcomes through UMA's optimistic oracle. The chain only sees the stake amount. Nobody sees the bet.

**The core tension:** Public market, private position. You bet in the open — but no one knows what you're betting on.

**Existing tagline (keeper):** "Everyone sees the stake. No one sees the bet."

**Positioning:** The only prediction market where your intelligence is actually yours.

**Brand personality:**
- Cryptic but confident
- Ancient oracle meets zero-knowledge cryptography
- Speaks in certainty, not hype
- Premium, sparse, unhurried
- Feels like a private intelligence terminal, not a casino

**Target users:**
- Crypto-native traders who want position privacy
- Sophisticated bettors who don't want to telegraph their thesis
- FHE/ZK-curious builders and researchers
- DeFi users tired of frontrunning and information leakage

**Emotional hook:** The feeling of knowing something no one else knows — and keeping it that way.

**What makes it memorable:** Every other prediction market shows your position. This one hides it by design, at the cryptographic level, before it ever touches the chain.

---

## B. Naming

The name "NoMarket" is set. Work with it, not against it.

**How to read it:**
- "No" as in: no visibility, no leakage, no one can see
- "Market" as in: it is still a real market with real stakes
- Together: a market where nothing is visible — cryptographically enforced

**Product sub-names to use:**
- **Atoms** — binary true/false events that compose a market (already in the codebase)
- **The Oracle** — the resolution engine (UMA + the automated bot)
- **The Veil** — the encryption layer (Zama FHE); good for marketing language
- **Expression** — the Boolean claim a user builds before encrypting

---

## C. Recommended Brand Direction

**Direction: Ancient Oracle meets Cipher Terminal**

The design already has the bones of this: deep black background, gold accent, serif display type, a grid overlay, and radial glows. Lean into it fully. The vibe is "a Renaissance-era oracle who runs on cryptographic proofs." Timeless, private, weighty.

Avoid:
- Neon/cyberpunk (too generic crypto)
- Clean SaaS minimalism (too cold)
- Casino aesthetics (wrong energy entirely)
- Gradient-heavy hero sections

Go toward:
- Stone and gold textures in backgrounds
- Mathematical formulas drifting in the background at low opacity (already in the code as `.oracle-formula-veil`)
- Candle charts with gold/purple glow
- Serif headings with warm text shadows
- Grid overlays at low opacity

---

## D. Logo Direction

**Current state:** "NoMarket" as plain serif text with a gold glow. Works at large sizes, no icon mark.

**Recommended icon mark:** A candlestick (OHLC bar) where the upper half fades into encrypted noise — pixel scatter or dot pattern. The bottom (visible stake) is solid gold. The top (encrypted position) dissolves into purple dots. This captures the core concept in a single glyph.

**Wordmark treatment:**
- Font: Georgia or a premium serif (like Cormorant Garant or Libre Baskerville)
- Color: #f4efe4 (warm off-white) with gold text-shadow
- Letter-spacing: tight, no tracking
- Case: "NoMarket" — mixed case, not all-caps, not lowercase

**Logo lockups:**
1. Icon + wordmark (horizontal) — for headers and social
2. Icon only — for favicons, app icons, small contexts
3. Wordmark only — for slide decks and footers

**Logo don'ts:**
- No rounded logo containers
- No colorful backgrounds behind the mark
- Never use on a light background — this brand lives in the dark

---

## E. Color + Typography System

### Color Palette (already established in globals.css, documented here)

| Token | Hex | Use |
|---|---|---|
| `--oracle-bg` | `#07090c` | Page background |
| `--oracle-ink` | `#f4efe4` | Primary text, warm off-white |
| `--oracle-muted` | `#a9aaa6` | Secondary text, labels |
| `--oracle-gold` | `#d9a65c` | Primary accent, icons, borders |
| `--oracle-gold-bright` | `#f4d58d` | Active states, data callouts, hover |
| `--oracle-purple` | `#a855f7` | Secondary accent, encrypted state, FHE indicator |
| `--oracle-milk` | `#efe7d8` | Softer text on dark backgrounds |
| `--oracle-panel` | `rgba(15, 22, 24, 0.66)` | Card/panel background |
| Emerald | `#8ef0b8` | Success, YES outcome, TRUE atom |
| Red | `#ffabab` | Error, NO outcome, FALSE atom |
| Amber | `#f4d58d` | Warning, scheduled state, pending |

**Color meaning:**
- Gold = the visible layer (public stake, on-chain data)
- Purple = the encrypted layer (Zama FHE, private position)
- Emerald = truth / resolved TRUE
- Red = false / resolved FALSE
- The split between gold and purple is the entire product concept made visible

### Typography

**Display / Headings:** Georgia, "Times New Roman", ui-serif — already set as `--oracle-serif`
- Use for: page titles, market titles, panel headers, the logo
- Weight: 700-900
- Never italic in UI contexts

**Data / Labels / Code:** SFMono-Regular, Consolas, ui-monospace — already set as `--oracle-mono`
- Use for: prices, percentages, addresses, timestamps, nav links, kicker text
- Weight: 700-800 for important data, 400-500 for secondary
- Uppercase with tracking for section labels: `text-[0.68rem] font-black uppercase tracking-wide`

**Body:** Inter, system-ui — for prose explanations, tooltips, longer descriptions

**Type scale in use:**
- Hero h1: `clamp(3.4rem, 8vw, 7.2rem)` — serif
- Page h1: `clamp(2rem, 4vw, 3.1rem)` — serif
- Panel h2: `1.05rem` — serif
- Kicker: `0.72rem` — mono, uppercase
- Label: `0.68-0.74rem` — mono, uppercase
- Body: `0.82-0.86rem` — Inter

### Background System (3 layers)

1. **Basalt texture** — `oracle-basalt.png`, dark stone grain, provides organic warmth
2. **Gradient overlay** — radial gold glow at 48% top, radial purple at 72% — represents the two encryption layers
3. **Grid overlay** — 72px lines at 8% opacity, masked to fade at top and bottom — the mathematical substrate

This 3-layer system should be preserved everywhere. Never use a flat background.

---

## F. Mascot Concept

**Name: VEIL**

**What VEIL is:** A hooded, abstract oracle figure. Not a person — more of an entity. The hood dissolves at the edges into cipher patterns and floating boolean symbols (AND, OR, NOT). The face is obscured — not hidden by shadow, but by encryption. Where eyes would be, there are two glowing cipher glyphs. The expression reads as "I know, but I'm not telling."

**Shape language:**
- Hooded silhouette — triangular top, slightly asymmetric
- Simple geometry — no fine details, can work at 24px or 1200px
- The hood's edge dissolves into: `∧ ∨ ¬ 0 1` symbols at low opacity
- Eyes: two glowing points — left one is gold (#f4d58d), right one is purple (#a855f7)
- No mouth — VEIL speaks through the market

**Personality:**
- Calm and ancient
- Knows the outcome before anyone else but commits to silence
- Not sinister — more like a referee who can't reveal anything mid-game
- Occasionally curious (tilted head for loading states)

**Expressions:**
1. Neutral — both eyes glow steadily (default)
2. Encrypting — eyes pulse, cipher patterns swirl outward
3. Watching — one eye larger, leaning forward slightly
4. Resolved — eyes form checkmarks or X marks
5. Error — both eyes flicker red briefly

**How VEIL appears in the product:**
- Empty states: small VEIL silhouette with a speech bubble showing the empty state message
- Loading: VEIL with swirling cipher patterns around the hood
- Bet encryption: animated VEIL with particles flowing from the user into the cipher field
- Resolution panel: large VEIL holding a scale — left pan shows the atom outcomes, right pan shows the user's encrypted bet
- Onboarding: 3-step illustrated sequence with VEIL guiding the user

**VEIL in pitch decks:**
- Slide 1 (cover): Large VEIL silhouette, hood dissolving upward into cipher noise, "NoMarket" below
- Slide 3 (problem): Split screen — left side shows a transparent fish tank (Polymarket-style visible bets), right side shows VEIL with an opaque vault
- Slide 5 (how it works): VEIL with a 3-step diagram flowing through the hood

---

## G. Product UX Flow

### User Journey

```
Landing → Connect Wallet → Browse Markets → Market Detail
  → Build Expression (ExpressionBuilderUI)
  → Enter Stake
  → Encrypt with Zama FHE (VEIL animation)
  → Sign Transaction
  → Bet Confirmed
  → History (outcome pending)
  → Market Resolves (UMA oracle)
  → Claim / Result
```

### Page Inventory

| Page | Route | Status |
|---|---|---|
| Landing / Hero | `/` | Built — solid |
| Market Listing | `/markets` | Built — solid |
| Create Market | `/create` | Built — solid |
| Market Detail | `/market/[id]` | Built — has gaps (see audit) |
| History | `/history` | Built — solid |

### Key UX Gaps to Fill

**1. Resolution Panel (highest priority)**
`UmaResolutionPanel` (line 1227) runs all its logic but returns `null`. Users can't see:
- Current bot status (scheduled / watching / proposed / resolved)
- UMA assertion ID when proposed
- Dispute window countdown
- Final outcome vector
- Proposal and resolution transaction links

Design needed: A status panel with 4 states:
- Scheduled: clock icon, resolution time countdown, bot message
- Watching: pulsing dot, "Bot is monitoring this market"
- Proposed: UMA logo, assertion ID (truncated, copyable), dispute window countdown
- Resolved: outcome vector display, binary breakdown by atom, settlement transaction link

**2. FAQ Accordion**
Already built at line 1458, just not wired into the page. Drop it into the detail page left column below `RulesSection`. No new code needed — just add `<FAQAccordion />` to the JSX.

**3. RulesSection interactivity**
The "Rules" and "Market Context" tab buttons need click handlers. "Market Context" tab should reveal: the atom list's UMA question text, the resolver identity, the liveness period. "Show more" should expand the full privacy explanation.

**4. Bet form reset**
After `status === "submitted"`, add a 4-second delay then reset to `"idle"` so users can place another bet. Or show a "Place another bet" button alongside the transaction link.

### Empty States

Every empty state should follow this pattern:
- VEIL silhouette (small, ~48px, low opacity)
- One-line statement in serif: "No markets yet."
- One-line context in mono: "Create one or check back later."

### Loading States

Use `oracle-kicker` style text pulsing: `"Loading encrypted history..."` in mono. Do not use spinners — use the pulsing gold dot already established in the design system.

---

## H. Landing Page Direction

### Current Structure (already built)
1. Hero: headline + subtext + 2 CTAs + OracleNodeMap widget
2. Proof strip: Zama FHE / Arc beta / UMA resolution
3. Landing cards: 3 market cards from live/mock data

### What to Add or Improve

**Above the fold:**
- Hero headline is good: "Private Markets For Combinatorial Outcomes"
- Tagline is good: "Everyone sees the stake. No one sees the bet."
- Add a sub-kicker below: `ZAMA FHE · UMA ORACLE · SEPOLIA BETA` in mono caps

**Section 2 — The Split (new)**
A two-column visual showing:
- Left: "What the chain sees" — `{ publicStake: 2.0 ETH, bettor: 0x...abc }` in a monospace code block styled like a contract call
- Right: "What only you know" — the full expression: `(BTC > 70k) AND (ETH mainnet upgrade)` — but shown as cipher noise to anonymous users, revealed only to the wallet owner

This is the core product concept in a single visual. It should be built as an SVG or code component — no images.

**Section 3 — How It Works (3 steps)**
Already partially in `LandingCards`. Refine:
1. Build Boolean atoms across any on-chain or off-chain events
2. Encrypt your full expression with Zama FHE before it leaves your browser
3. Settle outcomes automatically through UMA's optimistic oracle

**Footer:**
Already has: contract address + Etherscan link + UMA oracle detail.
Add: GitHub link, Zama credit, Arc credit.

---

## I. Pitch Deck Visual Direction

**Theme:** "The Oracle's Chamber" — dark stone room lit by candlelight, every surface covered in mathematical proofs and cipher text.

### Slide-by-Slide

**Slide 1 — Cover**
Black background. Large "NoMarket" in serif centered. Below: "Private Combinatorial Prediction Markets" in mono. VEIL silhouette faint in the background, hood dissolving upward.

**Slide 2 — The Problem**
Split screen. Left side: a glowing fishbowl labeled "Every other prediction market" — user positions visible, MEV bots circling. Right side: VEIL standing in front of a sealed vault. No text heavy — let the visual do it.

**Slide 3 — The Mechanism (one sentence)**
"Your bet is encrypted with Zama FHE before it ever reaches the chain."
Show a 3-step flow diagram:
`Expression Builder` → `FHE Encryption` → `On-chain Bet (public stake only)`

**Slide 4 — The Stack**
Three tech pillars in the oracle panel style:
- Zama FHE — the encryption layer
- UMA Optimistic Oracle — the resolution layer
- Sepolia / Arc — the execution layer

**Slide 5 — Demo**
Screenshot of the market detail page with the `CombiTradePanel` active. Callout arrows pointing to: encrypted expression, public stake input, FHE status.

**Slide 6 — Why Now**
FHE is production-ready for the first time. Zama's FHEVM makes it deployable on EVM. This is the first private prediction market with cryptographic position hiding, not just obscurity.

**Slide 7 — The Ask / What's Next**
- Smart contract audit
- Mainnet deployment
- Resolver bot infrastructure
- More atom types (price feeds, governance, sports)

---

## J. Image Generation Prompts

**VEIL mascot:**
> "A minimalist hooded oracle figure, abstract and geometric, hood dissolving at the edges into floating boolean symbols (AND, OR, 0, 1), two glowing eyes — left eye gold #f4d58d, right eye violet #a855f7, no face visible, dark obsidian background, vector art style, clean lines, no gradients, suitable for a web3 prediction market brand"

**Hero background texture:**
> "Dark volcanic basalt stone surface, very close up, subtle grain texture, almost black with warm dark brown undertones, smooth and uniform, suitable for a website background, no patterns, no text, 4k resolution"

**Split-screen product visual:**
> "Two-panel illustration, left panel: glowing fishbowl with small human figures inside labeled 'visible bets', transparent, green surveillance lighting; right panel: black sealed vault with gold cipher text on the door, dramatic contrast, minimalist vector style, dark background"

**Oracle node map:**
> "Abstract network diagram, nodes connected by thin gold lines, dark navy background, nodes are small circles glowing gold and violet, floating mathematical symbols between nodes, network represents encrypted data flow, SVG-style illustration"

**VEIL in resolution state:**
> "The VEIL oracle mascot holding an old brass balance scale, left pan contains floating 0s and 1s representing atom outcomes, right pan contains a glowing sealed envelope representing encrypted bet, dramatic lighting, dark background, gold and violet color scheme, vector illustration"

---

## K. Final Creative Recommendation

**Keep everything in the CSS — it's already good.** The existing design system in `globals.css` is the strongest part of this project. The oracle theme, the serif + mono type pairing, the gold + purple duality, the grid overlay, the radial glows — all of it is coherent and premium. Don't redesign it.

**What to build now, in order:**

1. **UmaResolutionPanel UI** — the biggest frontend gap. Build a 4-state status panel (scheduled, watching, proposed, resolved) that surfaces the data this component is already fetching. Use the existing `oracle-atom-result` badge style for status. Use gold for pending/watching, purple for proposed (UMA dispute window), emerald for resolved.

2. **Wire FAQAccordion into the detail page** — one line of JSX. The component is done.

3. **Wire up RulesSection tabs** — "Market Context" tab reveals atom resolution rules. "Show more" expands the full FHE privacy explanation. Two click handlers, ~20 lines of state.

4. **Bet form reset after submission** — 4 seconds after `status === "submitted"`, reset to idle. Let the transaction link persist in a success state below the form.

5. **VEIL empty states** — replace the current plain text empty states with the VEIL silhouette + two-line structure. Use an inline SVG so it works without assets.

**What NOT to change:**
- The color system
- The background stack (basalt + gradients + grid)
- The font pairing
- The `oracle-*` CSS class system
- The gold wallet button style

The brand direction is set. Execution is what's missing.
