# Waypoint UI

This file is the UI contract. Product intent is [`waypoint.md`](../waypoint.md). How we build it is [`architecture.md`](architecture.md). If a control disagrees with architecture, architecture wins. Patch both in the same change.

Locked until you edit this file. Taste changes go here, not as a chat rewrite after every screen.

This file is complete for v1 UI. Change it when something is not to your taste.

## How we style

Follow [`architecture.md`](architecture.md) for tokens, `@expo/ui`, FlashList, Reanimated, and NativeWind. This file only says what each screen shows.

Copy is English. VoiceOver and TalkBack labels, 44pt targets, dynamic type that does not break layout. Details per phase below.

## Shared pieces

Promote something into `components/` when it appears twice.

- Themed text via type tokens, not raw `fontSize` in screens
- Trip card on the trip list
- Packing row
- Stop row, category icon and color from `theme` category tokens
- Expense row
- Sync chip
- Empty state, one layout, different title and body per screen
- Banner for resurrection and for hard errors that are not a full-screen empty

## Sync chip

Always visible once signed in. Never a modal spinner. Never blocks a tap.

- Synced
- Syncing…
- Offline, N changes pending

Put it in the stack header, trailing, on trip list and on every trip tab. Same component.

## Conflicts the user can see

No merge UI. Field-level last-write-wins is silent except:

Resurrection. If an edit beats a delete, show a banner: "Item restored, it was edited after being deleted."

## Phase 1. Auth, trips, packing

### Routes

Auth stack when there is no session:

- Sign in. Email field, send magic link. Offline: cannot send. Say the network is required to sign in. Existing session still opens the app offline.
- Check email. After send. Resend control. Expired or invalid link: explain and offer sign in again.

App stack when there is a session:

- Trip list. Root. Create trip in a form sheet. Sign out in the header menu.
- Join. Cold-start and in-app. Deep link `waypoint://join/{tripId}?token=...` and the universal-link / app-link equivalent. Already a member: open that trip. Expired or used token: explain, back to trip list.
- Trip packing. Root of a trip. No itinerary, map, or expenses entry points.
- Trip settings. Form sheet or stacked screen. Rename, dates, emoji, cover. Invite. Member list. Archive is not here. Delete trip, owner only, with a confirm.

### Trip list

Cards: name, destination, date range, countdown if departure is in the future.

Owner and editor see the same cards.

Archive is local, per user. Archived trips sit in a separate segment or filter on this screen, default hidden. Unarchive from there.

Empty, no trips: title "No trips yet", body that you can create one or open an invite, primary action create trip.

Empty, only archived: say so, offer to show archived.

### Create and edit trip

`@expo/ui` fields: name required, destination as typed text, start and end dates via datetime picker, optional emoji, optional cover from the photo library. Skip cover if the user denies photos. Do not block create.

Date range must be valid. Empty name cannot submit.

### Invite, join, members

Owner only: generate invite, share via the system share sheet, copy link as a fallback. Editors do not see invite or remove.

Member list. Owner, name or email as we have it, remove with confirm. You cannot remove yourself as owner here. Deleting the trip is how an owner leaves.

Join confirms trip name and destination before it writes membership, when the token is still valid.

### Packing

This is the trip. Header title is the trip name. Gear opens settings.

Progress: "18 of 32 packed" for the group, and a per-member line when anyone has an assignee.

`FlashList`. Add via a plus that opens an `@expo/ui` sheet: name required, quantity, note, assignee from members.

Check, uncheck, delete, drag to reorder. Swipe-to-check and swipe-to-delete. Also a row menu or buttons so VoiceOver is not stuck with swipe-only.

Starter templates, beach, city, camping, behind an add-menu action. Static local data. One tap prepends items. Fine if the list already has rows.

Empty: "Nothing packed yet", add an item.

Everything checked: keep the list, progress reads complete. Do not replace the list with a dead end.

Offline: packing still edits. Chip shows pending. Do not dim the list.

