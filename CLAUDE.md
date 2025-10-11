# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 Progressive Web App (PWA) for poker hand replay and session tracking. The application allows players to:
- Configure and record poker hands with detailed action tracking
- Replay saved hands with playback controls
- Track live poker sessions with timer and break management
- Manage poker trips with multiple participants and daily results
- View statistics and charts for performance analysis

## Technology Stack

- **Frontend Framework**: Vue 3 with Composition API (`<script setup>`)
- **State Management**: Pinia stores
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL database with auth)
- **Internationalization**: vue-i18n
- **Charts**: Chart.js with vue-chartjs
- **PWA**: vite-plugin-pwa

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### State Management Pattern

The application uses **Pinia stores** for centralized state management. Each domain has its own store:

- **`game.js`**: Core poker hand logic (players, board, pots, history, replay)
- **`useSessionStore.js`**: Live session tracking (timer, breaks, rebuys, expenses)
- **`useTripStore.js`**: Poker trip management with multi-participant tracking
- **`useAuthStore.js`**: Supabase authentication and user profiles
- **`useChartsStore.js`**: Chart configuration and data
- **`useSettingsStore.js`**: App settings

### Database Integration Architecture

**Important**: All database operations go through `src/api/index.js`, which provides centralized functions for:
- User authentication checks
- Error handling
- Data transformation between frontend and Supabase schema

**Key pattern**: Stores call API functions (e.g., `apiFetchHands`, `apiAddSession`) instead of directly calling Supabase. This abstraction layer handles:
- Automatic user ID injection
- Pagination for large datasets
- Date filtering
- Relationship mapping (joins)

### Hand Replay System

The hand replay system is built on a **snapshot-based history model**:

1. **State Recording**: Every action (fold, call, raise, card assignment) creates a snapshot in `history` array
2. **Navigation**: Users can navigate forward/backward through snapshots
3. **Playback**: Automated replay using intervals that step through history
4. **Pre-action Phase**: Special phase before first action where edits update the initial snapshot

**Key files**:
- `src/store/game.js`: Contains `recordState()`, `navigateHistory()`, `playReplay()`, `pauseReplay()`
- `src/views/CurrentHandView.vue`: Hand recording interface
- `src/views/SavedHandsView.vue`: Hand library with date filtering and pagination

### Session Timer Architecture

The session tracking system uses **localStorage persistence** with reactive timers:

1. **State Persistence**: Active session state is saved to localStorage on every change
2. **Timer Updates**: A 1-second interval increments `timerDisplay.value` which triggers computed property recalculation
3. **Break Tracking**: Break time is accumulated separately and subtracted from total time
4. **Session Recovery**: On app reload, if active session exists in localStorage, timer resumes

**Key pattern**: `elapsedTime` and `breakElapsedTime` are computed properties that depend on `timerDisplay.value` for reactivity.

### Trip Management with Shared Participation

Trips support **multi-user collaboration**:

1. **Creator Relationship**: `viajes_poker.creador_id` links to user who created the trip
2. **Participant Junction Table**: `viaje_participantes` allows multiple users to access a trip
3. **Auto-enrollment**: Trip creators are automatically added as participants
4. **Player vs User Distinction**:
   - **Players** (`participantes_viaje`): Named participants in a trip (can be non-users)
   - **Users** (`viaje_participantes`): Authenticated users who can view/edit the trip

### Component Structure

Views follow a **single responsibility pattern**:

- **`CurrentHandView.vue`**: Hand setup and recording
- **`LiveSessionView.vue`**: Active session controls (start/stop, breaks, rebuys)
- **`SavedHandsView.vue`**: Hand history browser with date filter
- **`SavedSessionsView.vue`**: Session history table
- **`SavedTripsView.vue`**: Trip library
- **`CommunityView.vue`**: Trip editor with daily results matrix
- **`SummaryView.vue`**: Statistics dashboard
- **`ChartsView.vue`**: Visual analytics
- **`AdminView.vue`**: Admin panel (role-restricted)
- **`AuthView.vue`**: Login/signup

