# Tailwind Color Configuration

## Color Choices

- **Primary:** `emerald` — Used for buttons, links, active states, success indicators
- **Secondary:** `amber` — Used for warnings, expiration alerts, urgent items
- **Neutral:** `slate` — Used for backgrounds, text, borders, inactive states

## Usage Examples

### Primary (Emerald)
```css
/* Buttons */
bg-emerald-600 hover:bg-emerald-700 text-white

/* Links */
text-emerald-600 hover:text-emerald-700 dark:text-emerald-400

/* Active nav item */
text-emerald-700 dark:text-emerald-400

/* Success badge */
bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400

/* Unread indicator */
bg-emerald-500 dark:bg-emerald-400
```

### Secondary (Amber)
```css
/* Warning/urgent badge */
bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400

/* Expiring soon indicator */
text-amber-600 dark:text-amber-400

/* Warning banner */
bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50
```

### Neutral (Slate)
```css
/* Page background */
bg-slate-50 dark:bg-slate-900

/* Card background */
bg-white dark:bg-slate-800

/* Primary text */
text-slate-900 dark:text-white

/* Secondary text */
text-slate-600 dark:text-slate-400

/* Muted text */
text-slate-500 dark:text-slate-500

/* Borders */
border-slate-200 dark:border-slate-700

/* Inactive nav */
text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300
```

## Dark Mode

All components use Tailwind's `dark:` variant for dark mode support. The design uses:
- Light mode: White/slate-50 backgrounds with slate text
- Dark mode: Slate-900/slate-800 backgrounds with white/slate-300 text

Ensure your app has dark mode properly configured in Tailwind.
