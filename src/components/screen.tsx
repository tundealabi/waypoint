import type { ReactNode } from 'react';
import { useColorScheme, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

export function Screen({
  children,
  grouped = false,
  style,
}: {
  children: ReactNode;
  grouped?: boolean;
  style?: ViewStyle;
}) {
  useColorScheme();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: grouped ? colors.systemGroupedBackground : colors.systemBackground,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
