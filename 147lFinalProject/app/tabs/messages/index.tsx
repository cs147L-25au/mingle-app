import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import supabase from "../../../supabase";
import { useEffect, useState, useCallback } from "react";
import { theme } from "../../../assets/theme";
import { Ionicons } from "@expo/vector-icons";

interface ChatListItem {
  chat_id: string;
  event_name: string;
  last_chat: string;
  activity_type: string;
  last_chat_time: string;
}

interface Event {
  name: string;
  activity_type: string;
  status: "pending" | "completed" | string;
}

interface ChatData {
  chat_id: string;
  chats: {
    events: Event | Event[] | null;
    messages: { content: string; created_at: string }[];
  };
}
//const CURRENT_USER_ID = "test_user_id_A";

export default function Messages() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
      } else {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  const fetchUserChats = async () => {
    if (!userId) return;

    if (chats.length === 0) setLoading(true);

    const { data, error } = await supabase
      .from("chat_participants")
      .select(
        `
        chat_id,
        chats (
        events (name, activity_type, status),
        messages (content, created_at)
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching chats:", error);
      setLoading(false);
      return;
    }
    const rows = data as unknown as ChatData[];

    const formattedChats: (ChatListItem | null)[] = rows.map((item) => {
      const messages = item.chats.messages || [];
      messages.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latest = messages[0];

      const rawEvents = item.chats.events;

      let eventName = "Unknown Event";
      let activityType = "default";
      let status = "pending";

      if (Array.isArray(rawEvents) && rawEvents.length > 0) {
        eventName = rawEvents[0].name;
        activityType = rawEvents[0].activity_type || "default";
        status = rawEvents[0].status || "pending";
      } else if (rawEvents && !Array.isArray(rawEvents)) {
        eventName = rawEvents.name;
        activityType = rawEvents.activity_type || "default";
        status = rawEvents.status || "pending";
      }

      if (status === "completed") return null;

      return {
        chat_id: item.chat_id,
        event_name: eventName,
        activity_type: activityType,
        last_chat: latest?.content || "Tap to start chatting...",
        last_chat_time: latest?.created_at || new Date(0).toISOString(),
      };
    });

    const cleanedChats = formattedChats.filter(Boolean) as ChatListItem[];

    cleanedChats.sort(
      (a, b) =>
        new Date(b.last_chat_time).getTime() -
        new Date(a.last_chat_time).getTime()
    );

    setChats(cleanedChats);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserChats();
      }
    }, [userId])
  );

  useEffect(() => {
    if (!userId) return;

    // --- 1. Listen for new messages ---
    const messageChannel = supabase
      .channel("chat-list-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          setChats((prev) => {
            const updated = prev.map((chat) => {
              if (chat.chat_id === newMessage.chat_id) {
                return {
                  ...chat,
                  last_chat: newMessage.content,
                  last_chat_time: newMessage.created_at,
                };
              }
              return chat;
            });

            return updated.sort(
              (a, b) =>
                new Date(b.last_chat_time).getTime() -
                new Date(a.last_chat_time).getTime()
            );
          });
        }
      )
      .subscribe();

    // --- 2. Listen for new chat participants ---
    const participantChannel = supabase
      .channel("chat-list-participation")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_participants",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUserChats(); // refresh chats when user joins new chat
        }
      )
      .subscribe();

    // --- 3. Listen for event status updates ---
    const eventStatusChannel = supabase
      .channel("chat-event-status-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
        },
        (payload) => {
          const updatedEvent = payload.new;
          if (updatedEvent.status === "completed") {
            // Remove any chat linked to this event
            setChats((prev) =>
              prev.filter((chat) => chat.chat_id !== updatedEvent.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(participantChannel);
      supabase.removeChannel(eventStatusChannel);
    };
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8174A0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupNameText}>Your Messages</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.chat_id}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.messageBox}
            onPress={() => router.push(`../../chat/${item.chat_id}`)}
          >
            <View style={styles.boxContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubbles" size={24} color={COLORS.white} />
              </View>
              <View style={styles.textArea}>
                <Text style={styles.groupNameText}>{item.event_name}</Text>
                <Text style={styles.messageText} numberOfLines={1}>
                  {item.last_chat}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const COLORS = {
  background: '#FAF8FC',
  brandPurple: '#8174A0',
  brandPink: '#C599B6',
  textPrimary: '#2D2438',
  textSecondary: '#6B6078',
  textTertiary: '#9B8FA8',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#E0D8E8',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  flatListContent: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  messageBox: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: COLORS.brandPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  boxContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  groupNameText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  textArea: {
    flex: 1,
    gap: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brandPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});
