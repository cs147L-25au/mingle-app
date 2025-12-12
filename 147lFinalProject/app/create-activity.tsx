import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import supabase from "../supabase";
import { geocodeLocation } from "../utils/geocoding";
import { theme } from "../assets/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import useSession from "../utils/useSession";

const { tabColors } = theme;

// Activity types matching the profile interests
const ACTIVITY_TYPES = [
  "Food & Dining",
  "Hiking",
  "Movies",
  "Concerts",
  "Sports",
  "Gaming",
  "Art & Museums",
  "Coffee & Cafes",
  "Other",
];

const PRICE_RANGES = ["Free", "$", "$$", "$$$", "$$$$"];

const TIME_OPTIONS = [
  "Morning (6am-12pm)",
  "Afternoon (12pm-5pm)",
  "Evening (5pm-9pm)",
  "Night (9pm-late)",
  "Flexible",
];

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder: string;
}

const Dropdown = ({
  label,
  value,
  options,
  onSelect,
  placeholder,
}: DropdownProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} *</Text>
      <Pressable style={styles.dropdown} onPress={() => setModalVisible(true)}>
        <Text style={[styles.dropdownText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.option,
                    value === option && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function CreateActivity() {
  const router = useRouter();
  const session = useSession();
  const [activityName, setActivityName] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  // Check if user has a profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking profile:", error);
        return;
      }

      setHasProfile(!!data);

      // If no profile, show alert and redirect
      if (!data) {
        Alert.alert(
          "Profile Required",
          "You need to create a profile before creating activities.",
          [
            {
              text: "Create Profile",
              onPress: () => router.push("/create-profile"),
            },
            {
              text: "Cancel",
              onPress: () => router.back(),
              style: "cancel",
            },
          ]
        );
      }
    };

    checkProfile();
  }, [session?.user?.id]);

  const handleCreateActivity = async () => {
    // Check authentication
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to create an activity");
      return;
    }

    // Check profile
    if (!hasProfile) {
      Alert.alert(
        "Profile Required",
        "Please create a profile before creating activities.",
        [
          {
            text: "Create Profile",
            onPress: () => router.push("/create-profile"),
          },
        ]
      );
      return;
    }

    // Validation
    if (!activityName.trim()) {
      Alert.alert("Error", "Please enter an activity name");
      return;
    }

    if (!activityType) {
      Alert.alert("Error", "Please select an activity type");
      return;
    }

    if (!priceRange) {
      Alert.alert("Error", "Please select a price range");
      return;
    }

    if (!timeSlot) {
      Alert.alert("Error", "Please select a time");
      return;
    }

    if (!date) {
      Alert.alert("Error", "Please enter a date");
      return;
    }

    if (!location.trim()) {
      Alert.alert("Error", "Please enter a location");
      return;
    }

    setLoading(true);

    try {
      // Test connection first
      console.log("Testing Supabase connection...");
      const { data: testData, error: testError } = await supabase
        .from("events")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("Connection test failed:", testError);
      } else {
        console.log("Connection test successful");
      }

      // Geocode the location string
      console.log("Geocoding location:", location);
      const geo = await geocodeLocation(location);

      if (!geo) {
        setLoading(false);
        Alert.alert(
          "Location not found",
          "We couldn't find that location. Try a more specific address (e.g. 'Toyon Hall, Stanford, CA')."
        );
        return;
      }

      const { latitude, longitude, address } = geo;
      console.log("Geocoded to:", latitude, longitude, address);

      // Insert activity into Supabase events table
      console.log("Creating activity with data:", {
        name: activityName.trim(),
        activity_type: activityType,
        price_range: priceRange,
        time_slot: timeSlot,
        event_date: date,
        location: location.trim(), // TODO: we should explicitly add an address field
        latitude,
        longitude,
      });

      const activityData = {
        name: activityName.trim(),
        organizer_id: session?.user?.id, // Changed from creator_id to organizer_id
      };

      // Only add optional fields if they exist
      if (description.trim()) {
        Object.assign(activityData, { description: description.trim() });
      }
      if (activityType) {
        Object.assign(activityData, { activity_type: activityType });
      }
      if (priceRange) {
        Object.assign(activityData, { price_range: priceRange });
      }
      if (timeSlot) {
        Object.assign(activityData, { time_slot: timeSlot });
      }
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        Object.assign(activityData, {
          event_date: `${year}-${month}-${day}`, // "YYYY-MM-DD"
        });
      }
      if (location.trim()) {
        Object.assign(activityData, { location: location.trim() });
      }
      if (latitude != null && longitude != null) {
        Object.assign(activityData, {
          latitude,
          longitude,
        });
      }

      console.log("Inserting activity data:", activityData);

      const { data, error } = await supabase
        .from("events")
        .insert(activityData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Event created, initializing chat room...");

      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .insert({
          event_id: data.id,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert({
          chat_id: chatData.id,
          user_id: session?.user?.id,
        });

      if (participantError) throw participantError;

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", session?.user?.id)
        .single();

      console.log("profile error:", profileErr);

      const userName = profileData?.name ?? "Someone";

      await supabase.from("messages").insert({
        chat_id: chatData.id,
        user_id: session?.user?.id,
        type: "system",
        content: `${userName} created the group`,
      });

      console.log("Chat room created and creator added!");

      // Auto-add organizer as an attendee
      const { error: attendeeError } = await supabase
        .from("event_attendees")
        .insert({
          event_id: data.id,
          user_id: session?.user?.id,
        });

      if (attendeeError) {
        console.error("Error adding organizer as attendee:", attendeeError);
        // Continue even if this fails
      } else {
        console.log("Organizer automatically added as attendee");
      }

      console.log("Activity created successfully:", data);

      Alert.alert("Success", "Activity created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error creating activity:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      let errorMessage = "Failed to create activity.\n\n";

      if (error.message) {
        errorMessage += `Error: ${error.message}\n\n`;
      }

      if (error.code) {
        errorMessage += `Code: ${error.code}\n\n`;
      }

      if (error.code === "42P01") {
        errorMessage +=
          "The events table doesn't exist. Please run the SQL schema.";
      } else if (error.code === "23505") {
        errorMessage += "This activity already exists.";
      } else if (error.details) {
        errorMessage += `Details: ${error.details}`;
      } else {
        errorMessage +=
          "Please check:\n• Events table exists in Supabase\n• Supabase connection is working\n• All required fields are filled";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Activity</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Activity Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Coffee at Blue Bottle"
            value={activityName}
            onChangeText={setActivityName}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell people what this activity is about..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Activity Type Dropdown */}
        <Dropdown
          label="Activity Type"
          value={activityType}
          options={ACTIVITY_TYPES}
          onSelect={setActivityType}
          placeholder="Select activity type"
        />

        {/* Price Range Dropdown */}
        <Dropdown
          label="Price Range"
          value={priceRange}
          options={PRICE_RANGES}
          onSelect={setPriceRange}
          placeholder="Select price range"
        />

        {/* Time Dropdown */}
        <Dropdown
          label="Time"
          value={timeSlot}
          options={TIME_OPTIONS}
          onSelect={setTimeSlot}
          placeholder="Select time"
        />

        {/* Date Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Date *</Text>

          <Pressable onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.input, { color: date ? "#000" : "#999" }]}>
              {date
                ? date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select a date"}
            </Text>
          </Pressable>

          {/* iOS Date Picker Modal */}
          {Platform.OS === "ios" && showDatePicker && (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerCancel}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerDone}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={date ?? new Date()}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Android Date Picker */}
          {Platform.OS === "android" && showDatePicker && (
            <DateTimePicker
              value={date ?? new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location or Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Stanford Shopping Center, Palo Alto, CA"
            value={location}
            onChangeText={setLocation}
            maxLength={200}
          />
          <Text style={styles.locationHint}>
            Be specific for better results (include city/state)
          </Text>
        </View>

        {/* Create Button */}
        <Pressable
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreateActivity}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Activity</Text>
          )}
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 28,
    color: "#000",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
  },
  placeholder: {
    color: "#999",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionSelected: {
    backgroundColor: "#e3f2ff",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
  optionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  closeButton: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  datePickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  datePickerCancel: {
    fontSize: 16,
    color: "#666",
  },
  datePickerDone: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: tabColors.inactiveColor,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
  locationHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
});
