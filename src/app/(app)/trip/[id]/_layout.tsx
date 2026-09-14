import { Stack } from 'expo-router/stack';

export default function TripLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerLargeTitleEnabled: false }} />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Trip settings',
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.75, 1],
        }}
      />
    </Stack>
  );
}
