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
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import supabase from "../../supabase";
import { useRouter, useFocusEffect } from "expo-router";
import useSession from "../../utils/useSession";
import Loading from "../../components/loading";
import { useCallback } from "react";
import DropDownPicker from "react-native-dropdown-picker";

// Mingle Brand Colors
const COLORS = {
  background: "#FAF8FC",
  backgroundSecondary: "#FFFFFF",
  brandPurple: "#8174A0",
  brandPink: "#C599B6",
  textPrimary: "#2D2438",
  textSecondary: "#6B6078",
  textTertiary: "#9B8FA8",
  inputBorder: "#E0D8E8",
  buttonText: "#FFFFFF",
  white: "#FFFFFF",
  lightPurple: "#E3DFED",
  softPink: "#F5E6F0",
};

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
  attendee_count?: number;
  attendee_completed?: boolean; // For tracking if current user completed this as an attendee
  organizer_id?: string; // To check if current user is the organizer
  event_date: string;
}

interface RatingStats {
  avgCommunication: number;
  avgSafety: number;
  avgOverall: number;
  totalRatings: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ratings, setRatings] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addMediaModalVisible, setAddMediaModalVisible] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [newMediaCaption, setNewMediaCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [activityToRate, setActivityToRate] = useState<Activity | null>(null);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [safetyRating, setSafetyRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [openDropdown, setOpenDropdown] = useState(false);

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
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
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
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_media")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching media:", error);
        return;
      }

      if (data) {
        console.log("Fetched media items:", data.length);
        data.forEach((item, index) => {
          console.log(`Media ${index + 1}:`, item.media_url);
        });
        setMedia(data as MediaItem[]);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  const fetchRatings = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch ratings where user is the organizer
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("organizer_ratings")
        .select("communication_rating, safety_rating, overall_rating")
        .eq("organizer_id", session.user.id);

      if (ratingsError) {
        console.error("Error fetching ratings:", ratingsError);
      } else if (ratingsData && ratingsData.length > 0) {
        const avgCommunication =
          ratingsData.reduce(
            (sum, r) => sum + (r.communication_rating || 0),
            0
          ) / ratingsData.length;
        const avgSafety =
          ratingsData.reduce((sum, r) => sum + (r.safety_rating || 0), 0) /
          ratingsData.length;
        const avgOverall =
          ratingsData.reduce((sum, r) => sum + (r.overall_rating || 0), 0) /
          ratingsData.length;

        setRatings({
          avgCommunication: Math.round(avgCommunication * 10) / 10,
          avgSafety: Math.round(avgSafety * 10) / 10,
          avgOverall: Math.round(avgOverall * 10) / 10,
          totalRatings: ratingsData.length,
        });
      } else {
        setRatings(null);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const fetchActivities = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch events where user is the organizer
      const { data: organizedEvents, error: organizedError } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", session.user.id);

      if (organizedError) {
        console.error("Error fetching organized events:", organizedError);
      }

      // Fetch events where user is attending (with completion status)
      const { data: attendeeData, error: attendeeError } = await supabase
        .from("event_attendees")
        .select("event_id, completed")
        .eq("user_id", session.user.id);

      if (attendeeError) {
        console.error("Error fetching attended events:", attendeeError);
      }

      // Create a map of event_id to completion status
      const completionMap = new Map(
        (attendeeData || []).map((a) => [a.event_id, a.completed])
      );

      // Get the full event details for attended events
      let attendedEvents: Activity[] = [];
      if (attendeeData && attendeeData.length > 0) {
        const eventIds = attendeeData.map((a) => a.event_id);
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds);

        if (eventsError) {
          console.error("Error fetching attended event details:", eventsError);
        } else {
          attendedEvents = (eventsData as Activity[]) || [];
        }
      }

      // Combine both lists, removing duplicates (in case user organized and is attending)
      const allEvents = [...(organizedEvents || []), ...attendedEvents];
      const uniqueEvents = Array.from(
        new Map(allEvents.map((event) => [event.id, event])).values()
      );

      // Sort by id (newest first)
      const sortedData = uniqueEvents.sort((a, b) => {
        if (a.id > b.id) return -1;
        if (a.id < b.id) return 1;
        return 0;
      });

      // Fetch attendee counts and add completion status for each activity
      const activitiesWithCounts = await Promise.all(
        sortedData.map(async (activity) => {
          const { count, error } = await supabase
            .from("event_attendees")
            .select("*", { count: "exact", head: true })
            .eq("event_id", activity.id);

          if (error) {
            console.error("Error fetching attendee count:", error);
          }

          // Check if user completed this activity as an attendee
          const attendeeCompleted = completionMap.get(activity.id) || false;

          return {
            ...activity,
            attendee_count: count || 0,
            attendee_completed: attendeeCompleted,
          };
        })
      );

      setActivities(activitiesWithCounts as Activity[]);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchMedia(),
      fetchActivities(),
      fetchRatings(),
    ]);
    setLoading(false);
  };

  // Helper to check if activity date is today or in the future
  const isUpcoming = (activity: Activity): boolean => {
    if (!activity.event_date) return true; // If no date, show it
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    return activity.event_date >= today;
  };

  // Helper to check if activity is completed for the current user
  const isActivityCompleted = (activity: Activity): boolean => {
    // If user is the organizer and event status is completed
    if (activity.organizer_id === session?.user?.id && activity.status === "completed") {
      return true;
    }
    // If user is an attendee and marked it as completed
    if (activity.attendee_completed) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    } else {
      // If no session, set loading to false to show the Loading component
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Refresh activities when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        fetchActivities();
      }
    }, [session?.user?.id])
  );

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editedName.trim(),
          bio: editedBio.trim(),
        })
        .eq("user_id", session.user.id);

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

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant permission to access your photos."
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImageToStorage = async (
    imageUri: string
  ): Promise<string | null> => {
    if (!session?.user?.id) {
      Alert.alert("Error", "Not authenticated");
      return null;
    }

    try {
      setUploading(true);
      console.log("Starting upload for:", imageUri);

      // For React Native, we need to create a proper file object
      const response = await fetch(imageUri);
      const blob = await response.blob();
      console.log("Blob created, size:", blob.size, "type:", blob.type);

      if (blob.size === 0) {
        throw new Error("Image blob is empty");
      }

      // Generate unique filename
      const fileExt = imageUri.split(".").pop()?.split("?")[0] || "jpg";
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `user-media/${fileName}`;
      console.log("Uploading to path:", filePath);

      // Create FormData for proper file upload
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: blob.type || "image/jpeg",
        name: fileName,
      } as any);

      // Upload using fetch directly to Supabase Storage
      const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/user-images/${filePath}`;

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("user-images")
        .getPublicUrl(filePath);

      console.log("Public URL:", urlData.publicUrl);

      setUploading(false);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(
        "Upload Error",
        `Failed to upload: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setUploading(false);
      return null;
    }
  };

  const handleAddMedia = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image from your device");
      return;
    }

    if (!session?.user?.id) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    try {
      // Upload image to Supabase Storage
      const uploadedUrl = await uploadImageToStorage(selectedImage);
      if (!uploadedUrl) {
        Alert.alert("Error", "Failed to upload image");
        return;
      }

      // Save to database
      const { error } = await supabase.from("user_media").insert({
        user_id: session.user.id,
        media_url: uploadedUrl,
        media_type: "image",
        caption: newMediaCaption.trim(),
        created_at: new Date().toISOString(),
        activity_id: selectedActivityId || null,
      });

      if (error) throw error;

      setNewMediaCaption("");
      setSelectedImage(null);
      setAddMediaModalVisible(false);
      Alert.alert("Success", "Media added successfully!");
      fetchMedia();
    } catch (error) {
      console.error("Error adding media:", error);
      Alert.alert("Error", "Failed to add media");
    }
  };

  const handleDeleteMedia = async (mediaId: string, mediaUrl: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Deleting media with ID:", mediaId);

              // Extract file path from URL
              const urlParts = mediaUrl.split("/storage/v1/object/public/user-images/");
              if (urlParts.length > 1) {
                const filePath = urlParts[1];

                // Delete from Supabase Storage
                const { error: storageError } = await supabase.storage
                  .from("user-images")
                  .remove([filePath]);

                if (storageError) {
                  console.error("Storage deletion error:", storageError);
                }

                // Delete from database
                const { data: deleteData, error: dbError } = await supabase
                  .from("user_media")
                  .delete()
                  .eq("id", mediaId)
                  .select();

                if (dbError) {
                  console.error("Database deletion error:", dbError);
                  throw dbError;
                }

                console.log("Delete operation result:", deleteData);

                // Verify deletion by trying to fetch the record
                const { data: checkData, error: checkError } = await supabase
                  .from("user_media")
                  .select("id")
                  .eq("id", mediaId)
                  .maybeSingle();

                if (checkData) {
                  console.error("Photo still exists in database after deletion!");
                  throw new Error("Photo was not deleted from database");
                }

                console.log("Verified: Photo deleted successfully from database");

                // Immediately update local state to remove the item
                setMedia(currentMedia => currentMedia.filter(item => item.id !== mediaId));

                Alert.alert("Success", "Photo deleted successfully!");
              }
            } catch (error) {
              console.error("Error deleting media:", error);
              Alert.alert("Error", "Failed to delete photo");
            }
          },
        },
      ]
    );
  };

  const handleCompleteActivity = async (activity: Activity) => {
    if (!session?.user?.id) return;

    try {
      // Get organizer_id from the activity
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", activity.id)
        .single();

      if (eventError) throw eventError;

      // If user is the organizer, skip rating and just complete
      if (eventData.organizer_id === session.user.id) {
        const { error } = await supabase
          .from("events")
          .update({ status: "completed" })
          .eq("id", activity.id);

        if (error) throw error;

        fetchActivities();
        Alert.alert("Success", "Activity marked as complete!");
        return;
      }

      // Otherwise, open rating modal for non-organizers
      setActivityToRate(activity);
      setRatingModalVisible(true);
    } catch (error) {
      console.error("Error checking organizer:", error);
      Alert.alert("Error", "Failed to complete activity");
    }
  };

  const submitRatingAndComplete = async () => {
    if (!activityToRate || !session?.user?.id) return;

    try {
      // Check if all ratings are provided
      if (
        communicationRating === 0 ||
        safetyRating === 0 ||
        overallRating === 0
      ) {
        Alert.alert(
          "Missing Ratings",
          "Please provide all ratings before submitting."
        );
        return;
      }

      // Get organizer_id from the activity
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", activityToRate.id)
        .single();

      if (eventError) throw eventError;

      // Only submit rating if user is not the organizer
      if (eventData.organizer_id !== session.user.id) {
        // Submit rating (upsert to handle re-rating the same event)
        const { error: ratingError } = await supabase
          .from("organizer_ratings")
          .upsert(
            {
              event_id: activityToRate.id,
              organizer_id: eventData.organizer_id,
              rater_id: session.user.id,
              communication_rating: communicationRating,
              safety_rating: safetyRating,
              overall_rating: overallRating,
              comment: ratingComment.trim() || null,
            },
            {
              onConflict: "event_id,rater_id",
            }
          );

        if (ratingError) {
          console.error("Rating error:", ratingError);
          // Continue even if rating fails
        }
      }

      // For non-organizers, mark their attendance as completed
      const { error: updateError } = await supabase
        .from("event_attendees")
        .update({ completed: true })
        .eq("event_id", activityToRate.id)
        .eq("user_id", session.user.id);

      if (updateError) throw updateError;

      // Reset modal state
      setRatingModalVisible(false);
      setActivityToRate(null);
      setCommunicationRating(0);
      setSafetyRating(0);
      setOverallRating(0);
      setRatingComment("");

      fetchActivities();
      Alert.alert("Success", "Activity marked as complete!");
    } catch (error) {
      console.error("Error completing activity:", error);
      Alert.alert("Error", "Failed to mark activity as completed");
    }
  };

  const skipRatingAndComplete = async () => {
    if (!activityToRate || !session?.user?.id) return;

    try {
      // For non-organizers, mark their attendance as completed
      const { error } = await supabase
        .from("event_attendees")
        .update({ completed: true })
        .eq("event_id", activityToRate.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      // Reset modal state
      setRatingModalVisible(false);
      setActivityToRate(null);
      setCommunicationRating(0);
      setSafetyRating(0);
      setOverallRating(0);
      setRatingComment("");

      fetchActivities();
    } catch (error) {
      console.error("Error completing activity:", error);
      Alert.alert("Error", "Failed to mark activity as completed");
    }
  };

  const handleUncompleteActivity = async (activity: Activity) => {
    if (!session?.user?.id) return;

    try {
      // Check if user is the organizer
      if (activity.organizer_id === session.user.id) {
        // Organizer: update event status
        const { error } = await supabase
          .from("events")
          .update({ status: "pending" })
          .eq("id", activity.id);

        if (error) throw error;
      } else {
        // Attendee: update their completed status
        const { error } = await supabase
          .from("event_attendees")
          .update({ completed: false })
          .eq("event_id", activity.id)
          .eq("user_id", session.user.id);

        if (error) throw error;
      }

      fetchActivities();
    } catch (error) {
      console.error("Error unmarking activity:", error);
      Alert.alert("Error", "Failed to mark activity as pending");
    }
  };

  if (!session) {
    return <Loading />;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.brandPurple} />
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

        {/* Sign Out Option */}
        <View style={styles.noProfileSignOutSection}>
          <Text style={styles.noProfileEmail}>
            Logged in as: {session.user.email}
          </Text>
          <Pressable
            style={styles.signOutButton}
            onPress={signOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
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

        {/* Organizer Ratings */}
        {ratings && ratings.totalRatings > 0 && (
          <View style={styles.ratingsSection}>
            <Text style={styles.ratingsSectionTitle}>My Organizer Rating</Text>
            <Text style={styles.ratingsCount}>
              Based on {ratings.totalRatings} rating
              {ratings.totalRatings !== 1 ? "s" : ""}
            </Text>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Communication</Text>
              <View style={styles.ratingValueContainer}>
                <Text style={styles.ratingStars}>
                  {"★".repeat(Math.round(ratings.avgCommunication))}
                  {"☆".repeat(5 - Math.round(ratings.avgCommunication))}
                </Text>
                <Text style={styles.ratingValue}>
                  {ratings.avgCommunication.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Safety</Text>
              <View style={styles.ratingValueContainer}>
                <Text style={styles.ratingStars}>
                  {"★".repeat(Math.round(ratings.avgSafety))}
                  {"☆".repeat(5 - Math.round(ratings.avgSafety))}
                </Text>
                <Text style={styles.ratingValue}>
                  {ratings.avgSafety.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Overall</Text>
              <View style={styles.ratingValueContainer}>
                <Text style={styles.ratingStars}>
                  {"★".repeat(Math.round(ratings.avgOverall))}
                  {"☆".repeat(5 - Math.round(ratings.avgOverall))}
                </Text>
                <Text style={styles.ratingValue}>
                  {ratings.avgOverall.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

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
            {activities.filter((a) => !isActivityCompleted(a) && isUpcoming(a)).length > 0 && (
              <Text style={styles.activityCount}>
                {activities.filter((a) => !isActivityCompleted(a) && isUpcoming(a)).length}
              </Text>
            )}
          </View>
          {activities.filter((a) => !isActivityCompleted(a) && isUpcoming(a)).length === 0 ? (
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
                .filter((a) => !isActivityCompleted(a) && isUpcoming(a))
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
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>👥</Text>
                        <Text style={styles.activityDetailText}>
                          {activity.attendee_count || 0}{" "}
                          {activity.attendee_count === 1 ? "person" : "people"}{" "}
                          joined
                        </Text>
                      </View>
                    </View>

                    {/* Complete button */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.completeButton,
                        pressed && styles.completeButtonPressed,
                      ]}
                      onPress={() => handleCompleteActivity(activity)}
                    >
                      <Text style={styles.completeButtonText}>
                        ✓ Mark Complete
                      </Text>
                    </Pressable>
                  </View>
                ))}
            </ScrollView>
          )}
        </View>

        {/* Completed Activities */}
        <View style={styles.activitySubSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completed Activities</Text>
            {activities.filter((a) => isActivityCompleted(a)).length > 0 && (
              <Text style={styles.activityCount}>
                {activities.filter((a) => isActivityCompleted(a)).length}
              </Text>
            )}
          </View>
          {activities.filter((a) => isActivityCompleted(a)).length === 0 ? (
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
                .filter((a) => isActivityCompleted(a))
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
                      <View style={styles.activityDetailRow}>
                        <Text style={styles.activityIcon}>👥</Text>
                        <Text style={styles.activityDetailText}>
                          {activity.attendee_count || 0}{" "}
                          {activity.attendee_count === 1 ? "person" : "people"}{" "}
                          joined
                        </Text>
                      </View>
                    </View>

                    {/* Uncomplete button */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.uncompleteButton,
                        pressed && styles.uncompleteButtonPressed,
                      ]}
                      onPress={() => handleUncompleteActivity(activity)}
                    >
                      <Text style={styles.uncompleteButtonText}>
                        ↻ Mark as Pending
                      </Text>
                    </Pressable>
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
            {media.map((item, index) => (
              <Pressable
                key={item.id}
                style={[
                  styles.mediaItem,
                  index % 2 === 0
                    ? styles.mediaItemLeft
                    : styles.mediaItemRight,
                ]}
                onPress={() => {
                  // Optional: Add full-screen image view later
                  console.log("Tapped image:", item.media_url);
                }}
              >
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                  onLoad={() => console.log(`Image loaded: ${item.id}`)}
                  onError={(error) => {
                    console.error(
                      `Image load error for ${item.id}:`,
                      error.nativeEvent.error
                    );
                    console.error(`Failed URL: ${item.media_url}`);
                  }}
                />

                {/* Delete Button */}
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMedia(item.id, item.media_url)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </Pressable>

                {item.caption && (
                  <View style={styles.captionOverlay}>
                    <Text style={styles.mediaCaption} numberOfLines={2}>
                      {item.caption}
                    </Text>
                  </View>
                )}
              </Pressable>
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
        onRequestClose={() => {
          setAddMediaModalVisible(false);
          setSelectedImage(null);
          setNewMediaCaption("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Media</Text>

            {/* Image Selection */}
            <Pressable
              style={styles.imagePickerButton}
              onPress={pickImage}
              disabled={uploading}
            >
              <Text style={styles.imagePickerButtonText}>
                {selectedImage ? "Change Photo" : "📷 Choose from Device"}
              </Text>
            </Pressable>

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              </View>
            )}

            <Text style={styles.label}>Caption (optional)</Text>
            <TextInput
              style={styles.input}
              value={newMediaCaption}
              onChangeText={setNewMediaCaption}
              placeholder="Add a caption..."
            />

            <Text style={styles.label}>Activity</Text>
            <DropDownPicker
              open={openDropdown}
              value={selectedActivityId}
              items={activities
                .filter((a) => a.status === "completed")
                .map((a) => ({ label: a.name, value: a.id }))}
              setOpen={setOpenDropdown}
              setValue={setSelectedActivityId}
              placeholder="Select completed activity..."
              containerStyle={{ marginBottom: 16 }}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownList}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAddMediaModalVisible(false);
                  setSelectedImage(null);
                  setNewMediaCaption("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddMedia}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Add</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setRatingModalVisible(false);
          setActivityToRate(null);
          setCommunicationRating(0);
          setSafetyRating(0);
          setOverallRating(0);
          setRatingComment("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate the Organizer</Text>
            {activityToRate && (
              <Text style={styles.ratingActivityName}>
                {activityToRate.name}
              </Text>
            )}

            {/* Communication Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Communication</Text>
              <Text style={styles.ratingSubtext}>
                How responsive and clear were they?
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setCommunicationRating(star)}
                    style={styles.starButton}
                  >
                    <Text style={styles.starText}>
                      {star <= communicationRating ? "★" : "☆"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Safety Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Safety</Text>
              <Text style={styles.ratingSubtext}>
                Did you feel safe during the activity?
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setSafetyRating(star)}
                    style={styles.starButton}
                  >
                    <Text style={styles.starText}>
                      {star <= safetyRating ? "★" : "☆"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Overall Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Overall Experience</Text>
              <Text style={styles.ratingSubtext}>
                How was the activity overall?
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setOverallRating(star)}
                    style={styles.starButton}
                  >
                    <Text style={styles.starText}>
                      {star <= overallRating ? "★" : "☆"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Comment */}
            <Text style={styles.label}>Additional Comments (optional)</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Share your experience..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={skipRatingAndComplete}
              >
                <Text style={styles.cancelButtonText}>Skip</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={submitRatingAndComplete}
              >
                <Text style={styles.saveButtonText}>Submit</Text>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
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
    borderBottomColor: COLORS.inputBorder,
    backgroundColor: COLORS.backgroundSecondary,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.brandPurple,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.white,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  bio: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.lightPurple,
  },
  interestText: {
    fontSize: 14,
    color: COLORS.brandPurple,
    fontWeight: "500",
  },
  ratingsSection: {
    width: "100%",
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  ratingsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  ratingsCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
  },
  ratingValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ratingStars: {
    fontSize: 16,
    color: COLORS.brandPurple,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    minWidth: 30,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.brandPurple,
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: COLORS.brandPurple,
    fontWeight: "600",
  },
  noProfileTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  noProfileText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  noProfileSignOutSection: {
    marginTop: 40,
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBorder,
    width: "80%",
  },
  noProfileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  signOutButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.brandPurple,
  },
  signOutButtonText: {
    color: COLORS.brandPurple,
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.brandPurple,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  activitiesSection: {
    paddingVertical: 24,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
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
    backgroundColor: COLORS.brandPurple,
    color: COLORS.white,
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
    backgroundColor: COLORS.lightPurple,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  activityBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.brandPurple,
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
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  completeButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.brandPurple,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonPressed: {
    backgroundColor: COLORS.brandPink,
    transform: [{ scale: 0.97 }],
  },
  completeButtonText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  uncompleteButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  uncompleteButtonPressed: {
    backgroundColor: COLORS.lightPurple,
    borderColor: COLORS.brandPurple,
    transform: [{ scale: 0.97 }],
  },
  uncompleteButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.textTertiary,
    textAlign: "center",
    lineHeight: 22,
  },
  gallerySection: {
    padding: 20,
    backgroundColor: COLORS.backgroundSecondary,
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
    color: COLORS.textPrimary,
  },
  addMediaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.brandPurple,
  },
  addMediaButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyGallery: {
    padding: 40,
    alignItems: "center",
  },
  emptyGalleryText: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: "center",
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  mediaItem: {
    width: "48.5%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.lightPurple,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaItemLeft: {
    marginRight: "1.5%",
  },
  mediaItemRight: {
    marginLeft: "1.5%",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  captionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(45, 36, 56, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mediaCaption: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(45, 36, 56, 0.85)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 16,
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
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
    color: COLORS.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.lightPurple,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: COLORS.brandPurple,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  signOutContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.backgroundSecondary,
  },
  box: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  imagePickerButton: {
    backgroundColor: COLORS.brandPurple,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  imagePickerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.inputBorder,
  },
  dividerText: {
    paddingHorizontal: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  ratingActivityName: {
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 24,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "700",
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 32,
    color: COLORS.brandPurple,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "center",
  },
});
