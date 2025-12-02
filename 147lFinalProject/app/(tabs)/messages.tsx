import { View, Text, StyleSheet } from "react-native";

export default function Messages() {
  return (
    <View style={styles.container}>
      <View style={styles.messageBox}>
        <View style={styles.boxContent}>
          <Text style={styles.emojiText}>😊</Text>

          <View style={styles.textArea}>
            <Text style={styles.groupNameText}>Example Group</Text>
            <Text style={styles.messageText}>Example Message</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    margin: 5,
  },
  messageBox: {
    flex: 0.15,
    backgroundColor: "#cdefffff",
    width: "100%",
    //borderWidth: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    borderRadius: "8%",
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
});
