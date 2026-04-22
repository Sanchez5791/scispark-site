Handoff: SciSpark Homepage & Assessment Entry Flow
Overview
This is the complete homepage for IG Science Spark Lab (SciSpark), an AI-powered science learning platform for Year 7–9 students, Cambridge 0893 aligned. The homepage serves as:
Brand homepage for first-time visitors
Assessment entry gate (with sign-up-first logic)
Account creation gateway (separate student + parent accounts)
Future platform front door for returning users (Sign In)
About the Design Files
The files in this bundle are design references created in HTML — fully functional prototypes showing intended look and behavior. The task is to deploy the homepage HTML directly (it is production-ready static HTML/CSS/JS) or recreate it in your target framework using these files as the exact reference.
Fidelity
High-fidelity (hifi). Pixel-perfect mockups with final colors, typography, spacing, and interactions. All copy is bilingual (EN/中文). All interactions are wired.
---
PART 1 — CURRENT SOURCE FILES
File	Role	Status
`SciSpark Landing v2.html`	Latest governing homepage source	Active — use this
`SciSpark Homepage.html`	Bundled standalone (all assets inlined, 712KB)	Backup — zero dependencies
`assets/scispark-mark-clean.png`	Logo mark, transparent background, 280×280	Required by source version
`assets/scispark-mark.png`	Old logo mark (opaque white background)	Do not use — broken render
External dependencies (CDN)
Google Fonts: Instrument Serif, Inter, JetBrains Mono
No JS frameworks. No build tools. Pure HTML/CSS/JS.
---
PART 2 — PAGE STRUCTURE
Section order (top to bottom):
Ribbon — top announcement bar (toggleable via Tweaks)
Navbar — sticky, contains:
Logo mark + brand name ("IG Science Spark Lab" / "Year 7–9 Science · Cambridge 0893")
Nav links: Home, How It Works, Learning Paths, Start Assessment
Language toggle: EN / 中文 pill
Sign In button (ghost style)
Start Assessment button (orange accent, opens sign-up gate)
Hero — two-column:
Left: eyebrow, headline ("Science your child actually understands."), lede paragraph, Start Assessment + Sign In CTAs, stats row (45 min, 60 marks, 3 levels, EN·中文)
Right: interactive assessment device mock (question card with clickable answer options)
Trust strip — horizontal badges (Cambridge 0893, Assessment-first, Human-reviewed, Bilingual, Persistent accounts)
What SciSpark Is — two-column: left = heading + description, right = 4 numbered feature cards (Assessment-first, Account-based, Guided, Bilingual)
Problem — two-column: left = heading, right = 3 parent quote cards (last one is dark, brand voice)
Photo strip — 3 placeholder image blocks (classroom, parent, review)
How It Works — 4-step grid: Sign Up → Assessment → Human Review → Platform Access. Each step has a data-preview card.
Inside the Platform — section heading + platform-grid containing:
Unit browser (4 unit rows showing done/current/gap/locked states)
AI tutor chat (3 conversation bubbles + typing indicator)
Quizzes preview (question + 4 options, one correct)
Games & practice (3 activity items)
Progress ring (SVG circle, 71%, stats underneath)
Parent report (4 status lines)
Bilingual card (EN/中文 side-by-side question example)
For Students / For Parents — two equal cards with account-specific bullet lists
Account / Dashboard Value — 6-card grid (Assessment records, Reports, Progress, Profile, Package, Linked accounts)
Assessment callout — dark block: "Create your account. Then take the 45-minute assessment." + Start Assessment (gated) + Sign In
FAQ — two-column: left = heading, right = 5 accordion details (plan choice, AI chatbot, bilingual, Cambridge, cancellation)
Footer — 4-column: brand + description, Platform links, Entry links, Company links
Modal: Sign-up gate (`#gate`)
Triggered by all `[data-gate="1"]` buttons
Step 1: Choose sign-up method — Continue with Google, Continue with Facebook, or Continue with Email
Step 2 (email only): Form with Parent Account fields (name, email) and Student Account fields (name, year group, email optional, assessment language). Submit button: "Create accounts & begin assessment"
Closes on: ✕ button, backdrop click, Escape key
"Already have an account? Sign in" link at bottom
---
PART 3 — INTERACTION LOGIC
Start Assessment button
Every "Start Assessment" button has `data-gate="1"`
Clicking opens the sign-up gate modal (NOT the assessment directly)
Locked rule: user must sign up BEFORE assessment begins
After sign-up (demo): modal closes, page scrolls to #assess section
Production replacement: after real account creation, redirect to `/assessment` page
Language switch
EN/中文 pill in navbar
Toggles every element with `data-en` and `data-zh` attributes
Persists choice in `localStorage('scispark-lang')`
Default: English
Affects ALL text on the page including modal, footer, section headings
Nav links
Pure anchor links: `#home`, `#how`, `#levels`, `#assess`
Smooth scroll via browser default anchor behavior
Sign In
Currently demo-only (no real auth)
Should eventually route to a sign-in page or modal
One clean Sign In entry — role resolution (student vs parent) happens after sign-in
Assessment flow (intended production flow)
```
Homepage → Click "Start Assessment"
  → Sign-up gate modal opens
  → User creates account (Google/Facebook/Email)
  → Parent account + Student account created
  → SciSpark receives data immediately
  → Redirect to /assessment (intake form)
  → Year group routes to correct assessment (/assessment-y7, -y8, -y9)
  → Student completes 45-min assessment
  → Structured submission captures answers
  → AI marking processes responses
  → Result stored in both accounts
  → Human review → level recommendation
```
Hero device mock
Clickable answer options (cosmetic only — highlights selected option)
Not functional assessment, just visual demo
Tweaks panel
Design tool only — not user-facing
Toggle accent color, headline font, density, ribbon
Remove for production deployment
---
PART 4 — DESIGN TOKENS
Colors
Token	Value	Usage
`--bg`	`#FBF8F4`	Page background
`--bg-2`	`#F4EFE7`	Secondary background
`--ink`	`#171413`	Primary text
`--ink-2`	`#3a342f`	Secondary text
`--ink-3`	`#6b6358`	Muted text
`--line`	`#E6DFD3`	Borders, dividers
`--line-2`	`#D9D0BF`	Stronger borders
`--accent`	`#EA580C`	Brand orange — primary accent
`--accent-ink`	`#7a2e08`	Dark accent text
`--accent-soft`	`#FFE9D6`	Light accent background
`--ok`	`#2E7D5B`	Success green
Typography
Role	Font	Weight	Size
Display headings	Instrument Serif	400	36–104px (clamp)
Body text	Inter	300–700	13–18px
Mono/labels	JetBrains Mono	400–500	10–13px
Spacing
Max width: 1280px
Horizontal padding: clamp(20px, 4vw, 56px)
Section padding: clamp(72px, 10vh, 120px) vertical
Border radius: 8px (buttons), 14–16px (cards), 18px (device mock), 20px (callout)
---
PART 5 — LOCKED SYSTEM RULES (DO NOT BREAK)
Assessment-first logic — new users MUST sign up before assessment
Free trial does NOT exist — no "Start Free Trial" anywhere
Start Assessment is the ONLY new-user entry route
Student and parent are SEPARATE accounts with separate logins
Parent does NOT log in as the student
Sign In = one clean entry, role split happens after
Assessment result persists permanently inside accounts
No anonymous assessment access
No plan-picking by parents — system recommends after assessment
Brand color is orange (#EA580C) — do not change
Bilingual continuity — EN/中文 must work across all pages
All future pages must visually continue from this homepage style
---
PART 6 — LOGO ASSET STATUS
Asset	Status	Notes
`assets/scispark-mark-clean.png`	Use this	280×280, transparent background, tightly cropped
`assets/scispark-mark.png`	Do not use	Opaque white background, renders as white block
Original upload	`uploads/pasted-1776609447624-0.png`	975×281, full bilingual lockup with baked-in gray background
Production recommendation: Re-export the logo from the original design file (Illustrator/Figma) with transparent background for pixel-perfect quality. The current cleaned version is algorithmically processed and may have minor edge artifacts at extreme zoom.
---
PART 7 — WHAT CLAUDE CODE MUST DO
Immediate tasks:
Use `SciSpark Landing v2.html` as the homepage `index.html`
Use `assets/scispark-mark-clean.png` as the header/footer logo
Remove the Tweaks panel (lines ~1550–1590 and the Tweaks JS block) for production
Wire "Start Assessment" post-signup to redirect to `/assessment` instead of scrolling
Wire "Sign In" to a real auth route
Assessment flow to build:
`/assessment` — intake form page (fields: Parent Name, Parent WhatsApp, Parent Email, Student Name, Year Group)
`/assessment-y7`, `/assessment-y8`, `/assessment-y9` — year-specific assessment pages
Completion page — "Thank you. Our team will review the results and guide you to the next step."
All pages must match homepage visual style (same fonts, colors, spacing, brand)
What must be preserved:
All section structure and content
Bilingual system (data-en/data-zh attribute pattern)
Sign-up gate modal (2-step: social → email form)
Separate student/parent account framing
Assessment-first logic
Orange brand identity
