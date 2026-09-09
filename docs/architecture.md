# Waypoint architecture

Engineering decisions live here. Product intent lives in [`waypoint.md`](../waypoint.md). Screens and copy live in [`ui.md`](ui.md).

If those files name a control, this file wins on how it is built. Patch this file in the same change.

## Stack

Expo SDK 57, Expo Router, TypeScript, pnpm. `shamefully-hoist=true` so Expo CLI can resolve ESLint.

Client is SQLite plus an outbox. Server is Node, Postgres, Redis pub/sub, WebSocket per trip.

No web or desktop client in v1. No NativeWind. No Tailwind on native.

Auth: magic link, JWT access about 15 minutes, refresh token in SecureStore, rotated on use.

Biometrics: `expo-local-authentication`, development build, not Expo Go. Lock is a privacy screen. Sync continues. Not encryption. Prefs are local, never synced.

Maps: `react-native-maps`. Widgets: WidgetKit and Glance, read local SQLite, development build.

Package manager is pnpm. Install with `npx expo install` for Expo-owned packages.

## Client UI libraries

Semantic colors: `Color` from `expo-router`, `Platform.select` for iOS, Android dynamic, hex fallback. One `theme/` entry point. No parallel hex table for chrome.

`@expo/ui` for sheets, pickers, toggles, menus, grouped settings, short forms. Wrap in `Host`.

`FlashList` for packing, Plan, Spend. `@expo/ui` `List` is Settings-style rows only.

Reanimated and Gesture Handler for packing swipe only, UI thread. Current-stop indicator on Plan, UI thread. Static colors in worklets. Never `Color` / `PlatformColor` in Reanimated.

Expo Router zoom from trip card to the trip, where the OS supports it.

`expo-haptics` on packing check-off and when the current-stop highlight advances.

Reduce motion: skip zoom and the current-stop indicator.

## Tooling

ESLint: `eslint-config-expo` flat config, Prettier as an ESLint rule, `simple-import-sort`, unused `_` args and vars ignored.

Prettier: single quotes, print width 100, trailing comma es5.

`pnpm check` is lint, Prettier check, `tsc --noEmit`. Husky pre-commit runs `pnpm check`.

## Sync engine

One engine for packing items, itinerary stops, and expenses. Same outbox, same merge function, same mutation log. Only field schemas differ.

The client is the product. The server applies the merge rule, auth, and membership. No extra trip domain logic on the server.

### Why field-level HLC-LWW

Pure wall-clock last-write-wins breaks under clock skew. Row-level LWW lets a time edit throw away a concurrent location edit. A full CRDT such as RGA or Yjs is more machinery than this data needs.

Each device keeps a hybrid logical clock, physical time plus a logical counter. When two mutations touch the same field, the higher HLC wins. Different fields on the same entity never conflict.

`amount` on an expense is one field under LWW. Balances are derived on the client. Never store or merge a balance.

No character-level merge on `note`. One full field wins. Fine for short trip notes.

No merge UI. Automatic only.

### Data model

Every entity is independently versioned fields, not one versioned row:

```
Entity {
  id: uuid
  trip_id: uuid
  type: "packing_item" | "itinerary_stop" | "expense"
  fields: {
    <fieldName>: { value: any, clock: LogicalClock, device_id: string }
  }
  position: { value: float, clock: LogicalClock, device_id: string }
  deleted:  { value: boolean, clock: LogicalClock, device_id: string }
}
```

### Deletes

Tombstones. `deleted.value = true` with its own HLC. Do not remove the row.

If the delete's clock is greater than the edit's clock, delete wins. Otherwise the edit resurrects the entity. Show "Item restored, it was edited after being deleted."

Purge tombstones after 30 days, not sooner.

### Ordering

Fractional indexing. Reordering one row does not rewrite every other `position`.

Moving a stop to another day is a `day` write plus a `position` write. Two independent field mutations.

Simultaneous reorders pick one order. Nothing else is lost.

### Protocol

1. Local write to SQLite and append to `outbox`: `{mutation_id, entity_id, entity_type, field, value, clock, device_id, created_at, synced: false}`.
2. Push unsynced rows to `POST /sync/push` on an interval while foregrounded and on `AppState` active. Idempotent by `mutation_id`.
3. Server applies HLC-LWW, appends to the Postgres mutation log, returns authoritative field values.
4. Redis pub/sub to other WebSocket connections on that trip.
5. Receiving clients run the same HLC-LWW against SQLite. No "server always wins".
6. Catch-up: `GET /sync/pull?since=<lastKnownServerClock>` on reconnect or after more than 30s backgrounded.

Flush the outbox on background. After force-quit, unsynced rows remain and retry. Test: kill with 3 pending mutations, relaunch, all 3 sync.

Archive flags and lock prefs are local. They never enter the outbox.

Invite tokens expire after 7 days or first use, configurable. Join is the deep link plus universal links on iOS and app links on Android, including cold start from the store.

No end-to-end encryption. Auth plus transport security only. No password-reset flow. Magic link is the v1 path.

Do not optimize for more than about 20 members per trip. Redis pub/sub is the scale story, not a large-group fan-out design.

Notification permission is requested from App settings, not on first launch.

500-plus row FlashList scroll at 60fps on a mid-tier Android is a phase 3 stress test, not a product feature.

CI: lint, unit, integration on every PR. Architecture diagram in the README when the engine exists.

## Backend

Postgres mutation log is append-only and is the source of truth. Current entity state is a derived view for reads.

Rate-limit `/sync/push` per device.

Endpoints:

- `POST /auth/magic-link`, `POST /auth/verify`
- `POST /trips`, `GET /trips/:id`, `POST /trips/:id/invite`, `POST /trips/:id/join`
- `POST /sync/push`
- `GET /sync/pull?tripId=&since=`
- WebSocket namespace per `tripId`

Redis pub/sub is how the socket layer can run on more than one Node process. Load testing that is not required in v1.

## Quality bar

Online-to-online mutation visible on the other device within 1s, p95.

No lost offline mutations across kill and relaunch.

No duplicated entities, no silently dropped edits. Automated conflict tests.

Background sync polling must not move the battery needle in a 1-hour session.

Unit tests: HLC-LWW merge, including clock skew, delete vs edit, all three schemas. Derived expense balances after any merge.

Integration: push and pull idempotency.

E2E: two devices, offline packing and stops, reconnect, merged state matches the rules.

Manual: force-quit mid-sync, airplane mode mid-edit, two phones, lock paths.

CI: lint, unit, integration on every PR.

## Rejected

- NativeWind / Tailwind on native. Fights `PlatformColor`, preview pipeline, `@expo/ui` does not live in `className`.
- Full CRDT for notes and lists.
- End-to-end encryption.
- Storing balances as synced state.
- Gorhom or Reanimated sheets when `@expo/ui` has BottomSheet.
- Expo Go as the production-shaped client. Maps, lock, widgets need a development build.

## Open

- Magic-link email: Resend, Postmark, or other. v1 auth.
- Map tile cache implementation. UI already specifies cached region vs placeholder copy. Put the chosen API in the map module and a short note here when you pick it.
