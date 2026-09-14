import { Button as NativeButton, FieldGroup, ListItem } from '@expo/ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { NativeHost } from '@/components/native-host';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { confirmDestructive } from '@/lib/confirm';
import { isValidDateRange } from '@/lib/dates';
import { inviteUrl } from '@/lib/invite-url';
import { firstParam } from '@/lib/params';
import { copyText, shareOrCopy } from '@/lib/share';
import { TripFields } from '@/screens/trip-fields';
import type { TripDraft } from '@/store';
import {
  createInvite,
  deleteTrip,
  getMembers,
  getTrip,
  isOwner,
  removeMember,
  updateTrip,
  useWaypoint,
} from '@/store';
import { spacing } from '@/theme';

export default function TripSettingsScreen() {
  useWaypoint();
  const tripId = firstParam(useLocalSearchParams<{ id: string }>().id);
  const trip = getTrip(tripId);
  const members = getMembers(tripId);
  const owner = isOwner(tripId);
  const [status, setStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<TripDraft | null>(() =>
    trip
      ? {
          name: trip.name,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          emoji: trip.emoji,
          coverUri: trip.coverUri,
        }
      : null
  );

  if (!trip || !draft) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Trip settings' }} />
        <EmptyState
          title="Trip not found"
          body="This trip is gone or you are no longer a member."
          actionTitle="Back to trips"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const canSave = Boolean(draft.name.trim()) && isValidDateRange(draft.startDate, draft.endDate);

  const invite = async () => {
    const created = createInvite(tripId);
    const url = inviteUrl(created.tripId, created.token);
    const result = await shareOrCopy(`Join ${trip.name} on Waypoint\n${url}`, url);
    setStatus(result === 'copied' ? 'Invite link copied.' : 'Invite ready to share.');
  };

  return (
    <Screen grouped>
      <Stack.Screen options={{ title: 'Trip settings' }} />
      <TripFields
        draft={draft}
        fill={false}
        onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
        submitTitle="Save"
        submitDisabled={!canSave}
        onSubmit={() => {
          if (!canSave) {
            return;
          }
          updateTrip(tripId, draft);
          setStatus('Saved.');
        }}
      />
      <NativeHost>
        <FieldGroup>
          <FieldGroup.Section title="People">
            {members.map((member) => (
              <ListItem
                key={member.id}
                supportingText={member.role === 'owner' ? 'Owner' : member.email}
                trailing={
                  owner && member.role !== 'owner' ? (
                    <ThemedText variant="subhead">Remove</ThemedText>
                  ) : undefined
                }
                onPress={
                  owner && member.role !== 'owner'
                    ? () =>
                        confirmDestructive(
                          'Remove member?',
                          `${member.name} will lose access to this trip.`,
                          'Remove',
                          () => removeMember(tripId, member.id)
                        )
                    : undefined
                }
              >
                {member.name}
              </ListItem>
            ))}
            {owner ? (
              <NativeButton label="Share invite link" onPress={() => void invite()} />
            ) : null}
            {owner ? (
              <NativeButton
                label="Copy invite link"
                variant="outlined"
                onPress={async () => {
                  const created = createInvite(tripId);
                  await copyText(inviteUrl(created.tripId, created.token));
                  setStatus('Invite link copied.');
                }}
              />
            ) : null}
          </FieldGroup.Section>
          {owner ? (
            <FieldGroup.Section title="Danger">
              <NativeButton
                label="Delete trip"
                onPress={() =>
                  confirmDestructive(
                    'Delete this trip?',
                    'Everyone will lose this trip. This cannot be undone here.',
                    'Delete',
                    () => {
                      deleteTrip(tripId);
                      router.replace('/');
                    }
                  )
                }
              />
            </FieldGroup.Section>
          ) : null}
        </FieldGroup>
      </NativeHost>
      {status ? (
        <View style={{ padding: spacing.md }}>
          <ThemedText variant="caption" selectable>
            {status}
          </ThemedText>
        </View>
      ) : null}
    </Screen>
  );
}
