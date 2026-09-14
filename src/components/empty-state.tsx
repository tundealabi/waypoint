import { View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme';

export function EmptyState({
  title,
  body,
  actionTitle,
  onAction,
}: {
  title: string;
  body: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <ThemedText variant="title" selectable style={{ textAlign: 'center' }}>
        {title}
      </ThemedText>
      <ThemedText variant="subhead" selectable style={{ textAlign: 'center' }}>
        {body}
      </ThemedText>
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}
