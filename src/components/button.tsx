import { ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';

const variants = {
  primary: { backgroundColor: colors.systemBlue, color: colors.onTint },
  secondary: { backgroundColor: colors.secondarySystemFill, color: colors.label },
  destructive: { backgroundColor: colors.systemRed, color: colors.onTint },
} as const;

const sizes = {
  sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
} as const;

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  onPress,
}: {
  title: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const palette = variants[variant];
  return (
    <PressableScale
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          backgroundColor: palette.backgroundColor,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          alignItems: 'center',
          minHeight: 44,
          justifyContent: 'center',
          ...sizes[size],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.color as string} />
      ) : (
        <ThemedText variant="headline" style={{ color: palette.color }}>
          {title}
        </ThemedText>
      )}
    </PressableScale>
  );
}
