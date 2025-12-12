import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import supabase from "../../supabase";

interface MediaPost {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string;
  created_at: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_media")
        .select("id, user_id, caption, media_url, created_at")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching posts:", error);
      else setPosts(data || []);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Image source={{ uri: item.media_url }} style={styles.postImage} />
            {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  flatListContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
  },
  postCard: {
    height: 450,
    borderWidth: 1,
    marginBottom: 20,
    //borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postImage: {
    width: "90%",
    //eight: 250,
    borderWidth: 2,
    aspectRatio: 1,
    marginTop: 20,
  },
  caption: {
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
});
