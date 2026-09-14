import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { HeaderActions, HeaderIconButton } from '@/components/header-actions';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { TripCard } from '@/components/trip-card';
import { hasArchivedTrips, signOut, useWaypoint, visibleTrips } from '@/store';
import { colors, spacing } from '@/theme';

export default function TripListScreen() {
  const snapshot = useWaypoint();
  const [showArchived, setShowArchived] = useState(false);
  const trips = visibleTrips(showArchived);
  const archivedExists = hasArchivedTrips();

  return (
    <Screen grouped>
      <Stack.Screen
        options={{
          title: 'Trips',
          headerRight: () => (
            <HeaderActions
              extra={
                <>
                  <HeaderIconButton label="Add" onPress={() => router.push('/trip/new')} />
                  <HeaderIconButton
                    label="More"
                    onPress={() =>
                      Alert.alert('Account', snapshot.session?.email, [
                        { text: 'Sign out', style: 'destructive', onPress: signOut },
                        { text: 'Cancel', style: 'cancel' },
                      ])
                    }
                  />
                </>
              }
            />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, flexGrow: 1 }}
      >
        <View style={{ gap: spacing.sm }}>
          <SegmentedControl
            values={['Trips', 'Archived']}
            selectedIndex={showArchived ? 1 : 0}
            onChange={(event) => setShowArchived(event.nativeEvent.selectedSegmentIndex === 1)}
          />
          {snapshot.listError ? (
            <ThemedText variant="subhead" selectable style={{ color: colors.systemRed }}>
              {snapshot.listError}
            </ThemedText>
          ) : null}
        </View>
        {trips.length === 0 ? (
          showArchived ? (
            <EmptyState
              title="No archived trips"
              body="Archive a trip from its card menu to hide it from the main list. Archive stays on this device."
            />
          ) : archivedExists ? (
            <EmptyState
              title="Only archived trips"
              body="Your trips are archived on this device. Unarchive one to bring it back here."
              actionTitle="Show archived"
              onAction={() => setShowArchived(true)}
            />
          ) : (
            <EmptyState
              title="No trips yet"
              body="Create a trip or open an invite link you were sent."
              actionTitle="Create trip"
              onAction={() => router.push('/trip/new')}
            />
          )
        ) : (
          trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} archived={showArchived} href={`/trip/${trip.id}`} />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
