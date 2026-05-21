# Web App Figma Transplant Design

Date: 2026-05-21
Status: Draft for review

## Summary

Build a new web-only Budget Flow project in a separate folder using the `figma-ai/` design as the UI shell, then progressively transplant the full working system behavior from the existing Expo app in `budget-flow/frontend/`.

The existing project remains untouched as the reference implementation. The new project becomes the migration target for:

- auth
- onboarding/tutorial
- home dashboard
- budget vs actual
- income tracking
- expense history
- recurring expenses
- analytics
- settings
- supporting CRUD actions, alerts, and export behavior that already exist in the old app

Any missing design states, missing screen coverage, or missing runtime configuration must be reported during implementation instead of silently invented.

## Goals

- Preserve the new visual direction from `figma-ai/`
- Create a separate web app project folder and leave the old app intact
- Reuse the existing backend/auth behavior where possible
- Refactor the old logic into web-friendly modules instead of copying React Native screens wholesale
- Keep the migration incremental so each functional area can be validated independently

## Non-Goals

- Do not replace or rewrite the backend itself unless a compatibility issue forces a small adapter
- Do not convert the new project back into a shared mobile-plus-web codebase in this phase
- Do not migrate the old `catalog/shop` feature unless later requested
- Do not silently fabricate missing UI flows that materially affect product behavior

## Chosen Approach

The migration will use a new web shell based on `figma-ai/`, then transplant business logic in layers from the old app.

This is preferred over a direct lift-and-port because:

- `figma-ai/src/app/App.tsx` is currently a static prototype and needs structural refactoring anyway
- the old Expo app already contains the working auth, onboarding, and data service behavior
- a layered transplant reduces risk and keeps boundaries clear between presentation and application logic

## Source Systems

### New UI Base

- `F:\budget-flow\figma-ai`

Characteristics:

- Vite-based React web project
- Tailwind and component primitives already present
- current `App.tsx` is a large static prototype with mock data and local tab state

### Existing Functional Reference

- `F:\budget-flow\budget-flow\frontend`

Characteristics:

- Expo / React Native app with working auth and service modules
- contains app flow, feature screens, contexts, API clients, and data services
- some modules are web-capable in concept but are still shaped around Expo/React Native assumptions

## New Project Structure

Create a separate project folder at the repo root, using a copy/evolution of `figma-ai/` as the base. The exact folder name can be chosen during implementation, but it must not overwrite `figma-ai/` or `budget-flow/frontend/`.

Target structure:

- `src/app`
- `src/layouts`
- `src/routes`
- `src/features/auth`
- `src/features/onboarding`
- `src/features/home`
- `src/features/budget`
- `src/features/income`
- `src/features/history`
- `src/features/recurring`
- `src/features/analytics`
- `src/features/settings`
- `src/components`
- `src/contexts`
- `src/services`
- `src/lib`
- `src/utils`
- `src/types`

## Architecture

### App Shell

The current one-file `App.tsx` prototype will be split into:

- root providers
- route-aware screen switching or a controlled shell navigator
- desktop sidebar and mobile bottom navigation
- shared modal and toast handling
- page-level loading, empty, and error states

The shell keeps the Figma visual identity, but its state must come from real feature modules instead of hardcoded arrays.

### Context Layer

Create web-native versions of:

- `AuthProvider`
- `OnboardingProvider`

Responsibilities:

- manage Supabase session state
- expose sign-in, sign-up, sign-out
- initialize default categories after sign-in when needed
- store onboarding visibility and checklist visibility through Supabase user metadata

These contexts should preserve old behavior while removing Expo-specific assumptions.

### Services Layer

The old service modules in `budget-flow/frontend/src/api/*` become the foundation of the new app's data layer. They will either be copied and adapted or reimplemented with the old logic as the source of truth.

Expected modules:

- `supabase`
- `client`
- `expenseService`
- `incomeService`
- `planService`
- `comparisonService`
- `analyticsService`
- `recurringService`
- `categoryService`
- `alertService`
- `queryUtils`

Rules:

- prefer preserving logic over preserving file shape
- isolate environment access in one place
- remove React Native or Expo-only assumptions
- normalize return shapes for the web screens

### Feature Layer

Each major screen should own:

- screen container
- local interaction state
- data fetching hooks
- presentational subcomponents
- mutation handlers

This keeps the app maintainable and prevents a new monolithic `App.tsx`.

## Functional Scope

### 1. Authentication

Implement:

- login
- sign-up
- sign-out
- session restore on refresh
- auth loading states
- auth error messaging

Design note:

The current Figma prototype does not appear to include a dedicated auth flow in the inspected `App.tsx`. The implementation should create an auth experience that matches the established design language, but if the imported Figma deliverable does include another auth layout elsewhere, that source should be preferred.

### 2. Onboarding and Tutorial

Implement:

- first-run onboarding visibility
- completion flow
- reopen tutorial from settings
- checklist visibility behavior if carried into the new home experience

Design note:

The current prototype includes a home checklist card, but the full onboarding/tutorial journey is not clearly represented in the inspected design file. If key tutorial states are absent, this must be reported for manual design completion.

