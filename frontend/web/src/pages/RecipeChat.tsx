import { useState, useRef, useEffect } from "react";
import api from "../lib/api";

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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      fetchHistory();
    }
  }, [open, messages.length]);

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
            "Hi! I'm your ReCopé AI assistant 🍳 I can generate any recipe you want, or suggest recipes based on your pantry. What would you like to cook today?",
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

    // Save user message
    await api.post("/api/chat", { role: "user", content: userMessage });

    const data = await api.post("/api/ai/generate", {
      message: userMessage,
      history: messages,
    });

    if (data.error) {
      const errMsg: Message = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
      await api.post("/api/chat", {
        role: "assistant",
        content: errMsg.content,
      });
      setLoading(false);
      return;
    }

    const assistantMsg: Message = {
      role: "assistant",
      content: data.message,
      recipe: data.type === "recipe" ? data : undefined,
    };

    setMessages((prev) => [...prev, assistantMsg]);

    // Save assistant message
    await api.post("/api/chat", {
      role: "assistant",
      content: data.message,
      recipe: data.type === "recipe" ? data : null,
    });

    setLoading(false);
  };

  const handleSaveRecipe = async (recipe: any) => {
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
      window.dispatchEvent(new Event("recipes-updated"));
      const savedMsg: Message = {
        role: "assistant",
        content: `✅ "${recipe.title}" has been saved to your recipes!`,
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
    await api.delete("/api/chat");
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! What would you like to cook today?",
      },
    ]);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#2d6a4f",
          color: "#fff",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(45,106,79,0.4)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
        }}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat drawer */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 32,
            width: 380,
            height: 540,
            backgroundColor: "#fff",
            borderRadius: 16,
            border: "1px solid #eee",
            boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #eee",
              backgroundColor: "#2d6a4f",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3
                style={{
                  color: "#fff",
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                🤖 ReCopé AI
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  margin: 0,
                  fontSize: 11,
                  marginTop: 1,
                }}
              >
                Generate any recipe · Uses your pantry
              </p>
            </div>
            <button
              onClick={handleClear}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: 6,
                color: "#fff",
                fontSize: 11,
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {loadingHistory ? (
              <div style={{ textAlign: "center", color: "#999", padding: 20 }}>
                Loading history...
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "10px 14px",
                        borderRadius:
                          msg.role === "user"
                            ? "12px 12px 2px 12px"
                            : "12px 12px 12px 2px",
                        backgroundColor:
                          msg.role === "user" ? "#2d6a4f" : "#f5f5f5",
                        color: msg.role === "user" ? "#fff" : "#1a1a1a",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {/* Recipe card */}
                  {msg.recipe && (
                    <div
                      style={{
                        marginTop: 10,
                        backgroundColor: "#eaf4ef",
                        borderRadius: 12,
                        padding: 14,
                        border: "1px solid #95c9b0",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 6px",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {msg.recipe.title}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: 13,
                          color: "#666",
                        }}
                      >
                        {msg.recipe.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          fontSize: 12,
                          color: "#999",
                          marginBottom: 10,
                        }}
                      >
                        <span>
                          ⏱ {msg.recipe.prep_time + msg.recipe.cook_time}min
                        </span>
                        <span>👤 {msg.recipe.servings} servings</span>
                        <span>
                          🥘 {msg.recipe.ingredients?.length} ingredients
                        </span>
                      </div>
                      <button
                        onClick={() => handleSaveRecipe(msg.recipe)}
                        disabled={saving}
                        style={{
                          width: "100%",
                          backgroundColor: "#2d6a4f",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 0",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {saving ? "Saving..." : "+ Save to ReCopé"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "12px 12px 12px 2px",
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "#999",
                  }}
                >
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: 12,
              borderTop: "1px solid #eee",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about recipes..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #eee",
                fontSize: 14,
                outline: "none",
                backgroundColor: "#f4faf7",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                backgroundColor:
                  loading || !input.trim() ? "#95c9b0" : "#2d6a4f",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
