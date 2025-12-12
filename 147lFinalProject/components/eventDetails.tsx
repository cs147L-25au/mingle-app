import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { Event, ActivityType } from "../utils/types";
import { theme } from "../assets/theme";
import { ImageSourcePropType } from "react-native";
import supabase from "../supabase";
import { useEffect, useState } from "react";
import OrganizerProfile from "./organizerProfile";

const { eventModal, tabColors } = theme;

type EventDetailsProps = {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  currentUserId: string;
};

export const activityImages: Record<ActivityType, ImageSourcePropType> = {
  "Food & Dining": require("../assets/activities/food.jpg"),
  Hiking: require("../assets/activities/nature.jpg"),
  Movies: require("../assets/activities/cinema.jpg"),
  Concerts: require("../assets/activities/concert.jpg"),
  Sports: require("../assets/activities/sports.jpg"),
  Gaming: require("../assets/activities/gaming.jpg"),
  "Art & Museums": require("../assets/activities/museum.jpg"),
  "Coffee & Cafes": require("../assets/activities/coffee.jpg"),
  Home: require("../assets/activities/home.jpg"),
  Other: require("../assets/activities/other.jpg"),
};

export default function EventDetails({
  visible,
  event,
  onClose,
  currentUserId,
}: EventDetailsProps) {
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [organizerProfileVisible, setOrganizerProfileVisible] = useState(false);
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  // Check if the current user is already attending this event
  useEffect(() => {
    const checkAttendance = async () => {
      if (!event || !currentUserId) return;

      const { data, error } = await supabase
        .from("event_attendees")
        .select("event_id")
        .eq("event_id", event.id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (!error && data) {
        setIsAttending(true);
      } else {
        setIsAttending(false);
      }
    };

    checkAttendance();
  }, [event?.id, currentUserId]);

  const handleAttendPress = async () => {
    if (!event || !currentUserId) return;

    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.from("event_attendees").upsert(
      {
        event_id: event.id,
        user_id: currentUserId,
      },
      { onConflict: "event_id,user_id" } // composite key
    );

    setLoading(false);

    if (error) {
      console.log("Error signing up:", error);
      setErrorMsg("Something went wrong. Please try again.");
      return;
    }

    setIsAttending(true);
  };

  const handleViewOrganizer = async () => {
    if (!event) return;

    // Fetch organizer_id from the event
    const { data, error } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event.id)
      .single();

    if (error) {
      console.error("Error fetching organizer:", error);
      return;
    }

    if (data?.organizer_id) {
      setOrganizerId(data.organizer_id);
      setOrganizerProfileVisible(true);
    }
  };

  if (!event) return null;

  const formattedDate = (() => {
    if (!event.event_date) return "";
    const iso = event.event_date + "T00:00:00Z";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();

  const descriptionText = (event.description ?? "").trim();
  const locationText = (event.location ?? "").trim();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* IMAGE HEADER */}
          <View style={styles.bannerWrapper}>
            <Image
              source={activityImages[event.activity_type]}
              style={styles.bannerImage}
              resizeMode="cover"
            />

            {/* tinted overlay over the whole image */}
            <View style={styles.imageOverlay} />

            {/* close button */}
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.close}>✕</Text>
            </Pressable>

            {/* header content */}
            <View style={styles.bannerContent}>
              <Text style={styles.bannerLabel}>Event Details</Text>
              <Text style={styles.bannerTitle} numberOfLines={2}>
                {event.name}
              </Text>

              <View style={styles.bannerChipsRow}>
                {event.activity_type !== "Home" ? (
                  <View style={styles.bannerChip}>
                    <Text style={styles.bannerChipText}>
                      {event.activity_type}
                    </Text>
                  </View>
                ) : null}

                {event.time_slot ? (
                  <View style={styles.bannerChip}>
                    <Text style={styles.bannerChipText}>{event.time_slot}</Text>
                  </View>
                ) : null}

                {event.price_range ? (
                  <View style={styles.bannerChip}>
                    <Text style={styles.bannerChipText}>
                      {event.price_range}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
          >
            {/* floating white card */}
            <View style={styles.card}>
              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description:</Text>
                <Text style={styles.sectionText}>
                  {descriptionText || "No description provided yet."}
                </Text>
              </View>

              {/* Date */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date:</Text>
                <Text style={styles.sectionText}>{formattedDate}</Text>
              </View>

              {/* Location */}
              {!!locationText && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Location:</Text>
                  <Text style={styles.sectionText}>{locationText}</Text>
                </View>
              )}

              {/* View Organizer button */}
              {event.activity_type !== "Home" ? (
                <Pressable
                  style={styles.viewOrganizerButton}
                  onPress={handleViewOrganizer}
                >
                  <Text style={styles.viewOrganizerButtonText}>
                    👤 View Organizer
                  </Text>
                </Pressable>
              ) : null}

              {/* Attend button */}
              {event.activity_type !== "Home" ? (
                <Pressable
                  style={[
                    styles.attendButton,
                    (loading || isAttending) && styles.attendButtonDisabled,
                  ]}
                  onPress={handleAttendPress}
                  disabled={loading || isAttending}
                >
                  <Text style={styles.attendButtonText}>
                    {isAttending
                      ? "You're going 🎉"
                      : loading
                      ? "Saving..."
                      : "I'm in"}
                  </Text>
                </Pressable>
              ) : null}

              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Organizer Profile Modal */}
      <OrganizerProfile
        visible={organizerProfileVisible}
        organizerId={organizerId}
        onClose={() => setOrganizerProfileVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f3f4f6",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    minHeight: "60%",
    maxHeight: "85%",
  },
  bannerWrapper: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  close: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  bannerContent: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
  },
  bannerLabel: {
    fontSize: 12,
    color: "#E5E7EB",
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  bannerChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bannerChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: eventModal.chipColors,
  },
  bannerChipText: {
    fontSize: 12,
    color: "#ECFEFF",
  },

  /* --- body / card --- */
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: -12, // slight overlap with header area
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  activityTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    color: "#4F46E5",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 12,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#4B5563",
  },
  attendButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tabColors.inactiveColor,
  },
  attendButtonDisabled: {
    opacity: 0.7,
  },
  attendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#DC2626",
  },
  viewOrganizerButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3DFED",
    borderWidth: 1.5,
    borderColor: "#8174A0",
  },
  viewOrganizerButtonText: {
    color: "#8174A0",
    fontSize: 15,
    fontWeight: "600",
  },
});
