# Visual Redesign Design: Auth, Onboarding, Home

## Summary

Budget Flow needs a clearer and more emotionally supportive visual identity for mobile-first usage. The redesign should make the app feel like a clean, friendly daily companion rather than a rigid finance dashboard. The first redesign slice covers the auth flow, onboarding flow, and home screen because these screens establish the product's first impression and visual system.

## Goals

- Create a consistent visual language for the most important first-touch screens.
- Make the UI feel warm, fresh, and easy to approach without becoming childish.
- Improve mobile-first readability and touch comfort.
- Establish reusable color, spacing, and card patterns for later rollout to the rest of the app.

## Non-Goals

- No redesign of every screen in this phase.
- No changes to product scope or business logic beyond what is needed to support the visual refresh.
- No advanced animation system in v1 beyond a few meaningful transitions if practical.

## Final Design Direction

The approved design direction is:

- Personality: `warm daily companion`
- Mood: `fresh playful`
- Tone: `clean-friendly`
- Structural approach: `layered cards`

This means the app should feel human, welcoming, and polished, while still being organized enough for regular budgeting use.

## Visual Principles

### 1. Calm background, lively accents

The base UI should avoid cold flat white. Instead, use a warm off-white background with brighter accent colors applied intentionally to highlight actions, summaries, and onboarding moments.

### 2. Card hierarchy over dense dashboards

The core experience should be built from layered cards with clear visual weight:

- primary cards for important summaries and actions
- secondary cards for support information
- lightweight cards for checklist or contextual help

### 3. Friendly clarity over decorative noise

The redesign should feel expressive without becoming cute-heavy or over-illustrated. The app is still a budgeting tool and needs to remain legible, fast to scan, and credible.

### 4. Designed for the thumb

Buttons, cards, and tap targets should feel comfortable on a phone. Tight spacing, tiny labels, and overly dense toolbars should be reduced.

## Color System

Approved palette:

- Background: `#FFF9F4`
- Surface: `#FFFFFF`
- Primary Coral: `#F26B5B`
- Accent Mango: `#F6B94C`
- Accent Teal: `#2FA6A0`
- Accent Sky: `#7CC6F2`
- Text / Ink: `#1F2937`

Supporting neutrals should be derived around warm gray and soft slate values rather than stark grayscale.

Usage guidance:

- coral for primary CTA and key emotional emphasis
- teal for positive guidance and completion
- mango for onboarding warmth and setup nudges
- sky for supportive highlights and lighter status panels

## Typography

Typography should feel more editorial and less default-app boilerplate:

- large welcoming headings on entry screens
- clean body text with comfortable line-height
- compact but readable labels for cards and stats

The redesign should avoid tiny, cramped labels where possible. Headline hierarchy must do more of the work currently handled by raw layout density.

## Layout System

### Spacing

Introduce consistent spacing tokens and use visibly roomier vertical rhythm:

- wider top breathing room
- larger gaps between major sections
- tighter spacing only inside small data modules

### Corners and surfaces

- large card radii for primary containers
- medium radii for inputs and buttons
- subtle elevation or border contrast rather than harsh shadow stacks

### Buttons

- primary buttons should feel soft and substantial
- secondary buttons should remain clear without looking disabled
- floating action button should remain present but more refined and integrated into the overall language

## Screen Designs

### Auth Screen

#### Intent

Auth should feel like a welcome screen, not a plain form dump.

#### Design

- Warm background wash with soft color energy near the top
- One strong hero card or header zone with product name and supportive microcopy
- Form placed in a clean surface card with roomy inputs
- Primary CTA in coral
- Toggle between login/register styled like a friendly prompt, not a tiny text link
- Success and error messages should remain inline and be styled as polished feedback banners

#### Desired feeling

`You can start quickly and this app won’t overwhelm you.`

### Onboarding Screen

#### Intent

Onboarding should feel optimistic and guided, not tutorial-heavy.

#### Design

- Each slide uses a large color panel or layered visual block
- Strong title, short body, and clear forward action
- Progress indicators remain visible but polished
- Skip and continue actions should be visually balanced
- Final slide should feel like a transition into using the app, not just the end of a wizard

#### Desired feeling

`This app understands daily life and helps me ease into it.`

### Home Screen

#### Intent

Home should feel like a daily companion dashboard: helpful, scannable, and positive.

#### Design

- More welcoming header treatment with stronger hierarchy
- Summary cards become more deliberate and visually tiered
- Starter checklist should feel premium and guided, not like a warning box
- Income, plan, and today-spending modules should feel like one visual family
- Empty or setup states should feel encouraging and intentional
- FAB remains available but with more polished styling

#### Desired feeling

`I can instantly see where I am today and what to do next.`

## Component Patterns

The following patterns should be reusable after this phase:

- hero header block
- layered summary card
- feedback banner
- onboarding panel
- checklist item row
- friendly empty/setup card
- refined floating action button

These should be implemented in a way that can later extend into Settings, History, Budget, and other app areas.

## Interaction Notes

- Visual feedback should remain visible inline, especially on web where alerts are unreliable.
- Motion should be minimal and meaningful if added.
- Important actions should not rely on color alone; hierarchy and placement should still communicate intent.

## Accessibility and Usability

- Maintain readable contrast with the warmer palette.
- Keep button labels and tappable targets large enough for phone use.
- Avoid tiny tabs, cramped lines, or decorative accents that fight readability.
- Preserve a clear distinction between informational cards and actionable cards.

## Implementation Strategy

Implement the redesign in this order:

1. Establish shared color and spacing tokens if needed.
2. Restyle auth screen using the new visual language.
3. Restyle onboarding screen to match the same palette and card system.
4. Restyle home screen and starter checklist.
5. Validate the look on Expo web and with Android usage in mind.

## Testing Strategy

### Manual checks

- Auth remains readable and comfortable on narrow mobile widths.
- Onboarding feels visually consistent with auth.
- Home remains easy to scan with real data and empty states.
- Touch targets remain comfortable.
- The redesign does not reduce clarity of existing finance information.

### Risk checks

- Avoid over-decorating the home screen.
- Avoid reducing important contrast for amounts, alerts, and actions.
- Avoid introducing web-only styling patterns that won’t translate well to Android.

## Rollout Notes

This redesign phase is intentionally narrow so the team can establish the visual foundation before refactoring the rest of the product. Once auth, onboarding, and home feel solid, the same system can be extended to Settings and the remaining product surfaces.
