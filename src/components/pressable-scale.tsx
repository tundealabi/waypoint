import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';

export function PressableScale({
  children,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'children'> & { children: ReactNode }) {
  return (
    <Pressable
      disabled={disabled}
      hitSlop={8}
      pressRetentionOffset={16}
      style={(state) => [
        {
          transform: [{ scale: state.pressed && !disabled ? 0.97 : 1 }],
          opacity: disabled ? 0.4 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
