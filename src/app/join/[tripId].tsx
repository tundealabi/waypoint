import { Button as NativeButton, FieldGroup } from '@expo/ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { NativeHost } from '@/components/native-host';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { formatDateRange } from '@/lib/dates';
import { firstParam } from '@/lib/params';
import { getTrip, joinTrip, peekJoin, stashPendingJoin, useWaypoint } from '@/store';
import { spacing } from '@/theme';

export default function JoinScreen() {
  const snapshot = useWaypoint();
  const params = useLocalSearchParams<{ tripId: string; token?: string }>();
  const tripId = firstParam(params.tripId);
  const token = firstParam(params.token);
  const trip = getTrip(tripId);
  const preview = token
    ? peekJoin(tripId, token)
    : { ok: false as const, reason: 'invalid' as const };

  useEffect(() => {
    if (!snapshot.session && tripId && token) {
      stashPendingJoin(tripId, token);
      router.replace('/');
    }
  }, [snapshot.session, tripId, token]);

  if (!snapshot.session) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Join trip' }} />
        <EmptyState
          title="Sign in to join"
          body="Network is required to sign in, then we'll open this invite."
        />
      </Screen>
    );
  }

  if (!trip || (!preview.ok && preview.reason === 'missing')) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Join trip' }} />
        <EmptyState
          title="Invite not found"
          body="This trip is gone, or the link is missing a trip."
          actionTitle="Back to trips"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  if (!preview.ok) {
    const body =
      preview.reason === 'expired'
        ? 'This invite expired. Ask the owner to send a new link.'
        : preview.reason === 'used'
          ? 'This invite was already used. Ask the owner to send a new link.'
          : 'This invite is invalid. Ask the owner for a new link.';
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Join trip' }} />
        <EmptyState
          title="You can’t join this trip"
          body={body}
          actionTitle="Back to trips"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  if (preview.alreadyMember) {
    return (
      <Screen grouped>
        <Stack.Screen options={{ title: 'Join trip' }} />
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <ThemedText variant="title" selectable>
            You&apos;re already in {trip.name}
          </ThemedText>
          <ThemedText variant="subhead" selectable>
            {trip.destination}
          </ThemedText>
        </View>
        <NativeHost>
          <FieldGroup>
            <NativeButton label="Open trip" onPress={() => router.replace(`/trip/${trip.id}`)} />
          </FieldGroup>
        </NativeHost>
      </Screen>
    );
  }

  return (
    <Screen grouped>
      <Stack.Screen options={{ title: 'Join trip' }} />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <ThemedText variant="title" selectable>
          Join {trip.name}?
        </ThemedText>
        <ThemedText variant="subhead" selectable>
          {trip.destination}
        </ThemedText>
        <ThemedText variant="caption" selectable>
          {formatDateRange(trip.startDate, trip.endDate)}
        </ThemedText>
      </View>
      <NativeHost>
        <FieldGroup>
          <NativeButton
            label="Join trip"
            onPress={() => {
              const joined = joinTrip(tripId, token);
              if (joined.ok) {
                router.replace(`/trip/${tripId}`);
                return;
              }
              Alert.alert('Could not join', 'This invite is no longer valid.');
            }}
          />
          <NativeButton label="Not now" variant="text" onPress={() => router.replace('/')} />
        </FieldGroup>
      </NativeHost>
    </Screen>
  );
}
