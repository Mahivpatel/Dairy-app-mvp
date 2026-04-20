---
name: doodh-ui
description: >
  Design system and UI building guide for Doodh.app — a dairy milk ledger app built in
  Next.js 14 with Tailwind CSS and shadcn/ui. Use this skill for ANY UI task in the
  Doodh project: building new pages, adding components, styling existing pages, or
  reviewing UI consistency. Also use it whenever the user asks about layout, colors,
  fonts, buttons, cards, or any visual element in the app — even if they don't say
  "design system" explicitly. The goal is to ensure every page feels like the same app:
  warm, Indian, mobile-first, and clean.
---

# Doodh UI Design System

## Core Philosophy

Every screen in Doodh should feel like it belongs to the same family. The aesthetic is
**warm, trustworthy, and rooted in an Indian context** — saffron, earthy greens, cream
backgrounds, and generous whitespace. The owner uses this on a phone behind a dairy
counter. Customers open their link on a phone in their kitchen. Everything must work
beautifully on a small screen first.

---

## Color Tokens

Always use these Tailwind classes. Never hardcode hex values in components.

| Role | Tailwind class | Hex | Usage |
|---|---|---|---|
| Primary | `amber-400` / `amber-500` | #F59E0B / #F59E0B | Buttons, active states, highlights |
| Primary dark | `amber-600` | #D97706 | Button hover, pressed |
| Primary light | `amber-50` | #FFFBEB | Card backgrounds, soft highlights |
| Success / Green | `green-600` | #16A34A | Paid badge, purchase day in calendar |
| Success light | `green-50` | #F0FDF4 | Paid card backgrounds |
| Danger | `red-500` | #EF4444 | Suspend, delete, unpaid overdue |
| Neutral text | `gray-900` | #111827 | Headings |
| Subtext | `gray-500` | #6B7280 | Secondary labels, metadata |
| Border | `gray-200` | #E5E7EB | Card borders, dividers |
| Background | `stone-50` | #FAFAF9 | Page background (warm, not cold white) |
| Surface | `white` | #FFFFFF | Cards, modals |

**Important:** Use `bg-stone-50` for page backgrounds, not `bg-white` or `bg-gray-50`.
This gives the warm, slightly creamy feel consistent with the Indian aesthetic.

---

## Typography

| Element | Classes |
|---|---|
| Page title | `text-xl font-bold text-gray-900` |
| Section heading | `text-base font-semibold text-gray-900` |
| Body text | `text-sm text-gray-700` |
| Label / caption | `text-xs text-gray-500` |
| Amount / number | `text-sm font-semibold tabular-nums` |
| Large amount | `text-2xl font-bold tabular-nums text-gray-900` |

Always use `tabular-nums` for rupee amounts and bag counts so numbers don't shift width.

---

## Spacing & Layout

This is a **mobile-first app**. Default layout rules:

- Page padding: `px-4 py-5` on all pages
- Max width: `max-w-md mx-auto` — keeps content centred on larger screens without
  stretching uncomfortably
- Section gap: `space-y-4` between major sections
- Card internal padding: `p-4`
- Never use horizontal scroll — every element must fit within `100vw`

---

## Component Patterns

### Page Shell

Every page (owner and customer) wraps content in this shell:

```tsx
<div className="min-h-screen bg-stone-50">
  <div className="max-w-md mx-auto px-4 py-5 space-y-4">
    {/* page content */}
  </div>
</div>
```

### Page Header

Used at the top of every owner dashboard page:

```tsx
<div className="flex items-center justify-between mb-2">
  <div>
    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
  {/* optional right action, e.g. settings icon */}
</div>
```

### Cards

Standard content card:

```tsx
<div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
  {/* content */}
</div>
```

Highlighted card (e.g. current month summary):

```tsx
<div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
  {/* content */}
</div>
```

Paid / success card:

```tsx
<div className="bg-green-50 rounded-2xl border border-green-200 p-4">
  {/* content */}
</div>
```

### Buttons

Primary action (e.g. Mark as Paid, Record Sale):

```tsx
<button className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600
  text-white font-semibold py-3 rounded-xl transition-colors">
  Label
</button>
```

Secondary / ghost action:

```tsx
<button className="w-full border border-gray-200 bg-white hover:bg-gray-50
  text-gray-700 font-medium py-3 rounded-xl transition-colors">
  Label
</button>
```

Danger action (suspend, delete):

```tsx
<button className="w-full bg-red-500 hover:bg-red-600
  text-white font-semibold py-3 rounded-xl transition-colors">
  Label
</button>
```

**Rule:** All full-width buttons use `rounded-xl` and `py-3`. Never use square corners.

### Stat / Summary Strip

Used in the ledger summary and dashboard overview:

