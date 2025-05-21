# Approved Color Pairings

This document lists all approved color pairings for the GitPulse application, along with their WCAG contrast ratios and compliance status.

## WCAG Standards

The Web Content Accessibility Guidelines (WCAG) 2.1 defines minimum contrast ratios:

| Level | Normal Text | Large Text |
|-------|------------|------------|
| AA    | 4.5:1      | 3:1        |
| AAA   | 7:1        | 4.5:1      |

- **Normal Text**: Less than 18pt, or less than 14pt if bold
- **Large Text**: 18pt or larger, or 14pt or larger if bold

## Color Contrast Utility

All contrast calculations use the centralized utility at `src/lib/accessibility/colorContrast.ts`.

## Approved Pairings

### Dark Theme

| Name | Foreground | Background | Context | Ratio | Required | Status |
|------|------------|------------|---------|-------|----------|--------|
| Primary Text on Dark Background | var(--foreground)<br/>#1b2b34 | var(--background)<br/>#f8f9fa | Main body text, headers, and general content | 13.82:1 | AA (normal) | ✅ Pass |
| Primary Text on Secondary Background | var(--foreground)<br/>#1b2b34 | var(--background-secondary)<br/>#ffffff | Text on card backgrounds, modals, and secondary surfaces | 14.57:1 | AA (normal) | ✅ Pass |
| Neon Green Text on Dark Slate | #00803d<br/>#00803d | var(--background)<br/>#f8f9fa | Primary buttons, interactive elements, and accent text | 4.79:1 | AA (normal) | ✅ Pass |
| White Text on Electric Blue | #ffffff<br/>#ffffff | #1a4bbd<br/>#1a4bbd | Secondary buttons, active states, and highlighted elements | 7.54:1 | AA (normal) | ✅ Pass |
| Dark Slate Text on Neon Green | #0c1821<br/>#0c1821 | var(--accent-primary)<br/>#00994f | Button hover states, inverted accent elements | 4.85:1 | AA (normal) | ✅ Pass |
| Warning Text on Dark Background | #a26100<br/>#a26100 | var(--background)<br/>#f8f9fa | Warning messages, alerts, and cautionary UI elements | 4.69:1 | AA (normal) | ✅ Pass |
| Error Text on Dark Background | #c22f2f<br/>#c22f2f | var(--background)<br/>#f8f9fa | Error messages, validation states, and error indicators | 5.32:1 | AA (normal) | ✅ Pass |
| Large Neon Green Text on Dark Slate | #00994f<br/>#00994f | var(--background)<br/>#f8f9fa | Large headings, hero text, and prominent display text | 3.51:1 | AA (large) | ✅ Pass |
| Electric Blue Text on Dark Slate | var(--accent-secondary)<br/>#2563eb | var(--background)<br/>#f8f9fa | Links, secondary accent text, and interactive hints | 4.90:1 | AA (normal) | ✅ Pass |
| High Contrast Body Text | var(--foreground)<br/>#1b2b34 | var(--background)<br/>#f8f9fa | Maximum readability for extended reading | 13.82:1 | AAA (normal) | ✅ Pass |

## ✅ All Pairings Compliant

All defined color pairings meet their specified WCAG requirements.

## Usage

When implementing UI components, use only the approved color pairings listed above. For new color combinations, add them to `docs/color-pairings.config.json` and regenerate this documentation.

## Updating This Document

This document is automatically generated. To update:

1. Edit `docs/color-pairings.config.json`
2. Run `npm run generate-color-docs`
3. Commit both files

Generated on: 2025-05-21T22:23:26.262Z
