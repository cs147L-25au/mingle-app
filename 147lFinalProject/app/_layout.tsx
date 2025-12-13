// Citation: Provided code in app/_layout.tsx from A3
import { Slot } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  // Clear location cache when app opens to force fresh location fetch
  useEffect(() => {
    AsyncStorage.removeItem("userLocation");
  }, []);

  // A slot layout just overrides the default layout to ensure that our screen background bleeds
  // into the status bar. We use it just for the login screen.
  return <Slot />;
}
