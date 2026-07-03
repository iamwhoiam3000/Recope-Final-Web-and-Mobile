import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../lib/api";
import { colors } from "../theme";

interface Message {
  role: "user" | "assistant";
  content: string;
  recipe?: any;
}

export default function RecipeChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRecipeTitles, setSavedRecipeTitles] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (open && messages.length === 0) fetchHistory();
  }, [open]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const data = await api.get("/api/chat");
    if (Array.isArray(data) && data.length > 0) {
      setMessages(
        data.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          recipe: msg.recipe,
        })),
      );
    } else {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm your Recope AI 🍳 I can generate any recipe or suggest ones based on your pantry. What would you like to cook?",
        },
      ]);
    }
    setLoadingHistory(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");

    const newUserMsg: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setLoading(true);

    await api.post("/api/chat", { role: "user", content: userMessage });

    const data = await api.post("/api/ai/generate", {
      message: userMessage,
      history: messages,
    });

    const assistantMsg: Message = {
      role: "assistant",
      content: data.message || "Sorry, something went wrong.",
      recipe: data.type === "recipe" ? data : undefined,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    await api.post("/api/chat", {
      role: "assistant",
      content: assistantMsg.content,
      recipe: assistantMsg.recipe || null,
    });

    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

const handleSaveRecipe = async (recipe: any) => {
  if (saving || savedRecipeTitles.includes(recipe.title)) return;

  setSaving(true);

  const data = await api.post("/api/recipes", {
    title: recipe.title,
    description: recipe.description,
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    servings: recipe.servings,

    meal_type: Array.isArray(recipe.meal_type)
      ? recipe.meal_type
      : recipe.meal_type
        ? [recipe.meal_type]
        : [],

    cuisine_type: recipe.cuisine_type || "",
    cook_duration: recipe.cook_duration || "",

    ingredients: recipe.ingredients,
    steps: recipe.steps,
    generate_image: true,
  });

  if (!data.error) {
    setSavedRecipeTitles((prev) => [...prev, recipe.title]);

    const savedMsg: Message = {
      role: "assistant",
      content: `✅ "${recipe.title}" saved to your recipes!`,
    };

    setMessages((prev) => [...prev, savedMsg]);

    await api.post("/api/chat", {
      role: "assistant",
      content: savedMsg.content,
    });
  }

  setSaving(false);
};

  const handleClear = async () => {
    await api.remove("/api/chat");
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! What would you like to cook today?",
      },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View>
      <View
        style={{
          alignItems: item.role === "user" ? "flex-end" : "flex-start",
          marginBottom: 8,
        }}
      >
        <View
          style={[
            styles.bubble,
            item.role === "user" ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              item.role === "user" && { color: colors.white },
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>

      {item.recipe && (
        <View style={styles.recipeCard}>
          <Text style={styles.recipeTitle}>{item.recipe.title}</Text>
          <Text style={styles.recipeDesc}>{item.recipe.description}</Text>
          <View style={styles.recipeMeta}>
            <Text style={styles.recipeMetaText}>
              ⏱ {item.recipe.prep_time + item.recipe.cook_time}min
            </Text>
            <Text style={styles.recipeMetaText}>
              👤 {item.recipe.servings} servings
            </Text>
            <Text style={styles.recipeMetaText}>
              🥘 {item.recipe.ingredients?.length} ingredients
            </Text>
          </View>
          <TouchableOpacity
            style={styles.saveRecipeBtn}
            onPress={() => handleSaveRecipe(item.recipe)}
            disabled={saving}
          >
            <Text style={styles.saveRecipeBtnText}>
              {savedRecipeTitles.includes(item.recipe.title)
  ? "Saved"
  : saving
    ? "Saving..."
    : "+ Save to Recope"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <>
      {/* Floating button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>🤖</Text>
      </TouchableOpacity>

      {/* Chat modal */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>🤖 Recope AI</Text>
                <Text style={styles.headerSub}>
                  Generate any recipe · Uses your pantry
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            {loadingHistory ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, i) => i.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messages}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
                ListFooterComponent={
                  loading ? (
                    <View style={[styles.bubble, styles.aiBubble]}>
                      <ActivityIndicator
                        size="small"
                        color={colors.textMuted}
                      />
                    </View>
                  ) : null
                }
              />
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask me to generate a recipe..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!input.trim() || loading) && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!input.trim() || loading}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontSize: 24 },
  modal: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.white },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  clearBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearBtnText: { color: colors.white, fontSize: 12 },
  closeBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  closeBtnText: { color: colors.white, fontSize: 14 },
  messages: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 12, marginBottom: 4 },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: "#f5f5f5", borderBottomLeftRadius: 2 },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  recipeCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0c080",
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  recipeDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  recipeMeta: { flexDirection: "row", gap: 12, marginBottom: 10 },
  recipeMetaText: { fontSize: 12, color: colors.textMuted },
  saveRecipeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  saveRecipeBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#f0c080" },
  sendBtnText: { color: colors.white, fontWeight: "600", fontSize: 14 },
});
