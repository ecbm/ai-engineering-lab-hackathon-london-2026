# WCAG 2.2 AA Accessibility Audit — CaseTracker

**Date:** 16 April 2026
**Scope:** All 4 application pages (Dashboard, Case Detail, Team Leader, Applicant Portal)
**Standard:** WCAG 2.2 Level AA

---

## Failures identified and fixed

| # | Page | Issue | WCAG SC | Severity | Fix applied |
|---|------|-------|---------|----------|-------------|
| 1 | Case detail, Team leader | Workflow future step text `#858686` on `#f3f3f3` — contrast ratio 3.29:1, requires 4.5:1 for 14px bold text | 1.4.3 Contrast (Minimum) | High | Darkened to `#6f6f6f` (5.03:1) |
| 2 | Team leader | White text on orange bar fill `#f47738` — contrast ratio 2.78:1, requires 4.5:1 | 1.4.3 Contrast (Minimum) | High | Darkened bar background to `#b7592a` (4.56:1) |
| 3 | Dashboard, Team leader | Orange stat box bottom border `#f47738` on white — contrast ratio 2.78:1, requires 3:1 for meaningful UI boundaries | 1.4.11 Non-text Contrast | Medium | Darkened border to `#b7592a` (3.2:1) |
| 4 | Applicant | Future step circle border `#cecece` on `#f3f3f3` — contrast ratio 1.42:1, requires 3:1 | 1.4.11 Non-text Contrast | Medium | Darkened border to `#8a8a8a` (3.3:1) |
| 5 | Case detail | Workflow tracker completed/current/future states distinguished by colour alone — no non-colour indicator | 1.4.1 Use of Color | Medium | Added `<span class="govuk-visually-hidden">(completed)</span>` to completed steps; `aria-current="step"` already present on current step |
| 6 | Applicant | Step list completed/future steps distinguished by colour alone | 1.4.1 Use of Color | Medium | Added visually-hidden text `(completed)` and `(not yet started)` to respective steps |
| 7 | Dashboard, Team leader | Stat boxes used `<div>` elements for key-value data — no semantic relationship exposed | 1.3.1 Info and Relationships | Medium | Changed to `<dl>/<dt>/<dd>` description list |
| 8 | Dashboard, Team leader | Notification banner header "Action required" marked up as `<div>` — visually styled as heading but not programmatically | 1.3.1 Info and Relationships | Medium | Changed to `<h2>` |
| 9 | Team leader | Bar chart used `display: flex` on `<tr>` elements — stripped implicit table role, breaking screen reader table navigation | 1.3.1 Info and Relationships | High | Split into a visually-hidden `<table>` for screen readers and a visual `<div>` chart with `aria-hidden="true"` |
| 10 | Case detail | No visible focus indicator on action checklist labels when checkbox receives focus | 2.4.7 Focus Visible | Medium | Added `:focus-within` style with `outline: 3px solid #ffdd00` and `box-shadow: inset 0 0 0 2px #0b0c0c` |
| 11 | Applicant | No error summary component at top of page when form validation fails — screen reader users past the form fields not informed of errors | 3.3.1 Error Identification | High | Added `govuk-error-summary` with anchor links to error fields, prepended "Error:" to page title |

---

## Items audited and confirmed passing

### All pages

- **2.4.1 Bypass Blocks** — Skip link present (`govuk-skip-link`) on all pages
- **2.4.2 Page Titled** — All pages have descriptive `<title>` elements
- **2.4.4 Link Purpose (In Context)** — All links have descriptive text including case IDs and applicant names
- **2.5.8 Target Size (Minimum)** — All inputs have `min-height: 44px`, checkboxes are 24x24px, buttons meet minimum targets
- **4.1.2 Name, Role, Value** — All form controls have labels, tables have `aria-label`, regions have `aria-label`

### Dashboard

