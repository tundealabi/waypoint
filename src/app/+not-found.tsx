import { Link, Stack } from 'expo-router';
import { ScrollView } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Not found' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      >
        <ThemedText variant="title" selectable>
          This screen does not exist
        </ThemedText>
        <ThemedText variant="subhead" selectable>
          Go back to your trips.
        </ThemedText>
        <Link href="/" asChild>
          <Button title="Trips" />
        </Link>
      </ScrollView>
    </Screen>
  );
}
