import { Stack } from 'expo-router/stack';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Trips', headerLargeTitleEnabled: true }} />
      <Stack.Screen
        name="trip/new"
        options={{
          title: 'New trip',
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.75, 1],
        }}
      />
      <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
