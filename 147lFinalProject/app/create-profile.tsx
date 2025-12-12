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
          onPress: () => router.replace("/tabs/profile"),
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
        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

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
            autoComplete="off"
            textContentType="none"
            autoCorrect={false}
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
            autoComplete="off"
            textContentType="none"
            autoCorrect={false}
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

// Mingle Brand Colors
const COLORS = {
  background: '#FAF8FC',
  brandPurple: '#8174A0',
  brandPink: '#C599B6',
  textPrimary: '#2D2438',
  textSecondary: '#6B6078',
  textTertiary: '#9B8FA8',
  inputBorder: '#E0D8E8',
  lightPurple: '#E3DFED',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 28,
    paddingTop: 60,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 17,
    color: COLORS.brandPurple,
    fontWeight: "600",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: "right",
    marginTop: 6,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.brandPurple,
    backgroundColor: COLORS.white,
  },
  interestChipSelected: {
    backgroundColor: COLORS.brandPurple,
    borderColor: COLORS.brandPurple,
  },
  interestChipText: {
    fontSize: 14,
    color: COLORS.brandPurple,
    fontWeight: "500",
  },
  interestChipTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.brandPurple,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
    shadowColor: COLORS.brandPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
