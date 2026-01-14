# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Or import in CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
```

## Font Usage

### DM Sans (Headings & Body)
- **Usage:** All UI text including headings, body text, labels, buttons
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Style:** Clean, modern, highly readable geometric sans-serif

```css
font-family: 'DM Sans', sans-serif;
```

### IBM Plex Mono (Code/Technical)
- **Usage:** Code snippets, technical data, monospaced content
- **Weights:** 400 (regular), 500 (medium), 600 (semibold)
- **Style:** Clean monospace with good readability

```css
font-family: 'IBM Plex Mono', monospace;
```

## Tailwind Configuration

If using Tailwind CSS, configure your fonts:

```js
// tailwind.config.js (v3) or CSS (v4)
fontFamily: {
  sans: ['DM Sans', 'system-ui', 'sans-serif'],
  mono: ['IBM Plex Mono', 'monospace'],
}
```

## Typography Scale

The components use these common text sizes:
- `text-xs` — 12px, labels, badges
- `text-sm` — 14px, secondary text, descriptions
- `text-base` — 16px, body text
- `text-lg` — 18px, section headers
- `text-xl` — 20px, page titles

Font weights:
- `font-normal` — 400, body text
- `font-medium` — 500, emphasis, labels
- `font-semibold` — 600, headings, buttons
