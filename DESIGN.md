# NoBucks — Design Notes

NoBucks (formerly Clover) follows the **company-wide design system**: see [`Company-Design-System.md`](https://github.com/miguelmorales95/SomeDude_Company/blob/main/Company-Design-System.md) (the source of truth for shared color tokens, typography, spacing/radius, motion, components, and accessibility). NoBucks's own token file (`src/styles.css`) is the system's reference implementation.

## NoBucks's personality within the system
- **Mood:** cozy, playful, Animal Crossing-style; a neighborhood that runs on kindness, not cash.
- **Theme:** light, nature-forward, with full dark-mode token overrides: coral `--accent`, teal, leaf green.
- **Brand mark:** 🌱 with the lowercase wordmark "nobucks" in the header.
- **Currency:** **sprouts** (≈ 1 sprout per hour of help). Never show money imagery ($, coins, bills) for sprouts.
- **Characters:** cute humans and animals (cat, dog, bear, rabbit, fox, frog, bird). **No deer**: it's a no-bucks town. Check new species against this rule.
- **Tone:** warm, neighborly, encouraging; celebrate helping, never transactions.

## Signature moments
- Holographic village trading cards and wandering villagers are the brand's "signature joy". Keep them, honor `prefers-reduced-motion`, and keep everyday screens calm.
- Trust rings on avatars always carry text as well as color.

## Local businesses ("village shops")
If businesses join, they appear as shop buildings in the village with offers and events. They buy **visibility, never sprouts**: no UI should let a business buy, earn, or redeem the currency (see the revenue timeline's barter-exchange note).

## Trust patterns
Reports, "please check this" labels, and verification follow the shared patterns in the design system's §8b.

See also the [Company Roadmap & Launch Plan](https://github.com/miguelmorales95/SomeDude_Company/blob/main/Company-Roadmap-and-Launch-Plan.md) for where NoBucks sits in the launch sequence.