### Haptics in this phase

Light haptic on check-off. Current-stop haptic is phase 2.

## Phase 2. Itinerary and map

### Trip shell

A trip is no longer packing-only. Native tabs on the trip: Packing, Plan, Map. Settings stay the gear. Sync chip stays in the header.

Packing tab is the phase 1 packing screen. No behavior change except it is a tab.

Default tab is Packing before departure. During the trip date range, default is Plan. After the end date, Packing again. Changing tabs by hand is sticky for the session only.

### Plan

Day-by-day `FlashList`. Section per date in the trip range, even empty days, so you can add to a blank day.

Stop row: category icon, title, time range if set, location name if set. Current stop and next stop get a distinct treatment during the trip dates. Reanimated current-stop indicator on the UI thread. Static colors from `theme`, not `Color` / `PlatformColor` in the worklet.

Drag to reorder inside a day. Move to another day by editing `day` in the stop sheet, or by dragging onto a day header if that stays 60fps on a mid-tier Android. If drag-across-days janks, ship edit-day only. Do not drop frames to keep a gesture.

Empty trip, no stops: "No stops yet", add a stop.

Offline: list still edits. Chip shows pending. Map may be degraded. Plan is not.

### Add and edit stop

Plus opens an `@expo/ui` sheet.

`title` required. `day` required, picker limited to the trip date range. `startTime` and `endTime` optional, datetime picker. `note` short text. `category` picker: flight, lodging, food, activity, transit, other.

`location` name is typed text. Optional "Place on map" opens a full-screen map to drop or drag a pin, which writes lat/lng. No Places autocomplete. No booking APIs. A stop with a name and no coords is valid. It shows on Plan. It has no pin on Map.

Delete on the edit sheet, with confirm. Same resurrection banner as packing if an edit beats a delete.

### Map

`react-native-maps`. Pins only for stops that have lat/lng. Pin color follows category tokens.

Day filter chips, including All. Chips scroll horizontally.

Tap a pin: `@expo/ui` `BottomSheet` with title, time, category, note. Action to edit, which opens the same stop sheet as Plan.

Initial region: bounding box of pinned stops, or the destination cache if there are no pins yet.

Offline: if the platform still has a cached region, show it. If not, keep the pins and show a named placeholder under them plus a line of copy, "Map tiles unavailable offline." Never a bare gray grid.

Empty, no pins: chips still there, copy that stops need a map pin. Link or button to Plan.

### Category tokens

One map in `theme` keyed by category. Icon name plus `Platform.select` colors for iOS, Android dynamic, hex fallback. Screens do not pick hex per category.

### Haptics in this phase

Light haptic when the current-stop highlight advances because time crossed a stop boundary during the trip dates. Not a complete-checkbox. Stops have no checked field.

## Phase 3. Lock, widgets, native polish

Development build. Expo Go is not enough for lock, widgets, or maps that need native config. Plan EAS.

### App settings

New screen from the trip-list header menu, beside sign out. `@expo/ui` grouped `List`.

Sections: lock, about. Sign out stays in the menu, not buried in About.

### App lock

Optional. Off by default.

Toggle uses the biometric name the device reports. Face ID, Touch ID, or fingerprint. Never hardcode Face ID on a fingerprint phone.

Grace period: immediately, 1 minute, 5 minutes. Picker, not a free-text field.

`expo-local-authentication`. `disableDeviceFallback: false`. Failed or missing biometrics fall back to the device passcode.

If the device has no biometrics and no passcode, the toggle is disabled. Copy explains why. Do not store a lock that anyone can walk past.

Lock screen is a full-screen privacy gate. Trip names, packing, map, none of it. Unlock control in the middle. Sync keeps running. This is not encryption. One line of secondary copy on the lock settings row: "Hides the app on this device. Trip data is not encrypted."

Lock prefs and grace timing persist locally. They never sync.

Reduce motion: skip the trip-card zoom and the current-stop Reanimated indicator. Lock screen does not need motion.

