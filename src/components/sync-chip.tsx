import { useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useWaypoint } from '@/store';
import { colors, radius, spacing } from '@/theme';

export function SyncChip() {
  useColorScheme();
  const { syncStatus, pendingMutations } = useWaypoint();

  const label =
    syncStatus === 'syncing'
      ? 'Syncing…'
      : syncStatus === 'offline'
        ? `Offline, ${pendingMutations} changes pending`
        : 'Synced';

  return (
    <View
      accessibilityLabel={label}
      style={{
        maxWidth: 180,
        minHeight: 28,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: colors.secondarySystemFill,
        justifyContent: 'center',
      }}
    >
      <ThemedText variant="caption" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
        {label}
      </ThemedText>
    </View>
  );
}
