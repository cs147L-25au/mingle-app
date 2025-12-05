import { ActivityType } from "./types";
import { theme } from "../assets/theme";
import {
  FontAwesome6,
  MaterialCommunityIcons,
  Ionicons,
  Entypo,
  MaterialIcons,
  FontAwesome,
} from "@expo/vector-icons";

function getActivityIcon(activity: ActivityType) {
  switch (activity) {
    case "Food & Dining":
      return (
        <MaterialCommunityIcons
          name="food-fork-drink"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );

    case "Hiking":
      return (
        <FontAwesome6
          name="person-hiking"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );

    case "Movies":
      return (
        <MaterialIcons
          name="movie"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );

    case "Concerts":
      return (
        <Ionicons
          name="musical-notes"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );

    case "Sports":
      return (
        <Ionicons
          name="tennisball"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );

    case "Gaming":
      return (
        <Entypo
          name="game-controller"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );

    case "Art & Museums":
      return (
        <FontAwesome6
          name="palette"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );

    case "Coffee & Cafes":
      return (
        <FontAwesome
          name="coffee"
          size={theme.sizes.markerIcon}
          color="black"
        />
      );
  }
}

function getActivityColor(activity: ActivityType) {
  return theme.markerColors[activity];
}

export function getActivityStyle(activity: ActivityType) {
  return {
    icon: getActivityIcon(activity),
    color: getActivityColor(activity),
  };
}
