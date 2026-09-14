import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { SyncChip } from '@/components/sync-chip';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';

export function HeaderActions({ extra }: { extra?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <SyncChip />
      {extra}
    </View>
  );
}

export function HeaderIconButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <ThemedText variant="headline" style={{ color: colors.systemBlue }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
