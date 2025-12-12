import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import supabase from "../../supabase";

const pushPin = require("../../assets/pushpin.png");

interface MediaPost {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string;
  created_at: string;
  name?: string;
  like_count?: number;
  liked_by_user?: boolean;
}

export default function Feed() {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current authenticated user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Fetch posts with names and like info
  const fetchPosts = async () => {
    if (!userId) return;

    setLoading(true);

    const { data: postsData, error: postsError } = await supabase
      .from("user_media")
      .select("id, user_id, caption, media_url, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(postsData.map((p) => p.user_id)));

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", userIds);

    const postIds = postsData.map((p) => p.id);

    const { data: likesData } = await supabase
      .from("post_likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    const postsWithExtras = postsData.map((post) => {
      const profile = profilesData.find((p) => p.user_id === post.user_id);
      const likesForPost = likesData.filter((l) => l.post_id === post.id);
      return {
        ...post,
        name: profile?.name ?? "Unknown",
        like_count: likesForPost.length,
        liked_by_user: likesForPost.some((l) => l.user_id === userId),
      };
    });

    setPosts(postsWithExtras);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchPosts();

    // Real-time likes updates
    const likesChannel = supabase
      .channel("post-likes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        () => fetchPosts()
      )
      .subscribe();

    return () => supabase.removeChannel(likesChannel);
  }, [userId]);

  const toggleLike = async (postId: string) => {
    if (!userId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.liked_by_user) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_user: !p.liked_by_user,
              like_count: p.liked_by_user
                ? p.like_count! - 1
                : p.like_count! + 1,
            }
          : p
      )
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Image source={pushPin} style={styles.pushPin} />

            <Text style={styles.name}>{item.name}</Text>

            <Image source={{ uri: item.media_url }} style={styles.postImage} />

            {item.caption && <Text style={styles.caption}>{item.caption}</Text>}

            <View style={styles.likeContainer}>
              <Pressable onPress={() => toggleLike(item.id)}>
                <Ionicons
                  name={item.liked_by_user ? "heart" : "heart-outline"}
                  size={28}
                  color={item.liked_by_user ? "red" : "black"}
                />
              </Pressable>
              <Text style={styles.likeCount}>{item.like_count}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const COLORS = {
  background: "#FAF8FC",
  brandPurple: "#8174A0",
  brandPink: "#C599B6",
  textPrimary: "#2D2438",
  textSecondary: "#6B6078",
  textTertiary: "#9B8FA8",
  white: "#FFFFFF",
  cardBg: "#FFFFFF",
  border: "#E0D8E8",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  flatListContent: { paddingVertical: 10, paddingHorizontal: 10, gap: 10 },
  postCard: {
    height: 450,
    borderWidth: 2,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    position: "relative",
    alignItems: "center",
  },
  postImage: {
    width: "90%",
    borderWidth: 2,
    borderColor: COLORS.cardBg,
    aspectRatio: 1,
    marginTop: 35,
  },
  caption: {
    padding: 10,
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  name: {
    position: "absolute",
    top: 10,
    left: 10,
    fontWeight: "bold",
    fontSize: 18,
    color: "#333",
    zIndex: 2,
  },
  pushPin: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    width: 28,
    height: 28,
    resizeMode: "contain",
    zIndex: 2,
  },
  likeContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  likeCount: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
});
