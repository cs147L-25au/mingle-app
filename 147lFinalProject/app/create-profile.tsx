import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import supabase from "../supabase";
import useSession from "../utils/useSession";

// Common activity interests
const ACTIVITY_OPTIONS = [
  "Food & Dining",
  "Hiking",
  "Movies",
  "Concerts",
  "Sports",
  "Gaming",
  "Art & Museums",
  "Coffee & Cafes",
];

export default function CreateProfile() {
  const router = useRouter();
  const session = useSession();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleCreateProfile = async () => {
    // Check authentication
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to create a profile");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (selectedInterests.length === 0) {
      Alert.alert("Error", "Please select at least one interest");
      return;
    }

    setLoading(true);

    try {
      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", session?.user?.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update({
            name: name.trim(),
            bio: bio.trim(),
            interests: selectedInterests,
          })
          .eq("user_id", session?.user?.id);

        if (error) throw error;
      } else {
        // Insert new profile
        const { error } = await supabase.from("profiles").insert({
          user_id: session?.user?.id,
          name: name.trim(),
          bio: bio.trim() || "",
          interests: selectedInterests,
        });

        if (error) throw error;
      }

      Alert.alert("Success", "Profile created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/profile"),
        },
      ]);
    } catch (error: any) {
      console.error("Error creating profile:", error);
      let errorMessage = "Failed to create profile. ";

      if (error.message) {
        errorMessage += error.message;
      } else if (error.code === "42P01") {
        errorMessage +=
          "Database table not found. Please run the SQL schema first.";
      } else {
        errorMessage += "Please check your database setup.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>
          Let others know who you are and what you enjoy!
        </Text>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Bio Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us a bit about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>

        {/* Interests Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interests *</Text>
          <Text style={styles.helperText}>
            Select activities you enjoy (choose at least one)
          </Text>
          <View style={styles.interestsContainer}>
            {ACTIVITY_OPTIONS.map((interest) => (
              <Pressable
                key={interest}
                style={[
                  styles.interestChip,
                  selectedInterests.includes(interest) &&
                    styles.interestChipSelected,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.interestChipText,
                    selectedInterests.includes(interest) &&
                      styles.interestChipTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Profile</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
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
  helperText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "#fff",
  },
  interestChipSelected: {
    backgroundColor: "#007AFF",
  },
  interestChipText: {
    fontSize: 14,
    color: "#007AFF",
  },
  interestChipTextSelected: {
    color: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
