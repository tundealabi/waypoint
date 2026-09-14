import { Pressable, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';

export function Banner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  useColorScheme();
  return (
    <View
      style={{
        backgroundColor: colors.secondarySystemBackground,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <ThemedText variant="subhead" selectable>
        {message}
      </ThemedText>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
          onPress={onDismiss}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <ThemedText variant="headline" style={{ color: colors.systemBlue }}>
            Dismiss
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
