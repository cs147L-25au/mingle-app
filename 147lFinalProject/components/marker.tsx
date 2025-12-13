import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { theme } from "../assets/theme";
import { Event } from "../utils/types";
import { getActivityStyle } from "../utils/getEventIcons";
import { Platform } from "react-native";

type EventMarkersProps = {
  events: Event[];
  onEventPress?: (event: Event) => void;
};

const { sizes, markerColors } = theme;
const isAndroid = Platform.OS === "android";

export default function EventMarkers({
  events,
  onEventPress,
}: EventMarkersProps) {
  const coordCounts = new Map<string, number>();

  return (
    <>
      {events
        .filter((event) => event.latitude != null && event.longitude != null)
        // Logic to create marker offsets for events at duplicate locations:
        .map((event) => {
          const { icon, color } = getActivityStyle(event.activity_type);

          const baseLat = event.latitude;
          const baseLng = event.longitude;

          // Key = rounded coordinate
          const key = `${baseLat.toFixed(5)},${baseLng.toFixed(5)}`;
          const seenCount = coordCounts.get(key) ?? 0;
          coordCounts.set(key, seenCount + 1);

          let latitude = baseLat;
          let longitude = baseLng;

          if (seenCount > 0) {
            // Only offset if this location has already appeared
            const radius = 0.0009;
            const angle = ((seenCount - 1) % 6) * ((2 * Math.PI) / 6); // spread around in up to 6 directions

            latitude = baseLat + radius * Math.cos(angle);
            longitude = baseLng + radius * Math.sin(angle);
          }

          return (
            <Marker
              key={event.id}
              coordinate={{
                latitude: latitude,
                longitude: longitude,
              }}
              title={event.name}
              description={event.location ?? undefined}
              anchor={{ x: 0.5, y: 1 }}
              onPress={(e) => {
                e.stopPropagation?.(); // optional, but helps avoid MapView onPress conflicts
                onEventPress?.(event);
              }}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.outerCircle, { backgroundColor: color }]}>
                  <View style={styles.innerCircle}>{icon}</View>
                </View>
                <View style={[styles.pinTip, { borderTopColor: color }]} />
              </View>
            </Marker>
          );
        })}
    </>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
  },

  outerCircle: {
    height: isAndroid
      ? sizes.markerOuterCircleAndroid
      : sizes.markerOuterCircle,
    aspectRatio: 1,

    borderRadius: isAndroid
      ? sizes.markerOuterCircleRadiusAndroid
      : sizes.markerOuterCircleRadius,
    alignItems: "center",
    justifyContent: "center",

    zIndex: 2,
    elevation: 3, // stays above tip
  },

  innerCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: markerColors.White,

    height: isAndroid
      ? sizes.markerInnerCircleAndroid
      : sizes.markerInnerCircle,
    aspectRatio: 1,
    borderRadius: isAndroid
      ? sizes.markerInnerCircleRadiusAndroid
      : sizes.markerInnerCircleRadius,

    zIndex: 3, // icon layer on top of circle
    elevation: 4,
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: isAndroid ? -3 : -5.2,

    borderLeftWidth: isAndroid ? 9.3 : 14,
    borderRightWidth: isAndroid ? 9.3 : 14,
    borderTopWidth: isAndroid ? 10 : 13, // taller triangle

    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
