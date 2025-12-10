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

const { sizes, markerColors } = theme;

function getActivityIcon(activity: ActivityType) {
  switch (activity) {
    case "Food & Dining":
      return (
        <MaterialCommunityIcons
          name="food-fork-drink"
          size={sizes.markerIcon}
          color={markerColors["Food & Dining"]}
        />
      );

    case "Hiking":
      return (
        <FontAwesome6
          name="person-hiking"
          size={sizes.markerIcon}
          color={markerColors.Hiking}
        />
      );

    case "Movies":
      return (
        <MaterialIcons
          name="movie"
          size={sizes.markerIcon}
          color={markerColors.Movies}
        />
      );

    case "Concerts":
      return (
        <Ionicons
          name="musical-notes"
          size={sizes.markerIcon}
          color={markerColors.Concerts}
        />
      );

    case "Sports":
      return (
        <Ionicons
          name="tennisball"
          size={sizes.markerIcon}
          color={markerColors.Sports}
        />
      );

    case "Gaming":
      return (
        <Entypo
          name="game-controller"
          size={sizes.markerIcon}
          color={markerColors.Gaming}
        />
      );

    case "Art & Museums":
      return (
        <FontAwesome6
          name="palette"
          size={sizes.markerIcon}
          color={markerColors["Art & Museums"]}
        />
      );

    case "Coffee & Cafes":
      return (
        <FontAwesome
          name="coffee"
          size={sizes.markerIcon}
          color={markerColors["Coffee & Cafes"]}
        />
      );

    case "Other":
      return (
        <MaterialIcons
          name="emoji-people"
          size={sizes.markerIcon}
          color={markerColors.Other}
        />
      );

    case "Home":
      return (
        <Entypo name="home" size={sizes.markerIcon} color={markerColors.Home} />
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
