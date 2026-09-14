import { Stack } from 'expo-router/stack';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Waypoint', headerLargeTitleEnabled: true }} />
      <Stack.Screen name="check-email" options={{ title: 'Check email' }} />
      <Stack.Screen name="expired-link" options={{ title: 'Link expired' }} />
    </Stack>
  );
}
