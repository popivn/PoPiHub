## 21. Styling — Tailwind CSS

Use **Tailwind CSS** as the primary styling system for the dashboard.

Do NOT introduce another styling solution unless explicitly requested.

Preferred:

```tsx
<div className="rounded-md border p-4">
```

Avoid creating separate CSS files for individual components when the styling can reasonably be expressed with Tailwind utility classes.

Use Tailwind utilities consistently for:

* Layout
* Spacing
* Typography
* Colors
* Borders
* Border radius
* Shadows
* Responsive behavior
* States such as hover, focus, disabled

### Tailwind Design Constraints

Follow the dashboard spacing and radius rules defined above.

Prefer compact utilities such as:

```text
p-3
p-4
gap-2
gap-3
mt-3
mb-4
```

Avoid excessive spacing such as:

```text
p-10
p-12
gap-10
mt-12
mb-16
```

unless there is a specific layout reason.

Prefer restrained radius:

```text
rounded
rounded-md
rounded-lg
```

Avoid:

```text
rounded-2xl
rounded-3xl
rounded-full
```

`rounded-full` is allowed only for elements that are intentionally circular or pill-shaped, such as avatars, status indicators, or compact tags.

### Component Styling

Prefer compact dashboard components:

```tsx
<div className="border rounded-md p-4">
```

instead of:

```tsx
<div className="rounded-3xl shadow-xl p-10">
```

### Arbitrary Values

Do not overuse arbitrary Tailwind values:

```text
p-[37px]
gap-[29px]
rounded-[17px]
```

Use the standard Tailwind scale whenever possible.

Only use arbitrary values when the design genuinely requires a value outside the standard scale.

### Responsive Design

Use Tailwind responsive utilities:

```text
sm:
md:
lg:
xl:
```

Prefer progressive responsive layouts rather than completely separate desktop/mobile implementations.

### Custom CSS

Custom CSS is allowed only when:

1. Tailwind cannot reasonably express the behavior.
2. A third-party component requires it.
3. Complex animations or browser-specific behavior require it.
4. Global styles are necessary.

Do not create custom CSS simply to avoid using Tailwind utilities.

### UI Library

If a UI component library is used, it must remain visually consistent with these rules.

Do not blindly use the library's default styling if it introduces:

* excessive border radius
* excessive padding
* oversized components
* large shadows
* excessive animations

Customize components to maintain the compact professional dashboard style.
