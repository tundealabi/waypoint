import { Button as NativeButton, FieldGroup, TextInput } from '@expo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { NativeHost } from '@/components/native-host';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useOnline } from '@/hooks';
import { queueMagicLink } from '@/store';
import { spacing } from '@/theme';

export default function SignInScreen() {
  const online = useOnline();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    if (!online) {
      setError('Network is required to sign in.');
      return;
    }
    setError(null);
    queueMagicLink(trimmed);
    router.push('/check-email');
  };

  return (
    <Screen grouped>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <ThemedText variant="subhead" selectable>
          We&apos;ll email a magic link. No password.
        </ThemedText>
        {error ? (
          <ThemedText variant="subhead" selectable style={{ marginTop: spacing.sm }}>
            {error}
          </ThemedText>
        ) : null}
      </View>
      <NativeHost>
        <FieldGroup>
          <FieldGroup.Section title="Email">
            <TextInput
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
            />
          </FieldGroup.Section>
          <NativeButton label="Send magic link" onPress={send} />
        </FieldGroup>
      </NativeHost>
    </Screen>
  );
}
