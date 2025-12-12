import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import supabase from "../supabase";

const COLORS = {
  background: '#FAF8FC',
  backgroundSecondary: '#FFFFFF',
  brandPurple: '#8174A0',
  brandPink: '#C599B6',
  textPrimary: '#2D2438',
  textSecondary: '#6B6078',
  textTertiary: '#9B8FA8',
  inputBorder: '#E0D8E8',
  lightPurple: '#E3DFED',
  white: '#FFFFFF',
};

interface OrganizerProfileProps {
  visible: boolean;
  organizerId: string | null;
  onClose: () => void;
}

interface Profile {
  user_id: string;
  name: string;
  bio: string;
  interests: string[];
}

interface RatingStats {
  avgCommunication: number;
  avgSafety: number;
  avgOverall: number;
  totalRatings: number;
}

export default function OrganizerProfile({
  visible,
  organizerId,
  onClose,
}: OrganizerProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && organizerId) {
      fetchOrganizerData();
    }
  }, [visible, organizerId]);

  const fetchOrganizerData = async () => {
    if (!organizerId) return;

    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, name, bio, interests")
        .eq("user_id", organizerId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData as Profile);
      }

      // Fetch and calculate average ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("organizer_ratings")
        .select("communication_rating, safety_rating, overall_rating")
        .eq("organizer_id", organizerId);

      if (ratingsError) {
        console.error("Error fetching ratings:", ratingsError);
      } else if (ratingsData && ratingsData.length > 0) {
        const avgCommunication =
          ratingsData.reduce((sum, r) => sum + (r.communication_rating || 0), 0) /
          ratingsData.length;
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
      console.error("Error fetching organizer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push("★");
      } else if (i === fullStars && hasHalfStar) {
        stars.push("★");
      } else {
        stars.push("☆");
      }
    }

    return stars.join(" ");
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Organizer Profile</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.brandPurple} />
            </View>
          ) : (
            <ScrollView style={styles.content}>
              {profile ? (
                <>
                  {/* Name and Initial */}
                  <View style={styles.profileHeader}>
                    <View style={styles.profilePicturePlaceholder}>
                      <Text style={styles.profileInitial}>
                        {profile.name[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.name}>{profile.name}</Text>
                  </View>

                  {/* Bio */}
                  {profile.bio && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>About</Text>
                      <Text style={styles.bioText}>{profile.bio}</Text>
                    </View>
                  )}

                  {/* Interests */}
                  {profile.interests && profile.interests.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Interests</Text>
                      <View style={styles.interestsContainer}>
                        {profile.interests.map((interest, index) => (
                          <View key={index} style={styles.interestChip}>
                            <Text style={styles.interestText}>{interest}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Ratings */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Organizer Ratings</Text>
                    {ratings && ratings.totalRatings > 0 ? (
                      <View>
                        <Text style={styles.ratingsCount}>
                          Based on {ratings.totalRatings} rating
                          {ratings.totalRatings !== 1 ? "s" : ""}
                        </Text>

                        <View style={styles.ratingRow}>
                          <Text style={styles.ratingLabel}>Communication</Text>
                          <View style={styles.ratingValue}>
                            <Text style={styles.starsText}>
                              {renderStars(ratings.avgCommunication)}
                            </Text>
                            <Text style={styles.ratingNumber}>
                              {ratings.avgCommunication.toFixed(1)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.ratingRow}>
                          <Text style={styles.ratingLabel}>Safety</Text>
                          <View style={styles.ratingValue}>
                            <Text style={styles.starsText}>
                              {renderStars(ratings.avgSafety)}
                            </Text>
                            <Text style={styles.ratingNumber}>
                              {ratings.avgSafety.toFixed(1)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.ratingRow}>
                          <Text style={styles.ratingLabel}>Overall</Text>
                          <View style={styles.ratingValue}>
                            <Text style={styles.starsText}>
                              {renderStars(ratings.avgOverall)}
                            </Text>
                            <Text style={styles.ratingNumber}>
                              {ratings.avgOverall.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.noRatingsText}>
                        No ratings yet for this organizer
                      </Text>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    Unable to load organizer profile
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  profilePicturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brandPurple,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.lightPurple,
  },
  interestText: {
    fontSize: 14,
    color: COLORS.brandPurple,
    fontWeight: "500",
  },
  ratingsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  ratingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  starsText: {
    fontSize: 16,
    color: COLORS.brandPurple,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    minWidth: 30,
  },
  noRatingsText: {
    fontSize: 15,
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
