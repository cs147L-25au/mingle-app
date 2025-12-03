import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../../supabase";
import { useEffect, useState } from "react";

interface ChatListItem {
  chat_id: string;
  event_name: string;
}
const CURRENT_USER_ID = "test_user_id_A";

export default function Messages() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserChats = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("chat_participants")
      .select(
        `
        chat_id,
        chats (
          event_id,
          events (name) 
        )
      `
      )
      .eq("user_id", CURRENT_USER_ID);

    if (error) {
      console.error("Error fetching chats:", error);
      setLoading(false);
      return;
    }

    const formattedChats: ChatListItem[] = data.map((item: any) => ({
      chat_id: item.chat_id,
      event_name: item.chats.events.name,
    }));

    setChats(formattedChats);
    setLoading(false);
  };

  useEffect(() => {
    fetchUserChats();
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
      <FlatList
        data={chats}
        keyExtractor={(item) => item.chat_id}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.messageBox}
            onPress={() => router.push(`/messages/${item.chat_id}`)}
          >
            <View style={styles.boxContent}>
              <Text style={styles.emojiText}>💬</Text>
              <View style={styles.textArea}>
                <Text style={styles.groupNameText}>{item.event_name}</Text>
                <Text style={styles.messageText}>Tap to start chatting...</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    //alignItems: "center",
    // margin: 5,
  },
  flatListContent: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    flexGrow: 1,
  },
  messageBox: {
    flex: 0.15,
    backgroundColor: "#cdefffff",
    width: "100%",
    justifyContent: "center",
    alignItems: "flex-start",
    borderRadius: "8%",
    paddingVertical: 20,
  },
  boxContent: {
    flexDirection: "row",
    marginLeft: "4%",
    gap: 10,
  },
  groupNameText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  messageText: {
    fontSize: 15,
  },
  textArea: {
    flexDirection: "column",
    gap: 5,
  },
  emojiText: {
    fontSize: 40,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});
