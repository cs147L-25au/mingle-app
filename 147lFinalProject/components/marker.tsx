import React from "react";

import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { theme } from "../assets/theme";
import { Event } from "../utils/types";
import { getActivityStyle } from "../utils/getEventIcons";

type EventMarkersProps = {
  events: Event[];
};

const { sizes, markerColors } = theme;

export default function EventMarkers({ events }: EventMarkersProps) {
  return (
    <>
      {events
        .filter((event) => event.latitude != null && event.longitude != null)
        .map((event) => {
          const { icon, color } = getActivityStyle(event.activity_type);

          return (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.latitude!,
                longitude: event.longitude!,
              }}
              title={event.name}
              description={event.location ?? undefined}
              anchor={{ x: 0.5, y: 1 }}
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
    height: sizes.markerOuterCircle,
    aspectRatio: 1,

    borderRadius: sizes.markerOuterCircleRadius,
    alignItems: "center",
    justifyContent: "center",

    zIndex: 2,
    elevation: 3, // stays above tip
  },

  innerCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: markerColors.White,

    height: sizes.markerInnerCircle,
    aspectRatio: 1,
    borderRadius: sizes.markerInnerCircleRadius,

    zIndex: 3, // icon layer on top of circle
    elevation: 4,
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -5.2,

    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 13, // taller triangle

    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
