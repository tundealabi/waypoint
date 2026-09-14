import { Text, type TextProps, useColorScheme } from 'react-native';

import { type } from '@/theme';

type Variant = keyof typeof type;

export function ThemedText({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: Variant }) {
  useColorScheme();
  return <Text style={[type[variant], style]} {...props} />;
}