### Per-trip lock

Ships in this phase. Owner-only row on trip settings. Same biometric prompt as app lock when opening that trip.

Locked trips on the trip list show a lock glyph. Title stays visible so you can find it. Cover blurs or is omitted. Opening requires biometrics or passcode. Failed auth stays on the list. Does not sign you out.

App lock and trip lock both on: satisfy app lock first, then trip lock if that trip is locked.

### Home screen widgets

iOS WidgetKit and Android Glance. Read local SQLite through the shared app group or the Android equivalent. They work offline.

Before departure: packing progress for the next upcoming unarchived trip, "18 of 32 packed", tap opens that trip's Packing tab. Action: quick add. Quick add opens the app to that trip with the add-item sheet presented.

During trip dates: next stop title, time, tap opens Plan. If the next stop has no title yet, show the trip name.

No trip: "No upcoming trip", tap opens trip list.

Widget chrome follows the system widget background. Do not invent a third palette.

### Cold-start invite

Not installed, store, first open, join. After auth, if a join token is still pending, show the phase 1 join confirm, not the empty trip list first.

Already signed in, link opened: join confirm on top of whatever screen was visible, then the trip.

### Local notifications

During active trip dates, a local notification for the next stop, "{title} in 45 min". No push server in this phase. OS permission prompt once, from App settings, not on first launch. Denied: the row says notifications are off, deep link to system settings.

Push when someone else edits a trip stays out. README next step.

### Accessibility pass

Walk every phase 1 and 2 screen. Labels on swipe actions and tab bars. 44pt targets. Dynamic type on packing rows, stop rows, trip cards, settings rows. Contrast is WCAG AA because chrome uses semantic colors. Fix anything that overflows when type is extra large. Do not clip trip names without a way to read them.

### Stress

Packing and Plan at 500+ rows on a mid-tier Android, 60fps scroll. That is a test, not a new screen.

## Phase 4. Expenses

### Trip shell

Fourth native tab: Spend. Packing, Plan, Map, Spend. Gear and sync chip unchanged.

Default tab rules from phase 2 do not change. Spend is never the automatic default.

### Spend

Top of the screen: balances card. Who owes whom, derived on the client from expense entities. Never written to the outbox. If two people edit expenses, this number just recomputes. Tabular figures.

Under that: `FlashList` of expenses, newest first unless you sort by day. Row: title, amount plus currency code, paid-by name, category icon.

Empty: "No expenses yet", add one. Balances card can hide when the list is empty.

Offline: still add and edit. Chip shows pending. Balances recompute from local entities.

This is a ledger. No settle, no pay, no request. No conversion. An expense in EUR and one in USD both show. Balances group by currency. Do not invent an FX rate. If a trip mixes currencies, show one owed-line per currency.

### Add and edit expense

Plus opens an `@expo/ui` sheet.

`title` required. `amount` required, integer minor units, numeric keypad. Show the major-unit string next to the field so "1250" reads as 12.50. `currency` code, picker, default to the last currency used on this trip, or the device locale currency if none.

`paidBy` required, member picker, default the current user. `splitAmong` even split only. Multi-select members, default everyone. Show "N people, {share} each" as derived copy. At least one person in the split. If only the payer is selected, share is the full amount, balances do not move, and that is fine.

`day` optional, date picker limited to the trip range. `category` picker. Reuse the phase 2 category tokens: food, lodging, transit, activity, other. Drop flight unless you want it. Chart color is that token.

Delete on the edit sheet, with confirm. Resurrection banner if an edit beats a delete.

### Chart

Same tab, below the list or behind a segmented control on the balances card: by category, by day. Simple bars. Derived. No third-party dashboard. Switch does not navigate away.

Empty chart is the empty list. Do not show a blank plot.

### Accessibility

Expense rows, amount fields, and balance lines get labels that include the currency and the major-unit value. Dynamic type on the balances card. Chart bars have an accessible alternative, a short text list of the same totals.