Reusable components:
- **`PokerTable.vue`**: Visual table with draggable players
- **`Player.vue`**: Player chip display with cards
- **`ActionPanel.vue`**: Poker action buttons (fold/call/raise)
- **`CardPicker.vue`**: Card selection modal
- **`PlayingCard.vue`**: SVG card renderer
- **`EndSessionModal.vue`**: Session end form
- **`ConfigurationModal.vue`**: Hand configuration form

### Database Schema (Supabase)

Key tables:
- **`manos_guardadas`**: Saved hands (history stored as JSONB)
- **`sesiones_juego`**: Poker sessions
- **`viajes_poker`**: Trip metadata
- **`participantes_viaje`**: Trip player data (names, bankroll, participation %)
- **`viaje_participantes`**: User-to-trip access (junction table)
- **`resultados_diarios_viaje`**: Daily results per participant
- **`perfiles`**: User profiles with role-based access

### Authentication Flow

1. **App Initialization** (`main.js`):
   - Waits for Supabase `onAuthStateChange` before mounting
   - Loads user profile if session exists
2. **Auth Store Listener**: Continuously updates `user` and `session` state
3. **Protected Operations**: API functions check for authenticated user via `getCurrentUser()`

### Responsive Design

The app is **mobile-first** with:
- Fixed bottom navigation bar (70px height)
- Landscape orientation detection with overlay warning (`RotateDeviceOverlay.vue`)
- Floating action button (FAB) for quick "New Hand" access

## Common Patterns

### Adding a New Database-Backed Feature

1. Create API functions in `src/api/index.js`
2. Create/update Pinia store with actions that call API functions
3. Create Vue component that uses the store
4. Register component in `App.vue` if it's a view

### Hand History Snapshot Format

```javascript
{
  players: Array<Player>,  // Deep copy of player state
  board: [card1, card2, ...], // Board cards
  pots: Array<Pot>,
  description: "Action description"
}
```

### Player Object Structure

```javascript
{
  id, name, stack, cards: ['', ''],
  position, inHand, isAllIn, hasActedThisRound,
  betThisRound, totalBetInHand,
  isDealer, isSB, isBB, isStraddle, isMississippi, isBombPot,
  notes, tag, x, y
}
```

## Special Rules Implementation

The app supports poker variants:
- **Straddle**: UTG+1 posts 2BB before action
- **Mississippi Straddle**: Button posts 2BB
- **Bomb Pot**: All players post X BB (configurable)

These are configured via `specialRule` ref and affect blind posting logic in `setupNewHand()`.

## Internationalization

Translations are in `src/locales/` and accessed via `$t('key')` in templates or `t('key')` in composition API.

## Important Notes

- **Card Format**: Cards are strings like "As" (Ace of spades), "Kh" (King of hearts)
- **Currency**: Stored with each session/trip for multi-currency support
- **BBs Display**: Game store has `displayInBBs` toggle to show amounts in big blinds
- **Pagination**: Hands use offset-based pagination with `hasMore` flag
- **Deep Copy**: Use `JSON.parse(JSON.stringify(obj))` for state snapshots (defined as `deepCopy` helper)
- **Role-Based Access**: Admin panel only visible when `authStore.rol === 'Administrador'`

## File Aliases

The project uses `@/` as an alias for `src/` directory (configured in `vite.config.js`).

## Specialized Agents

This project uses a custom agent for Vue.js and JavaScript development tasks:

### vue-js-optimizer Agent

**When to use**: This agent should be invoked automatically for:
- Fixing bugs in Vue components or JavaScript code
- Implementing new features in Vue.js
- Optimizing component performance or reactivity issues
- Refactoring Vue components following best practices
- Adding or updating tests for Vue components
- Debugging computed properties, watchers, or lifecycle hooks
- Improving code quality in .vue or .js files

**Key capabilities**:
- Expert in Vue 3 Composition API (`<script setup>`)
- Follows Vue.js style guide and best practices
- Implements proper reactivity patterns (ref, reactive, computed, watch)
- Creates focused unit tests with Vitest/Vue Test Utils
- Optimizes performance (v-show vs v-if, proper keys, lazy loading)
- Provides minimal, surgical fixes with concise explanations

**Usage pattern**: When the user requests Vue or JavaScript code changes, bug fixes, or new features, proactively launch this agent to ensure high-quality, tested implementations that follow project standards.
