# Budget Flow

Budget Flow is a cross-platform personal finance app built with Expo, React Native, and Supabase. It is designed to help users track daily expenses, set monthly plans, monitor spending patterns, and build healthier budgeting habits through a friendlier, more guided experience.

## Project Status

This project is currently **in progress / under active development**.

What is already in the codebase:

- authentication flow with Supabase
- onboarding flow and starter checklist
- home dashboard with budget context
- expense input and category management
- monthly planning and income tracking
- budget vs actual comparison
- analytics and spending charts
- expense history with filters and calendar
- recurring expense management
- settings and CSV export
- responsive navigation for mobile and web

What is still evolving:

- overall product polish
- some UX copy and visual consistency
- product catalog / shop area
- deeper profile/account features
- broader testing and deployment hardening

## Tech Stack

- Expo
- React Native
- React Native Web
- React 19
- Supabase
- Expo File System
- Expo Sharing
- Expo Notifications
- react-native-chart-kit
- react-native-calendar-picker

## Repository Structure

```text
budget-flow/
├─ docs/
│  └─ superpowers/specs/
├─ frontend/
│  ├─ assets/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ constants/
│  │  ├─ context/
│  │  ├─ navigation/
│  │  ├─ screens/
│  │  └─ utils/
├─ scripts/
└─ README.md
```

## Main Features

### Personal Finance Tracking

- add and edit daily expenses
- organize spending by budget categories
- track monthly plans and income
- review expense history by date and filters

### Budget Awareness

- compare budget vs actual spending
- monitor category-level spending
- view budget alerts and daily/monthly usage context

### Guided Experience

- onboarding flow for first-time users
- starter checklist on the home screen
- settings shortcut to reopen the tutorial

### Cross-Platform Experience

- mobile-first UI with Expo and React Native
- web-specific navigation improvements in progress
- assets prepared for app branding and onboarding illustrations

## Running Locally

### Prerequisites

- Node.js
- npm
- Expo CLI tooling through the project scripts
- a Supabase project

### Environment Variables

Create the required environment values for the frontend app:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install Dependencies

```bash
cd frontend
npm install
```

### Start the App

```bash
npm run start
```

Other targets:

```bash
npm run web
npm run android
npm run ios
```

## Product Direction

Budget Flow aims to feel more like a supportive daily companion than a rigid finance dashboard. The product and design specs in `docs/superpowers/specs/` document the onboarding strategy, visual redesign direction, and responsive navigation direction currently shaping development.

## Notes

- This repository reflects active development work and may contain unfinished or changing features.
- Screens, flows, and data behavior may continue to evolve as the product is refined.
