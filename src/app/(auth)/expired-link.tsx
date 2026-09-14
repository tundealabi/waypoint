import { Button as NativeButton, FieldGroup } from '@expo/ui';
import { router } from 'expo-router';
import { View } from 'react-native';

import { NativeHost } from '@/components/native-host';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme';

export default function ExpiredLinkScreen() {
  return (
    <Screen grouped>
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <ThemedText variant="title" selectable>
          This link is no longer valid
        </ThemedText>
        <ThemedText variant="subhead" selectable>
          It expired or was already used. Send a new magic link to sign in.
        </ThemedText>
      </View>
      <NativeHost>
        <FieldGroup>
          <NativeButton label="Sign in again" onPress={() => router.replace('/')} />
        </FieldGroup>
      </NativeHost>
    </Screen>
  );
}
