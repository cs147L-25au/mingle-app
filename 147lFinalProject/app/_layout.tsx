// Citation: Provided code in app/_layout.tsx from A3
import { Slot } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  useEffect(() => {
    AsyncStorage.removeItem("userLocation");
  }, []);

  return <Slot />;
}
