import { Image } from 'expo-image';
import { type Href, Link } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { countdownLabel, formatDateRange } from '@/lib/dates';
import type { Trip } from '@/store';
import { setTripArchived } from '@/store';
import { colors, radius, shadows, spacing } from '@/theme';

export function TripCard({ trip, href, archived }: { trip: Trip; href: Href; archived: boolean }) {
  useColorScheme();
  const reduced = useReducedMotion();
  const countdown = archived ? null : countdownLabel(trip.startDate);

  return (
    <Link href={href} asChild>
      <Link.Trigger withAppleZoom={!reduced}>
        <PressableScale
          accessibilityRole="link"
          accessibilityLabel={`${trip.name}, ${trip.destination}, ${formatDateRange(trip.startDate, trip.endDate)}`}
        >
          <Link.AppleZoom>
            <View
              style={{
                backgroundColor: colors.secondarySystemGroupedBackground,
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                overflow: 'hidden',
                boxShadow: shadows.card,
              }}
            >
              <Cover trip={trip} />
              <View style={{ padding: spacing.md, gap: spacing.xs }}>
                <ThemedText variant="headline" selectable>
                  {trip.emoji ? `${trip.emoji} ${trip.name}` : trip.name}
                </ThemedText>
                <ThemedText variant="subhead" selectable>
                  {trip.destination}
                </ThemedText>
                <ThemedText variant="caption" selectable>
                  {formatDateRange(trip.startDate, trip.endDate)}
                  {countdown ? ` · ${countdown}` : ''}
                </ThemedText>
              </View>
            </View>
          </Link.AppleZoom>
        </PressableScale>
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction
          icon={archived ? 'tray.and.arrow.up' : 'archivebox'}
          onPress={() => setTripArchived(trip.id, !archived)}
        >
          {archived ? 'Unarchive' : 'Archive'}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}

function Cover({ trip }: { trip: Trip }) {
  if (trip.coverUri) {
    return (
      <Image
        source={{ uri: trip.coverUri }}
        style={{ width: '100%', height: 140 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        height: 88,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.secondarySystemFill,
      }}
    >
      <ThemedText variant="largeTitle">{trip.emoji ?? '🧳'}</ThemedText>
    </View>
  );
}
