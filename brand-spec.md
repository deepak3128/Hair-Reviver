# Hair Reviver — CRM Design System

Clinic brand: professional, trustworthy, warm, premium — healthcare-adjacent booking tool for a hair patch clinic. Not cold, not gimmicky.

## Color tokens (OKLch)

| Token | Value | Use |
|---|---|---|
| `--bg` | `oklch(0.972 0.006 90)` | App canvas (warm off-white) |
| `--surface` | `oklch(1 0 0)` | Cards, panels |
| `--surface-2` | `oklch(0.983 0.005 90)` | Subtle fills, hover |
| `--fg` | `oklch(0.27 0.02 90)` | Primary text (warm ink) |
| `--muted` | `oklch(0.5 0.015 90)` | Secondary text |
| `--faint` | `oklch(0.6 0.012 90)` | Captions, table headers |
| `--border` | `oklch(0.905 0.008 88)` | Hairline borders |
| `--border-strong` | `oklch(0.82 0.012 88)` | Stronger borders |
| `--accent` | `oklch(0.52 0.105 172)` | Emerald — primary CTA, active nav |
| `--accent-strong` | `oklch(0.44 0.105 172)` | Accent hover |
| `--accent-soft` | `oklch(0.94 0.03 172)` | Accent tints |
| `--warn` / `--warn-soft` | `oklch(0.58 0.13 60)` / `oklch(0.95 0.045 85)` | Amber — low stock, due today, partial |
| `--danger` / `--danger-soft` | `oklch(0.52 0.18 26)` / `oklch(0.955 0.028 26)` | Red — overdue, pending, no-show |
| `--blue` / `--blue-soft` | `oklch(0.55 0.1 250)` / `oklch(0.94 0.028 250)` | Neutral scheduled state |

One accent per screen, max twice. Emerald = action. Amber = attention. Red = urgency.

## Typography

- Display: **Sora** (500/600/700) — headings, KPI values, big numbers.
- Body: **Instrument Sans** (400/500/600) — all UI text, tables.
- Mono: **IBM Plex Mono** (400/500) — amounts, batch codes, invoice/SKU IDs.

## Posture rules

- Generous whitespace; cards are white on warm neutral canvas with hairline borders and restrained shadows.
- Professional medical-salon feel: soft avatar hues, rounded corners (12–16px), never playful or glossy.
- High legibility: body 14–15px, table labels 11px uppercase, contrast ≥ 4.5:1 for normal text.
- Hover shifts background by ±0.06–0.12 L on OKLch; foreground never gets lighter.
- Every focusable element has a clear `:focus-visible` ring.
