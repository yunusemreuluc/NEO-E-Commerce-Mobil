import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Message = {
  id: string;
  from: "user" | "ai";
  text: string;
};

export default function AIScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "ai",
      text: "Merhaba, ben NEO AI. Ne tarz bir ürün arıyorsun?",
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      from: "user",
      text: input.trim(),
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      from: "ai",
      text:
        "Anladım, şimdilik burası demo. Sonraki adımda bu mesajı backend’deki yapay zeka API’sine bağlayacağız.",
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.from === "user";
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          isUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
        ]}
      >
        <Text style={isUser ? styles.userText : styles.aiText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.title}>NEO AI</Text>
        <Text style={styles.subtitle}>
          Doğal dil ile ürün ara. Örn: &quot;500 TL altı oyuncu mouse öner&quot;
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder='NE arıyorsun? Örn: 1000 TL altı kulaklık'
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#555" },
  chatContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: "#FF3B30",
  },
  aiBubble: {
    backgroundColor: "#ffffff",
  },
  userText: { color: "#fff" },
  aiText: { color: "#111" },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendText: { color: "#fff", fontWeight: "600" },
});
