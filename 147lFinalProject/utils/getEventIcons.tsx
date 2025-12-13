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
import { Platform } from "react-native";

const isAndroid = Platform.OS === "android";
const { sizes, markerColors } = theme;
const size = isAndroid ? sizes.markerIconAndroid : sizes.markerIcon;

function getActivityIcon(activity: ActivityType) {
  switch (activity) {
    case "Food & Dining":
      return (
        <MaterialCommunityIcons
          name="food-fork-drink"
          size={size}
          color={markerColors["Food & Dining"]}
        />
      );

    case "Hiking":
      return (
        <FontAwesome6
          name="person-hiking"
          size={size}
          color={markerColors.Hiking}
        />
      );

    case "Movies":
      return (
        <MaterialIcons name="movie" size={size} color={markerColors.Movies} />
      );

    case "Concerts":
      return (
        <Ionicons
          name="musical-notes"
          size={size}
          color={markerColors.Concerts}
        />
      );

    case "Sports":
      return (
        <Ionicons name="tennisball" size={size} color={markerColors.Sports} />
      );

    case "Gaming":
      return (
        <Entypo
          name="game-controller"
          size={size}
          color={markerColors.Gaming}
        />
      );

    case "Art & Museums":
      return (
        <FontAwesome6
          name="palette"
          size={size}
          color={markerColors["Art & Museums"]}
        />
      );

    case "Coffee & Cafes":
      return (
        <FontAwesome
          name="coffee"
          size={size}
          color={markerColors["Coffee & Cafes"]}
        />
      );

    case "Other":
      return (
        <MaterialIcons
          name="emoji-people"
          size={size}
          color={markerColors.Other}
        />
      );

    case "Home":
      return <Entypo name="home" size={size} color={markerColors.Home} />;
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