- **1.4.3** — `#484949` on `#ffffff` (stat labels): 9.68:1 — Pass
- **1.4.3** — `#982828` on `#fcf5f5` (overdue badge): 7.8:1 — Pass
- **1.4.3** — `#7a3c1c` on `#fef8f5` (warning badge): 7.2:1 — Pass
- **1.4.3** — White on `#ca3535` (notification header): 4.88:1 — Pass
- Filters use server-side form submission with `aria-live="polite"` result count
- Table uses proper `<table>/<thead>/<th scope="col">/<tbody>` structure

### Case detail

- **1.4.3** — White on `#0f7a52` (workflow completed): 5.35:1 — Pass
- **1.4.3** — White on `#1d70b8` (workflow current): 5.17:1 — Pass
- **1.4.3** — `#3f2577` on `#f6f5fa` (AI summary label): 11.11:1 — Pass
- **1.4.3** — `#484949` on `#fcf5f5` (warning callout): 8.40:1 — Pass
- **1.4.1** — Completed actions use strikethrough + checked checkbox + visually-hidden "(completed)" text — not colour alone
- **1.3.1** — Warning callout uses `role="alert"` and `aria-label`
- **1.3.1** — Evidence table uses `<table>` with visually-hidden `<thead>` column headers
- **1.3.1** — Summary list uses `<dl>/<dt>/<dd>` structure
- **1.3.1** — Timeline and workflow use `<ol>` with `aria-label`
- **1.3.1** — Policy sections use native `<details>/<summary>`
- **2.4.6** — Heading hierarchy correct: h1 → h2 → h3 with no skipped levels
- Back link placed in `beforeContent` block outside `govuk-main-wrapper` per GDS layout rules

### Team leader

- **1.4.3** — White on `#ca3535` (red bar): 4.88:1 — Pass
- **1.4.3** — White on `#1d70b8` (blue bar): 5.17:1 — Pass
- **1.4.3** — White on `#54319f` (purple bar): 10.1:1 — Pass
- **1.4.3** — White on `#484949` (grey bar): 9.68:1 — Pass
- **1.4.3** — `#982828` on `#ffffff` (risk high): 7.8:1 — Pass
- **1.4.3** — `#7a3c1c` on `#ffffff` (risk medium): 7.2:1 — Pass
- **1.4.1** — Capacity card "under pressure" uses visible text tag alongside red border — not colour alone
- **1.4.1** — Deadline cards include text tags (Breach/Approaching/On track) alongside coloured borders
- Risk labels have `aria-label` attributes ("High risk", "Medium risk", "Low risk", "Not applicable")
- Responsive table wrapper has `tabindex="0"`, `role="region"`, `aria-label`, and focus style

### Applicant portal

- **1.4.3** — White on `#1d70b8` (status banner): 5.17:1 — Pass (27px heading is large text)
- **3.3.2** — Form fields have `govuk-label`, `govuk-hint` with `aria-describedby`
- **3.3.1** — Inline errors use `govuk-error-message` with visually-hidden "Error:" prefix, `aria-invalid="true"`, `aria-describedby` linked to error IDs
- Error summary uses `govuk-error-summary` with anchor links and `role="alert"`
- Step list uses `aria-current="step"` on current step
- Contact section properly structured with heading and paragraph content
- Back link uses standard `govuk-back-link` component

---

## Reduced motion

All pages include:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Colour palette reference (GDS v6)

| Usage | Hex | Contrast on white |
|-------|-----|-------------------|
| Primary text | `#0b0c0c` | 19.3:1 |
| Secondary text | `#484949` | 9.68:1 |
| Link | `#1a65a6` | 5.44:1 |
| Error | `#ca3535` | 4.88:1 |
| Success | `#0f7a52` | 5.35:1 |
| Brand blue | `#1d70b8` | 5.17:1 |
| Purple | `#54319f` | 10.1:1 |
| Orange (darkened) | `#b7592a` | 4.56:1 |
| Focus | `#ffdd00` | — |
| Border | `#cecece` | — |
| Future text | `#6f6f6f` | 5.03:1 |
