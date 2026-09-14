# Waypoint

Shared itinerary, packing list, and trip expenses. Works offline. When people reconnect, edits merge. No silent overwrites.

The interesting part is one sync engine: SQLite, an outbox, field-level last-write-wins with hybrid logical clocks, the same path for packing items, itinerary stops, and expenses.

Specs are ahead of the remaining phases. Product is [`waypoint.md`](waypoint.md). Engineering is [`docs/architecture.md`](docs/architecture.md). Screens are [`docs/ui.md`](docs/ui.md). Phase 1 UI (auth, trips, packing) is in the app; sync, itinerary, map, lock, widgets, and expenses are still later.

## Run it

```bash
pnpm install
pnpm start
```

Lint and format:

```bash
pnpm lint
pnpm format
pnpm check
```

`pnpm check` is lint, Prettier check, and `tsc --noEmit`. A Husky pre-commit hook runs that before every commit.

Expo Go is fine for poking at the template. Maps, biometrics, widgets, and a real native module set need a development build. See the Expo [development builds](https://docs.expo.dev/develop/development-builds/introduction/) docs when we get there.

## What is not in v1

No NativeWind. No web or desktop client. No booking APIs. Expenses are a ledger, not payments. Remote push is a later idea. Local next-stop notifications are in the UI spec.
