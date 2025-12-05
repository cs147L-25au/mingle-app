import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../supabase";
import { useEffect, useState, useRef } from "react";

interface Message {
  id: number;
  content: string;
  user_id: string;
  created_at: string;
}

const CURRENT_USER_ID = "test_user_id_A";
const MessageBubble = ({ text, isMe }: { text: string; isMe: boolean }) => (
  <View
    style={[
      styles.messageBubble,
      isMe ? styles.myMessage : styles.theirMessage,
    ]}
  >
    <Text
      style={[
        styles.messageText,
        isMe ? { color: "white" } : { color: "black" },
      ]}
    >
      {text}
    </Text>
  </View>
);
export default function ChatRoom() {
  const router = useRouter();
  const { chat_id } = useLocalSearchParams();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupName, setGroupName] = useState("Loading Chat...");
  const [loading, setLoading] = useState(true);

  const fetchChatData = async () => {
    setLoading(true);

    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select(`id, content, user_id, created_at`)
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
    } else {
      setMessages(messagesData as Message[]);
    }

    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .select("events(name)")
      .eq("id", chat_id)
      .single();

    if (chatError) {
      console.error("Error fetching group name:", chatError);
      setGroupName("Chat Not Found");
    } else if (chatData && chatData.events) {
      const eventData = chatData.events;

      if (Array.isArray(eventData) && eventData.length > 0) {
        setGroupName(eventData[0].name || "Unknown Group");
      } else if (!Array.isArray(eventData) && (eventData as any).name) {
        setGroupName((eventData as any).name);
      } else {
        setGroupName("Unknown Group");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchChatData();
  }, [chat_id]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chat_id}`,
        },
        (payload) => {
          console.log("New message received!", payload.new);
          const newMessage = payload.new as Message;

          setMessages((currentMessages) => [...currentMessages, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat_id]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText;
    setInputText("");

    const { error } = await supabase.from("messages").insert({
      chat_id: chat_id,
      user_id: CURRENT_USER_ID,
      content: messageText,
    });

    if (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading chat messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      //keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.chatTitle}
          onPress={() => router.push("/messages")}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </Pressable>
        <View style={styles.chatTitle}>
          <Text style={styles.titleText}>{groupName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.messagesView}
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={
              message.user_id === CURRENT_USER_ID
                ? styles.myMessageWrapper
                : styles.theirMessageWrapper
            }
          >
            <MessageBubble
              text={message.content}
              isMe={message.user_id === CURRENT_USER_ID}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          value={inputText}
          onChangeText={setInputText}
        />
        <Pressable style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d8efffff",
  },
  chatTitle: {
    justifyContent: "flex-end",
    marginLeft: "3%",
  },
  titleText: {
    fontSize: 30,
    fontFamily: "Poppins-Bold",
  },
  backText: {
    fontSize: 30,
    fontFamily: "Poppins-Bold",
  },
  header: {
    flex: 0.13,
    backgroundColor: "white",
    flexDirection: "row",
  },
  messagesView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  myMessageWrapper: {
    marginRight: 10,
    alignItems: "flex-end",
    marginBottom: 15,
  },
  theirMessageWrapper: {
    marginLeft: 10,
    alignItems: "flex-start",
    marginBottom: 15,
  },
  myMessage: {
    borderRadius: 15,
    backgroundColor: "black",
  },
  theirMessage: {
    borderRadius: 15,
    backgroundColor: "white",
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  messageBubble: {
    padding: 12,
  },
  inputContainer: {
    flexDirection: "row",
    flex: 0.12,
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#005bbdff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});
