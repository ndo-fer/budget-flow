# Onboarding Tutorial Design

## Summary

Budget Flow needs a first-run tutorial that helps new users understand the app without blocking them for too long. The tutorial should appear automatically the first time a user successfully signs in, and it should remain available from Settings so users can revisit it later. The initial implementation should favor reliability across Expo web and future Android APK builds over advanced guided overlays.

## Goals

- Show a required onboarding experience after the user's first successful login.
- Keep the initial tutorial short and easy to finish.
- Reinforce onboarding with a lightweight checklist on the Home screen.
- Let users reopen the tutorial from Settings at any time.
- Persist tutorial completion per user so it does not auto-reappear on every session.

## Non-Goals

- No coach-mark overlays or feature-spotlight popovers in the first version.
- No analytics or event-tracking pipeline for onboarding completion.
- No multi-language support in this phase.
- No dependency on web-only UI patterns that would complicate Android delivery.

## Recommended Approach

Use a hybrid onboarding flow:

1. A full-screen onboarding screen with 3 slides appears once after the user's first successful login.
2. After the user completes or skips onboarding, the main app opens.
3. The Home screen shows a simple "Mulai di sini" checklist with 3 starter tasks.
4. Settings includes an action to reopen onboarding manually.

This approach is preferred over guided overlays because it is easier to implement cleanly in the current custom-tab navigation structure, it is more predictable on mobile, and it still gives new users direction after the intro ends.

## User Experience

### First Login Flow

1. User logs in successfully.
2. App checks whether onboarding has already been completed for that user.
3. If not completed, the app shows the onboarding flow before `MainTabNavigator`.
4. When onboarding is finished, the completion state is saved and the user is taken to the main app.

### Returning User Flow

1. User logs in successfully.
2. App checks onboarding status.
3. If already completed, the app opens directly into the main app.

### Manual Reopen Flow

1. User opens Settings.
2. User taps `Lihat Tutorial Lagi`.
3. App opens the same onboarding flow without changing the saved completion state back to incomplete.

### Home Guidance Flow

After onboarding, the Home screen shows a compact starter card with 3 tasks:

- Set monthly plan or budget target
- Add or review categories
- Add the first expense

The card should be dismissible only after all tasks are complete or after the user explicitly hides it. In the first version, task completion can be inferred from existing app data when practical, and otherwise shown as guidance without strict enforcement.

## Content Design

### Onboarding Slides

The 3 onboarding slides should be concise and action-oriented:

1. `Catat Pengeluaran`
Explain that users can quickly add daily expenses so spending stays visible.

2. `Pantau Budget`
Explain that Budget Flow compares spending against plans and helps users notice over-budget behavior early.

3. `Rapikan Kategori dan Rencana`
Explain that categories and monthly planning make reports and alerts more useful.

Each slide should have:

- Title
- Short supporting description
- Simple visual treatment or illustration placeholder
- `Lewati`, `Lanjut`, and `Mulai` style actions as appropriate

## Architecture

### App-Level Routing

Introduce an onboarding gate between auth resolution and the main app:

- `AuthProvider` remains responsible for session state.
- A new onboarding state source determines whether the authenticated user should see onboarding.
- Root app routing becomes:
  - unauthenticated -> `AuthScreen`
  - authenticated and onboarding incomplete -> `OnboardingScreen`
  - authenticated and onboarding complete -> `MainTabNavigator`

### State Ownership

Create a dedicated onboarding state layer instead of mixing this logic into multiple screens. This can be a small context or a focused hook, depending on the existing code style that best fits the repo during implementation.

Responsibilities:

- Load onboarding status for the current user
- Mark onboarding as completed
- Expose a method to reopen onboarding manually
- Expose loading state while onboarding status is being resolved

### Persistence Strategy

Persist onboarding completion per user in Supabase. This is preferred over local-only storage because:

- the app is intended for phone use
- users may switch devices or sessions
- completion should follow the account, not only the browser/device

Recommended implementation:

- add a boolean field such as `has_completed_onboarding` in the user profile storage layer, or
- use a small dedicated settings/preferences table keyed by `user_id`

Final table choice should follow the existing data model once implementation begins. The key requirement is one stable onboarding completion flag per user.

## Screen Responsibilities

### `OnboardingScreen`

- Render the 3 onboarding slides
- Handle next, back, skip, and finish actions
- Save completion when the user finishes or skips
- Notify the root router to enter the main app

### `HomeScreen`

- Render a `Mulai di sini` onboarding checklist card near the top of the page
- Show up to 3 starter tasks
- Link each task to the relevant action or tab when possible
- Respect stored dismiss/completion state

### `SettingsScreen`

- Add `Lihat Tutorial Lagi`
- Trigger manual reopening without breaking normal login/session behavior

## Data Flow

1. Auth session resolves in `AuthProvider`.
2. Once a user is present, onboarding status loads for that user.
3. Root navigator waits until both auth and onboarding status are known.
4. Root navigator renders either onboarding or the main app.
5. Completing onboarding updates persistent storage, then updates local state.
6. Home and Settings read onboarding state to show checklist and reopen actions.

## Error Handling

- If onboarding status fails to load, default to a safe fallback that does not trap the user in a blank state.
- If saving completion fails, show a visible inline error and let the user retry.
- Manual reopen should still work even if checklist state is already complete.
- Avoid modal-only feedback that disappears or fails on web.

## Testing Strategy

### Manual Testing

- New user signs up, logs in, and sees onboarding.
- Existing user with completed onboarding logs in and skips directly to the app.
- User finishes onboarding and it does not auto-show again on next login.
- User opens Settings and successfully reopens onboarding.
- Home checklist appears for newly onboarded users and behaves correctly after starter actions are completed.
- Flow works on Expo web and remains compatible with Android packaging.

### Code-Level Testing

Prioritize testable logic boundaries for:

- onboarding status resolution
- onboarding completion persistence
- route gating behavior
- checklist completion derivation logic if extracted into utilities

## Open Implementation Decisions

- Whether onboarding state lives in a new `OnboardingContext` or a focused hook used by the root app and relevant screens.
- Whether checklist visibility is derived entirely from live data or partially stored as a dismissible preference.
- Whether `skip` should count as completed. Recommendation: yes, so the app respects the user's choice and does not loop them back.

## Rollout Notes

Start with a reliable v1:

- 3 static slides
- persistent completion flag
- simple checklist card
- settings entry point

This keeps the scope tight and supports the eventual APK target without introducing UI patterns that are hard to maintain across platforms.
