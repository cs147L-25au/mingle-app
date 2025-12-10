/* Citations for react-native-maps:
 * 1. official documentation: https://docs.expo.dev/versions/latest/sdk/map-view/
 * 2. tutorials on sample usage (style/interactivity): https://www.npmjs.com/package/react-native-maps
 * 3. tutorials on customizing the map: https://blog.spirokit.com/maps-in-react-native-a-step-by-step-guide
 * 4. tutorials on customizing the map pins: https://blog.spirokit.com/maps-in-react-native-adding-interactive-markers
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { mapStyle } from "../assets/mapStyle";
import { Event } from "../utils/types";
import EventMarkers from "./marker";
import supabase from "../supabase";
import EventDetails from "./eventDetails";
import useSession from "../utils/useSession";

export default function Map() {
  // Citation for location code: Lecture 5a snack - https://snack.expo.dev/@alan7cheng/cs-147l-25au---lecture-5a
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [dbEvents, setDbEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const session = useSession();

  const getLocation = () => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied...");
          return null;
        }
        return Location.getCurrentPositionAsync();
      })
      .then((loc) => {
        if (loc != null) {
          setLocation(loc);
          const { latitude, longitude } = loc.coords;
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      });
  };

  const fetchEvents = async () => {
    try {
      // Today's date in local time, as "YYYY-MM-DD"
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true });

      setDbEvents(data ?? []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Home/current location isn't (and shouldn't) be stored in DB, so this function resolves that
  const events = useMemo(() => {
    if (!region) return dbEvents;

    const home: Event = {
      id: "home-event",
      name: "Home",
      description: "",
      activity_type: "Home",
      price_range: "",
      time_slot: "",
      location: "You are here!",
      event_date: "2025-12-25",
      latitude: region.latitude,
      longitude: region.longitude,
    };

    return [...dbEvents, home];
  }, [dbEvents, region]);

  useEffect(() => {
    getLocation();
    fetchEvents();

    const channel = supabase
      .channel("realtime-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          console.log("Events changed:", payload);
          fetchEvents();
        }
      )
      .subscribe();
  }, []);

  // Make the map refocus so that most markers appear
  useEffect(() => {
    if (!mapRef.current || !region) return;
    if (events.length === 0) return;

    const coords = events
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        latitude: e.latitude as number,
        longitude: e.longitude as number,
      }));

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true,
    });
  }, [region, events]);

  // While we don't have a region yet, show a simple loading / error UI
  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Getting your location…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        key={events.length}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false}
        customMapStyle={mapStyle}
      >
        <EventMarkers events={events} onEventPress={setSelectedEvent} />
      </MapView>

      <EventDetails
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        currentUserId={session.user.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