```tsx
<div className="grid grid-cols-3 gap-3">
  {[
    { label: 'Total Bags', value: '62' },
    { label: 'Amount Due', value: '₹1,240' },
    { label: 'Status', value: 'Pending' },
  ].map(stat => (
    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <p className="text-xs text-gray-500">{stat.label}</p>
      <p className="text-sm font-semibold tabular-nums text-gray-900 mt-0.5">{stat.value}</p>
    </div>
  ))}
</div>
```

### Badges

```tsx
// Paid
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
  font-medium bg-green-100 text-green-700">Paid</span>

// Pending
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
  font-medium bg-amber-100 text-amber-700">Pending</span>

// Suspended
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
  font-medium bg-red-100 text-red-700">Suspended</span>
```

### List Rows (Customer list, purchase log)

```tsx
<div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
  {items.map(item => (
    <div key={item.id} className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{item.name}</p>
        <p className="text-xs text-gray-500">{item.meta}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{item.value}</p>
        {/* badge here */}
      </div>
    </div>
  ))}
</div>
```

### Calendar Grid (Ledger / Purchase Calendar)

31-cell grid, one cell per day. Green = purchase exists that day.

```tsx
<div className="grid grid-cols-7 gap-1.5">
  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
    const has = purchaseDays.has(day)
    return (
      <div key={day}
        className={`aspect-square flex flex-col items-center justify-center
          rounded-lg text-xs font-medium
          ${has
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-gray-100 text-gray-400'
          }`}
      >
        <span>{day}</span>
        {has && <span className="text-[9px] text-green-600">{bagsOnDay[day]}b</span>}
      </div>
    )
  })}
</div>
```

### Empty State

When a list or section has no data:

```tsx
<div className="text-center py-10 text-gray-400">
  <p className="text-sm">No records yet</p>
</div>
```

### Loading State

Keep it minimal — a pulsing skeleton, not a spinner:

```tsx
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-gray-200 rounded w-3/4" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

---

## shadcn/ui Component Usage

When using shadcn/ui components, always override their default colours to match the
design system above. Key overrides:

- `Button` variant `default` → override with `bg-amber-400 hover:bg-amber-500 text-white`
- `Badge` → use the colour classes from the badge section above instead of default variants
- `Card` → use `rounded-2xl shadow-sm border-gray-200` override
- `Select` / `Input` → add `rounded-xl border-gray-200 focus:ring-amber-400`

---

## Page-Specific Guidance

### Owner Dashboard (`app/dashboard/page.tsx`)

Structure:
1. Header — dairy name + greeting
2. Amber summary card — today's total bags recorded, this month's pending amount
3. "Quick actions" row — two buttons: "Record Sale" and "View Customers"
4. Pending payments list — customers with unpaid ledgers this month, sorted by amount

The dashboard should feel like a shop owner's morning glance — fast, numbers-forward,
no clutter.

### Customer Portal (`app/customer/[qrId]/page.tsx`)

Structure:
1. Header — dairy name at top (small), customer name large
2. QR code card — centred, white card, with "Show this to owner" caption
3. This month's summary strip — bags, amount due, status badge
4. Purchase calendar — current month
5. Profile edit link at the bottom (small, secondary style)

The customer portal should feel reassuring and simple. The customer just needs to see
their QR and their balance. No unnecessary elements.

**Suspended screen**: Full-page centred message in red-50 background. Show dairy name,
"Account suspended" heading, and a "Contact your dairy owner" line with their phone number.

---

## Consistency Rules (Always follow these)

1. **Border radius** — `rounded-xl` for buttons, `rounded-2xl` for cards. Never `rounded-md` or `rounded-lg` in this app.
2. **No harsh white backgrounds** — page bg is always `stone-50`, cards are `white`.
3. **Rupee symbol** — always use `₹` (not Rs. or INR) directly before the number with no space.
4. **Amounts** — always use `tabular-nums` and format with Indian comma style e.g. `₹1,240` not `₹1240`.
5. **Shadows** — only `shadow-sm` on cards. Never `shadow-md` or `shadow-lg` — the design is flat-light, not heavy.
6. **Icons** — use `lucide-react` only. Keep icons `size={16}` inline with text, `size={20}` for standalone actions.
7. **Fonts** — no custom fonts. Tailwind default (Inter / system-ui) is clean and loads fast on mobile.
8. **Full-width buttons** — every primary action button is `w-full` on mobile. No small inline buttons for main actions.
9. **Transitions** — always add `transition-colors` to interactive elements. No other animations except the loading skeleton `animate-pulse`.
10. **Language** — all UI text in English for now. Keep it simple and direct (e.g. "Mark as Paid", not "Confirm Payment Settlement").
