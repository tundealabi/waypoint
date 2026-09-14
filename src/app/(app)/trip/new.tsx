import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { Screen } from '@/components/screen';
import { addDaysIso, isValidDateRange, todayIso } from '@/lib/dates';
import { TripFields } from '@/screens/trip-fields';
import type { TripDraft } from '@/store';
import { createTrip } from '@/store';

export default function NewTripScreen() {
  const [draft, setDraft] = useState<TripDraft>(() => ({
    name: '',
    destination: '',
    startDate: todayIso(),
    endDate: addDaysIso(todayIso(), 3),
  }));

  const canSubmit = Boolean(draft.name.trim()) && isValidDateRange(draft.startDate, draft.endDate);

  return (
    <Screen grouped>
      <Stack.Screen options={{ title: 'New trip' }} />
      <TripFields
        draft={draft}
        onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        submitTitle="Create trip"
        submitDisabled={!canSubmit}
        onSubmit={() => {
          if (!canSubmit) {
            return;
          }
          const trip = createTrip(draft);
          router.replace(`/trip/${trip.id}`);
        }}
      />
    </Screen>
  );
}
