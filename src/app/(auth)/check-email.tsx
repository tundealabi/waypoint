import { Button as NativeButton, FieldGroup } from '@expo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { NativeHost } from '@/components/native-host';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useOnline } from '@/hooks';
import { queueMagicLink, takePendingJoin, useWaypoint, verifyMagicLink } from '@/store';
import { spacing } from '@/theme';

export default function CheckEmailScreen() {
  const online = useOnline();
  const { pendingEmail, magicLink } = useWaypoint();
  const [error, setError] = useState<string | null>(null);

  const resend = () => {
    if (!pendingEmail) {
      router.replace('/');
      return;
    }
    if (!online) {
      setError('Network is required to sign in.');
      return;
    }
    setError(null);
    queueMagicLink(pendingEmail);
  };

  const openLink = () => {
    if (!magicLink) {
      router.replace('/expired-link');
      return;
    }
    const result = verifyMagicLink(magicLink.token);
    if (!result.ok) {
      router.replace('/expired-link');
      return;
    }
    const pendingJoin = takePendingJoin();
    if (pendingJoin) {
      router.replace(`/join/${pendingJoin.tripId}?token=${encodeURIComponent(pendingJoin.token)}`);
      return;
    }
    router.replace('/');
  };

  return (
    <Screen grouped>
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <ThemedText variant="title" selectable>
          Check your email
        </ThemedText>
        <ThemedText variant="subhead" selectable>
          {pendingEmail
            ? `We sent a sign-in link to ${pendingEmail}. Open it on this phone.`
            : 'We sent a sign-in link. Open it on this phone.'}
        </ThemedText>
        {error ? (
          <ThemedText variant="subhead" selectable>
            {error}
          </ThemedText>
        ) : null}
      </View>
      <NativeHost>
        <FieldGroup>
          <NativeButton label="Open magic link" onPress={openLink} />
          <NativeButton label="Resend link" variant="outlined" onPress={resend} />
        </FieldGroup>
      </NativeHost>
    </Screen>
  );
}
