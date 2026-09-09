# Waypoint

Shared itinerary, packing list, and trip expenses. Works offline on a plane, on roaming, and on a hike with no signal. When people reconnect, their edits merge. No lost edits. No silent overwrites.

## 1. Overview

Trip planning is group work that happens in places with no network. The moments you actually need the itinerary and packing list, mid-flight, abroad with data off, on the subway to the airport, are the moments connectivity dies. TripIt, Google Keep, and shared notes either need a connection to stay trustworthy, or they drop or overwrite edits when two people change the same trip offline. There is no honest answer for what happens when you both edit at once.

Built for couples, families, friend groups, and small travel parties of 2 to 10 people who will go offline on purpose.

This is a demo product. Keep the feature list small. The trip is the domain. How it is built is [`docs/architecture.md`](docs/architecture.md). Screens and copy are [`docs/ui.md`](docs/ui.md).

## 2. Goals and non-goals

### Goals

- The app is usable with no network. Edits show up immediately.
- Two people can change the same trip, online or offline, without losing work or silently overwriting each other.
- When both are online, the other person's changes show up without pulling to refresh.
- Force-close, background, and reopen do not eat unsynced work.
- Packing, itinerary, and expenses feel like one product, not three apps glued together.
- Map, day-by-day plan, packing list, spend, lock.

### Non-goals for v1

- Flight or hotel booking, or any third-party travel API.
- Collaborative rich text. Trip notes are short plain fields.
- Web or desktop client.
- Currency conversion, receipt OCR, or payment settlement. Expenses are a ledger, not a bank.

## 3. Users and roles

| Role   | Capabilities                                                                       |
| ------ | ---------------------------------------------------------------------------------- |
| Owner  | Create trip, invite and remove members, delete trip, everything an editor can do   |
| Editor | Add, edit, delete, and check off any item, stop, or expense. Cannot manage members |
| Viewer | Read-only. Stretch. Not v1                                                         |

No public discovery. Join is invite link only.

A user can belong to several trips and use several devices at once. Phone and partner's phone both editing the same trip is a normal case.

## 4. Core user stories

1. As a traveler, I create a trip, build an itinerary, and add packing items with no network, and everything shows up immediately.
2. As a trip owner, I invite someone with a shareable link. They join and see the current trip.
3. As two people editing the same trip while both online, I see the other person's changes within about a second without refreshing.
4. As someone who was offline for a 6-hour flight, when I reconnect my offline changes merge with whatever changed while I was away. My edits are still there. Nothing duplicates.
5. If I change an itinerary stop's time while someone else, offline at the same moment, changes its location, both edits survive. One does not wipe the other.
6. If I delete a packing item that someone else is editing offline, the app follows a documented rule instead of crashing or duplicating.
7. I can force-close the app mid-sync and reopen it without losing pending changes or corrupting the trip.
8. I see a small sync status, synced, syncing, or offline. Never a blocking spinner.
9. I see itinerary stops pinned on a map, including offline, using a pre-cached map region for the destination.
10. I can lock the app, or a single trip, behind Face ID, Touch ID, or fingerprint, whichever the device actually has.

## 5. Functional requirements

### 5.1 Trips

- Create trip: name, destination, date range, optional cover image and emoji.
- Trip home: cover, countdown to departure, packing, plan, map, spend.
- Rename trip, edit dates, delete trip. Delete is owner only.
- Invite via shareable link. Link expires after 7 days or first use, configurable.
- Member list. Owner can remove a member.
- Archive past trips. Per user. Archived trips are hidden by default.

### 5.2 Itinerary stops

Fields: title, day within the trip, optional start and end time, location name, optional map pin, short note, category, order within a day.

Categories: flight, lodging, food, activity, transit, other.

Add, edit, delete. Reorder within a day. Move between days.

Plan: day-by-day list, icons, times. During the trip dates, current and next stop are obvious.

Map: pins for stops that have a pin. Filter by day. Name-only stops stay on Plan.

### 5.3 Packing items

Fields: name, optional quantity such as "2 pairs", packed or not, optional note, optional assignee, order.

Add, edit, check, uncheck, delete, reorder. Swipe to check and delete, and a way to do that without a swipe.

Progress: "18 of 32 packed", per member and for the group.

Optional starter lists for beach, city, camping.

### 5.4 Expenses, after packing and itinerary work

Fields: title, amount and currency, who paid, who splits even, optional day, category.

Balances: who owes whom. Mixed currencies stay separate. No conversion.

One chart, spend by category or by day.

Ledger only. No pay, no settle.

### 5.5 Sync

The product promise is local-first edits, live updates when online, and a correct merge after offline. Behavior and rules: [`docs/architecture.md`](docs/architecture.md).

### 5.6 Auth

Sign in with a magic link.

### 5.7 Biometric lock

Optional app lock, off by default. Prompt on open and after returning from background. Grace: immediately, 1 minute, or 5 minutes.

Per-trip lock in phase 3. Owner can hide a trip's cover. Title still shows on the list.

If biometrics fail, use the device passcode. If the device has neither, lock cannot be turned on.

### 5.8 Notifications

During the trip dates, a local alert for the next stop, "{title} in 45 min".

No remote push in v1.

## 6. Done, as a portfolio piece

Demo video. Two devices planning a trip. Airplane mode toggled independently. Conflicting itinerary and packing edits. Reconnect. Correct merge live. Then map, timeline, home screen widget, biometric unlock.

## 7. Phasing

Screens: [`docs/ui.md`](docs/ui.md). Build: [`docs/architecture.md`](docs/architecture.md).

**Phase 1.** Trips, invites, packing. Usable offline. This alone is a demo.

**Phase 2.** Itinerary, plan, map.

**Phase 3.** App lock, per-trip lock, home screen widgets, next-stop alerts.

**Phase 4.** Expenses, balances, chart, demo video.

## 8. Open questions. Product. Do not guess

- Viewer role in v1, or cut it.
