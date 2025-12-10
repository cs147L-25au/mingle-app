// Citation: Animated Tab Bar inspiration from https://www.behance.net/gallery/209899519/Mobile-Tab-Bar-Micro-Interaction-Design?tracking_source=search_projects|tab+bar+animation&l=1
import { Fragment, useEffect, useRef } from "react";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Pressable,
} from "react-native";
import { theme } from "../assets/theme";
import { router } from "expo-router";
import { Octicons, Ionicons } from "@expo/vector-icons";

const { tabColors, sizes } = theme;

type TabBarItemProps = {
  icon: React.ReactElement;
  isFocused: boolean;
  onPress: () => void;
};

function getTabIcon(name: string, color: string, size: number) {
  switch (name) {
    case "index":
      return <Octicons name="home-fill" size={size - 6} color={color} />;
    case "feed":
      return <Ionicons name="compass" size={size} color={color} />;
    case "messages":
      return <Ionicons name="chatbubble-ellipses" size={size} color={color} />;
    case "profile":
      return <Ionicons name="person" size={size - 1} color={color} />;
    default:
      return <Ionicons name="ellipse" size={size} color={color} />;
  }
}

export default function AnimatedTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          // Checks if the currently rendered page is currently active
          const isFocused = state.index === index;

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          const icon = getTabIcon(
            route.name,
            isFocused ? tabColors.activeColor : tabColors.inactiveColor,
            sizes.tabIcons
          );

          return (
            <Fragment key={route.key}>
              {index === 2 && (
                <Pressable
                  style={styles.tabItem}
                  onPress={() => router.push("/create-activity")}
                >
                  <View style={styles.plusCircle}>
                    <Ionicons name="add" size={30} color="white" />
                  </View>
                </Pressable>
              )}

              <TabBarItem icon={icon} isFocused={isFocused} onPress={onPress} />
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

function TabBarItem({ icon, isFocused, onPress }: TabBarItemProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1, // rotate left
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1, // then rotate right
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0, // back to center
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset when unfocused
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, shakeAnim]);

  // Map -1 → right tilt, 1 → left tilt
  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["45deg", "0deg", "-45deg"],
  });

  const scale = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.1, 1, 1.1],
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
        {icon}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: tabColors.white,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "space-around",
    width: "90%",

    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  plusCircle: {
    width: sizes.plusIcon,
    aspectRatio: 1,
    borderRadius: sizes.plusIconRadius,
    backgroundColor: tabColors.createActivity,
    alignItems: "center",
    justifyContent: "center",
  },
});