### 3. Home Dashboard

Implement using real data:

- daily spending summary
- monthly income summary
- budget utilization snapshot
- alert banner
- today's transactions
- quick add expense entry point
- onboarding checklist or equivalent first-run guidance

The current Figma home layout is a good candidate for direct functional hookup.

### 4. Budget vs Actual

Implement:

- month navigation
- summary cards
- category-level utilization
- healthy/watch/over status
- supporting alert and comparison logic

The current Figma prototype already has a strong structure for this screen.

### 5. Income Tracking

Implement:

- income source listing
- income transaction listing
- add/edit/delete flows if supported by old logic
- monthly totals and breakdown

The design appears present in the prototype, but real-state coverage must be validated during implementation.

### 6. Expense History

Implement:

- history grouping/filtering
- date handling
- category display
- transaction CRUD entry points

Any advanced filter controls from the old app that do not exist in the new design should be surfaced as a gap before inventing extra controls.

### 7. Recurring Expenses

Implement:

- recurring item listing
- monthly sync action
- add/edit/archive behavior

The current prototype already implies these actions visually.

### 8. Analytics

Implement:

- analytics summary and charts already supported by the old app's data layer

Design note:

Analytics is part of required functionality, but it is not clearly visible in the inspected Figma tab system. This is a likely design gap and should be treated as a probable escalation item unless another Figma screen or hidden layout exists.

### 9. Settings

Implement:

- profile summary
- tutorial reopen
- notification settings if backed by existing behavior
- category management entry point
- export entry point
- logout

### 10. Shared Operations

Implement supporting behavior across the app:

- loading overlays or inline loading states
- empty states
- error states
- confirmations for destructive actions
- toast or banner feedback
- export flow

## Navigation Design

The new web app should preserve the overall navigation intent of the Figma shell:

- sidebar on desktop
- bottom navigation or compact navigation on smaller screens

Required tabs/pages in scope:

- home
- budget
- income
- history
- recurring
- analytics
- settings

If the visible Figma navigation lacks `analytics`, that missing placement must be resolved explicitly during implementation rather than buried.

## Data and Configuration

### Supabase

The current old app reads:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The new Vite project will likely need web-native equivalents such as:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

This is a likely configuration migration point. If no web env file or deployment strategy exists yet, implementation must pause and ask for the required values or convention instead of hardcoding them.

### API Base URL

The old axios client reads:

- `REACT_APP_API_URL`
- `REACT_APP_API_TIMEOUT`

The new app should standardize these for Vite-compatible environment access. If the backend endpoints are still active and correct, they should be reused. If not, the mismatch must be reported.

## Implementation Phasing

### Phase 1. Scaffold and Core

- create new project folder from `figma-ai/`
- modularize prototype app shell
- wire providers
- set up environment handling
- prepare routing/navigation structure

### Phase 2. Auth and Onboarding

- transplant auth context
- transplant onboarding context
- build matching auth/onboarding screens in the new visual language

### Phase 3. Data Foundation

- port Supabase client and shared service utilities
- adapt feature service modules
- verify real data fetches in isolation

### Phase 4. Screen-by-Screen Hookup

- home
- budget
- income
- history
- recurring
- analytics
- settings

Each screen should first render with real read-only data, then gain mutations and edge states.

### Phase 5. Shared UX States

- loading
- empty
- errors
- confirms
- toasts
- export handling

### Phase 6. Validation

- smoke test major flows
- verify auth persistence
- verify CRUD mutations
- verify onboarding metadata behavior
- verify responsive shell behavior

## Error Handling

The web app should not silently fail or only log to console. Feature modules should expose user-facing states for:

- auth failure
- failed fetches
- validation errors
- failed save/update/delete operations
- missing required configuration

Configuration failures should fail fast with clear messages for developers.

## Testing Strategy

Minimum validation for implementation:

- app boots with valid env config
- auth sign-up and sign-in complete
- session restore works after refresh
- onboarding visibility toggles correctly
- home, budget, income, history, recurring, analytics, and settings all load
- core create/update/delete paths work where supported
- export action can be triggered successfully if backend support exists
- responsive navigation works for desktop and smaller screens

If automated tests are not introduced in the first pass, manual smoke coverage must still be documented.

## Known Gaps and Escalation Triggers

The following are likely to require confirmation during implementation:

- missing dedicated auth screen design in `figma-ai/`
- incomplete onboarding/tutorial visual coverage
- unclear placement or absence of analytics in the current Figma navigation
- missing empty/loading/error/modal variants for some screens
- missing Vite-compatible environment configuration for Supabase and API base URLs
- any old feature whose behavior exists in code but has no corresponding design treatment

When one of these is encountered, the implementation should stop at the gap boundary, report it clearly, and continue only after confirmation or manual design input.

## Recommended Deliverable Outcome

At the end of the migration, the repo should contain:

- the untouched existing Expo app as a reference
- a separate new web app project folder
- the new UI system based on the Figma design
- the old app's working business logic transplanted into web-friendly modules
- explicit notes for any remaining design or config gaps
