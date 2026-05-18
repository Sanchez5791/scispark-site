# SciSpark Landing — Design Notes v1

> Branch: `redesign-landing-v1` · Date: 2026-05-18

---

## 1. Architecture decisions

### CSS/JS extraction
The previous `index.html` embedded ~400 lines of CSS and ~160 lines of JS inline. v1 extracts these into four files:

| File | Purpose |
|------|---------|
| `lesson-shell.css` | Shared design system — tokens, nav, buttons, mascot, tutor panel, footer |
| `lesson-shell.js` | Shared JS — lang toggle, screen nav, mascot/tutor, XP toast, unlock modal |
| `landing.css` | Landing-page-specific styles only |
| `landing.js` | Landing-page-specific JS — gate modal, Supabase auth, smooth scroll |

Every future lesson page links `lesson-shell.css` + `lesson-shell.js` only (no landing files). The landing links all four.

### Font loading
Both an HTML `<link>` (in `<head>`) and a CSS `@import` (in `lesson-shell.css`) load Google Fonts. The `<link>` is faster for the landing page; the `@import` covers standalone lesson pages that only include `lesson-shell.css`.

---

## 2. Design token rationale

All tokens in `lesson-shell.css `:root` are locked at v3.1. The key intentional choices:

- `--bg: #FBF8F4` — warm off-white (not pure white), keeps page from feeling clinical; matches physical science notebook texture
- `--accent: #EA580C` — Tailwind orange-600; saturated but not neon; prints legibly on `--bg` at WCAG AA
- `--ff-display: 'Instrument Serif'` — editorial serif for headings only; high-contrast strokes give authority without feeling academic
- `--ff-mono: 'JetBrains Mono'` — used for eyebrows, badges, labels; signals precision without feeling like developer tooling

**Deprecated tokens never used**: `#e8521a` (old orange), `#f5efe5` (old bg), `#1a1917` (old ink), EB Garamond, DM Sans.

---

## 3. Content fixes applied

| Location | Old content | Fixed content | Source |
|----------|-------------|---------------|--------|
| Hero / section headers | Assessment described as "45 min" | "30 min" | Design System v3.1 §assessment |
| Step 03 label | "Level 2 — guided" | "Level 2" | "GUIDED" suffix deprecated in v3.1 |
| FAQ item 3 | Referenced "Bilingual" and "Bilingual Plus" tiers | Removed tier references; bilingual is a platform-wide feature | Design System v3.1 §tiers |
| Footer | "© 2026 SciSpark" | "© 2026 SciSpark · An IG SPARK CENTRE product · All rights reserved." | Brand v3.1 §footer |
| Brand wordmark | `<b>SciSpark</b>` (flat) | `<b>Sci<span class="spark">Spark</span></b>` | Brand v3.1 §wordmark |
| For parents `<li>` | Malformed attribute (content duplicated in HTML) | Fixed attribute syntax | Bug |

---

## 4. Mascot bubble

Professor P was missing from the landing page. Per §6 of the design brief, the mascot must appear on landing AND lesson pages. Added to `index.html`:

```html
<div class="mascot-bubble" id="mascot-bubble" aria-label="Ask Professor P">
  <div class="mascot-label" data-en="Ask Professor P" data-zh="问 Professor P">Ask Professor P</div>
  <div class="mascot-avatar" role="button" aria-label="Ask Professor P">
    <img src="assets/ProfessorP_13_icon_head_only.png" alt="Professor P">
  </div>
</div>
```

Styles live in `lesson-shell.css`. Behaviour (click → open tutor panel) lives in `lesson-shell.js`. The AI tutor panel is also wired in — on the landing page it opens but has no backend response (tutor reply hook is not connected). Lesson pages override `SciSpark.handleTutorReply` to connect Claude.

---

## 5. Visual quality elevations

These are subtle polish changes over the previous inline styles:

- **Section padding**: `clamp(72px, 10vh, 128px)` vs old `64px` — more generous vertical rhythm at large viewports
- **Hero h1**: `clamp(52px, 8.5vw, 108px)` vs old `clamp(48px, 8vw, 104px)` — slightly larger at large viewports per DS type scale
- **Hover states on cards**: `.wp:hover` and `.dash-card:hover` get a subtle `box-shadow` lift (4px blur, 6% opacity) — adds interactivity cue without neon/color
- **Photo placeholders**: Changed from old CSS repeating-gradient stripes to `background: var(--bg-2)` — clean editorial empty state, easier to swap for real images
- **Tweaks dev panel**: Removed entirely from production HTML

---

## 6. Gate modal flow

5-step modal keyed on CSS display toggle (step 0 = choose path, 1 = social login, 2 = email, 3 = school form, 4 = school success):

- Facebook button shows alert ("not connected yet") — intentional stub, not a regression
- Google OAuth redirects to `https://scisparklab.com/signup-complete.html`
- Email uses `signInWithOtp` → sends magic link, no password stored
- School form submits to step 4 (visual confirmation only — no backend in v1)

---

## 7. What v2 should address

- [ ] Real photos in hero and social-proof sections (replace `--bg-2` placeholders)
- [ ] School form backend (Supabase row insert + confirmation email)
- [ ] Facebook OAuth connection (Supabase provider setup)
- [ ] AI tutor panel on landing — connect to Claude API via Edge Function
- [ ] Assessment score preview in hero device card (animate through sample questions)
- [ ] Mobile nav (hamburger menu for < 860px — nav-links currently hidden)
- [ ] Performance: self-host fonts if LCP is above 2.5s in production
- [ ] `style.css` audit — either delete (if only used by deprecated assessment pages) or migrate tokens to v3.1

---

*Prepared by Claude Code · Brief: `CLOUDCODE_BRIEF_landing_redesign.md` · Design System: v3.1*
