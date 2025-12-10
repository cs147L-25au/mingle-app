import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import supabase from "../../supabase";
import { useRouter } from "expo-router";
import useSession from "../../utils/useSession";
import Loading from "../../components/loading";

const CURRENT_USER_ID = "test_user_id_A";

interface Profile {
  user_id: string;
  name: string;
  bio: string;
  interests: string[];
  profile_picture_url?: string;
}

interface MediaItem {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  caption?: string;
  created_at: string;
}

interface Activity {
  id: string;
  name: string;
  description?: string;
  activity_type: string;
  price_range: string;
  time_slot: string;
  location: string;
  created_at: string;
  status?: "pending" | "completed";
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addMediaModalVisible, setAddMediaModalVisible] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaCaption, setNewMediaCaption] = useState("");

  const session = useSession();
  const router = useRouter();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert(error.message);
      } else {
        router.navigate("/");
        Alert.alert("Sign out successful.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", CURRENT_USER_ID)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        setEditedName(data.name);
        setEditedBio(data.bio || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("user_media")
        .select("*")
        .eq("user_id", CURRENT_USER_ID)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching media:", error);
        return;
      }

      if (data) {
        setMedia(data as MediaItem[]);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", CURRENT_USER_ID);

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }

      if (data) {
        // Sort by id (newest first) since created_at doesn't exist
        const sortedData = data.sort((a, b) => {
          if (a.id > b.id) return -1;
          if (a.id < b.id) return 1;
          return 0;
        });
        setActivities(sortedData as Activity[]);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchMedia(), fetchActivities()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editedName.trim(),
          bio: editedBio.trim(),
        })
        .eq("user_id", CURRENT_USER_ID);

      if (error) throw error;

      setProfile({
        ...profile!,
        name: editedName.trim(),
        bio: editedBio.trim(),
      });
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleAddMedia = async () => {
    if (!newMediaUrl.trim()) {
      Alert.alert("Error", "Please enter a media URL");
      return;
    }

    try {
      const { error } = await supabase.from("user_media").insert({
        user_id: CURRENT_USER_ID,
        media_url: newMediaUrl.trim(),
        media_type: "image",
        caption: newMediaCaption.trim(),
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setNewMediaUrl("");
      setNewMediaCaption("");
      setAddMediaModalVisible(false);
      Alert.alert("Success", "Media added successfully!");
      fetchMedia();
    } catch (error) {
      console.error("Error adding media:", error);
      Alert.alert("Error", "Failed to add media");
    }
  };

  if (!session) {
    return <Loading />;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.noProfileTitle}>No Profile Found</Text>
        <Text style={styles.noProfileText}>
          Create your profile to get started!
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/create-profile")}
        >
          <Text style={styles.buttonText}>Create Profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profilePicturePlaceholder}>
          <Text style={styles.profileInitial}>{profile.name[0]}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {/* Interests */}
        <View style={styles.interestsContainer}>
          {profile.interests.map((interest, index) => (
            <View key={index} style={styles.interestChip}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* TODO: SIGN OUT */}
      <View style={styles.signOutContainer}>
        <View style={styles.box}>
          <Text style={styles.title}>Logged in as:</Text>
          <Text style={styles.email}>{session.user.email}</Text>

          <TouchableOpacity style={styles.button} onPress={signOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activities Sections */}
      <View style={styles.activitiesSection}>
        {/* Pending Activities */}
        <View style={styles.activitySubSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Activities</Text>
            {activities.filter((a) => a.status !== "completed").length > 0 && (
              <Text style={styles.activityCount}>
                {activities.filter((a) => a.status !== "completed").length}
              </Text>
            )}
          </View>
          {activities.filter((a) => a.status !== "completed").length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No pending activities. Create one from the Map tab!
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activityScrollContent}
            >
              {activities
                .filter((a) => a.status !== "completed")
                .map((activity, index) => (
                  <View
                    key={activity.id}
                    style={[
                      styles.activityCard,
                      index === 0 && styles.firstCard,
                    ]}
                  >
                    <View style={styles.activityBadge}>
                      <Text style={styles.activityBadgeText}>
                        {activity.activity_type}
                      </Text>
                    </View>
                    <Text style={styles.activityName} numberOfLines={2}>
                      {activity.name}
                    </Text>
                    <View style={styles.activityDetails}>
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>📍</Text>
                        <Text
                          style={styles.activityDetailText}
                          numberOfLines={1}
                        >
                          {activity.location}
                        </Text>
                      </View>
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>🕐</Text>
                        <Text style={styles.activityDetailText}>
                          {activity.time_slot}
                        </Text>
                      </View>
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>💰</Text>
                        <Text style={styles.activityDetailText}>
                          {activity.price_range}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
            </ScrollView>
          )}
        </View>

        {/* Completed Activities */}
        <View style={styles.activitySubSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completed Activities</Text>
            {activities.filter((a) => a.status === "completed").length > 0 && (
              <Text style={styles.activityCount}>
                {activities.filter((a) => a.status === "completed").length}
              </Text>
            )}
          </View>
          {activities.filter((a) => a.status === "completed").length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No completed activities yet.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activityScrollContent}
            >
              {activities
                .filter((a) => a.status === "completed")
                .map((activity, index) => (
                  <View
                    key={activity.id}
                    style={[
                      styles.activityCard,
                      styles.completedCard,
                      index === 0 && styles.firstCard,
                    ]}
                  >
                    <View
                      style={[
                        styles.activityBadge,
                        styles.completedBadgeContainer,
                      ]}
                    >
                      <Text style={styles.completedBadgeText}>
                        ✓ {activity.activity_type}
                      </Text>
                    </View>
                    <Text style={styles.activityName} numberOfLines={2}>
                      {activity.name}
                    </Text>
                    <View style={styles.activityDetails}>
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>📍</Text>
                        <Text
                          style={styles.activityDetailText}
                          numberOfLines={1}
                        >
                          {activity.location}
                        </Text>
                      </View>
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>🕐</Text>
                        <Text style={styles.activityDetailText}>
                          {activity.time_slot}
                        </Text>
                      </View>
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>💰</Text>
                        <Text style={styles.activityDetailText}>
                          {activity.price_range}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Gallery Section */}
      <View style={styles.gallerySection}>
        <View style={styles.gallerySectionHeader}>
          <Text style={styles.sectionTitle}>My Meet-ups Gallery</Text>
          <Pressable
            style={styles.addMediaButton}
            onPress={() => setAddMediaModalVisible(true)}
          >
            <Text style={styles.addMediaButtonText}>+ Add</Text>
          </Pressable>
        </View>

        {media.length === 0 ? (
          <View style={styles.emptyGallery}>
            <Text style={styles.emptyGalleryText}>
              No photos yet! Add photos from your meet-ups.
            </Text>
          </View>
        ) : (
          <View style={styles.gallery}>
            {media.map((item) => (
              <View key={item.id} style={styles.mediaItem}>
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
                {item.caption && (
                  <Text style={styles.mediaCaption}>{item.caption}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your name"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={editedBio}
              onChangeText={setEditedBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Media Modal */}
      <Modal
        visible={addMediaModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddMediaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Media</Text>

            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={newMediaUrl}
              onChangeText={setNewMediaUrl}
              placeholder="https://example.com/image.jpg"
            />

            <Text style={styles.label}>Caption (optional)</Text>
            <TextInput
              style={styles.input}
              value={newMediaCaption}
              onChangeText={setNewMediaCaption}
              placeholder="Add a caption..."
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddMediaModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddMedia}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e3f2ff",
  },
  interestText: {
    fontSize: 14,
    color: "#007AFF",
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  noProfileTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  noProfileText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  activitiesSection: {
    paddingVertical: 24,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  activitySubSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  activityCount: {
    backgroundColor: "#007AFF",
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  activityScrollContent: {
    paddingRight: 20,
  },
  activityCard: {
    width: 240,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  firstCard: {
    marginLeft: 20,
  },
  completedCard: {
    backgroundColor: "#f0f9f4",
    borderWidth: 1,
    borderColor: "#d1f0dd",
  },
  activityBadge: {
    backgroundColor: "#e3f2ff",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  activityBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#007AFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  completedBadgeContainer: {
    backgroundColor: "#d1f0dd",
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2e7d32",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activityName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#000",
    lineHeight: 24,
  },
  activityDetails: {
    gap: 8,
  },
  activityDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  activityDetailText: {
    fontSize: 14,
    color: "#555",
    flex: 1,
    lineHeight: 20,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
  gallerySection: {
    padding: 20,
  },
  gallerySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addMediaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  addMediaButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyGallery: {
    padding: 40,
    alignItems: "center",
  },
  emptyGalleryText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mediaItem: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaCaption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    padding: 8,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
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
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  box: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#111827",
  },
  email: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 20,
  },
});
