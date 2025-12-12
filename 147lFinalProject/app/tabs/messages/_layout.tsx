import { Stack } from "expo-router";

// TODO: leaving `headerShown: true` for now, since it ensures all messages are visible, but it needs to be fixed
export default function MessagesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
