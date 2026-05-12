# Web Navigation and Profile Menu Design

## Summary

Budget Flow's current navigation works better for mobile than for desktop web. The bottom navigation and top-right logout action feel visually inconsistent and structurally confusing in a web context. The web experience should move to a desktop-appropriate layout while preserving the existing bottom navigation pattern for Android/mobile.

## Goals

- Replace the bottom navigation on web with a left sidebar.
- Move account-related actions out of the main content header.
- Introduce a profile entry point that feels natural on desktop.
- Keep mobile and APK navigation behavior unchanged.

## Non-Goals

- No full account-management backend in this phase.
- No avatar upload flow in v1 unless a local placeholder is sufficient.
- No major restructuring of screen business logic beyond navigation wiring.

## Final Direction

Approved approach:

- Web uses `sidebar-left navigation`
- Sidebar bottom contains a `Profile` block
- Clicking the profile block opens a floating profile menu
- Mobile and Android continue using bottom navigation

## Web Layout

### Sidebar

The left sidebar should contain the primary app destinations:

- Home
- Budget
- Income
- History
- Repeat
- Shop

`Settings` should no longer appear as a main peer in the primary navigation on web.

### Sidebar Footer

At the bottom of the sidebar, show a dedicated `Profile` block with:

- avatar or avatar placeholder
- name or email label
- short supporting text such as account role or daily finance state

This block should visually feel secondary to navigation but still clearly interactive.

## Profile Floating Menu

Clicking the profile block opens a floating menu anchored to that block.

### Content

The floating menu should contain:

1. Profile header
   - avatar / placeholder
   - user name or email
   - short secondary line

2. Finance status summary
   - `Healthy`
   - `Watch`
   - `Alert`

3. Actions
   - `Edit Profile`
   - `Settings`
   - `Logout`

### Behavior

- The menu should close on outside click or when an action is selected.
- `Settings` should navigate to the existing settings screen.
- `Logout` should call the existing sign-out logic.
- `Edit Profile` may be a placeholder action in v1 if deeper profile editing is not yet implemented.

## Finance Status Logic

For v1, use a simple 3-state model:

- `Healthy`: user appears within budget and no major alerts are active
- `Watch`: moderate caution, such as elevated utilization or warning signals
- `Alert`: user is over budget or has more serious spending warnings

The goal is quick emotional comprehension, not full financial diagnosis.

## Cross-Platform Behavior

### Web

- show left sidebar
- show profile block in sidebar footer
- do not show bottom navigation
- remove the top-right `Exit` button from content headers

### Mobile / Android APK

- keep bottom navigation
- account actions can remain in a mobile-appropriate menu flow
- do not force the sidebar pattern onto smaller screens

## UX Benefits

This redesign resolves the main problems in the current layout:

- web no longer feels like a stretched phone UI
- logout no longer appears as a random isolated action
- settings becomes a secondary account destination instead of a core app tab
- profile gets a clear and expected interaction point

## Implementation Strategy

1. Update the main navigator to branch on platform or screen size.
2. Add a web sidebar shell.
3. Add a profile footer block to the sidebar.
4. Implement a floating profile menu component.
5. Route `Settings` through the profile menu instead of the main web nav.
6. Remove the web header logout button from affected screens.

## Testing

- Web shows sidebar instead of bottom nav.
- Sidebar profile block opens and closes the floating menu correctly.
- `Settings` opens from the profile menu.
- `Logout` still works.
- Mobile still uses bottom navigation.
- Screen content still renders correctly inside the new web shell.
