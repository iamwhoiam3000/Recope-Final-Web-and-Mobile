import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  difficulty: string;
  is_good: boolean;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export default function ReviewSection({ recipeId }: { recipeId: string }) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [isGood, setIsGood] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    const data = await api.get(`/api/reviews/${recipeId}`);
    if (Array.isArray(data)) setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [recipeId]);

  const resetForm = () => {
    setRating(5);
    setComment("");
    setDifficulty("Easy");
    setIsGood(true);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert("Missing comment", "Please write a short review.");
      return;
    }

    setSaving(true);

    const payload = {
      rating,
      comment,
      difficulty,
      is_good: isGood,
    };

    const data = editingId
      ? await api.put(`/api/reviews/${editingId}`, payload)
      : await api.post(`/api/reviews/${recipeId}`, payload);

    if (data.error) {
      Alert.alert("Error", data.error);
    } else {
      await fetchReviews();
      resetForm();
    }

    setSaving(false);
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.comment || "");
    setDifficulty(review.difficulty || "Easy");
    setIsGood(Boolean(review.is_good));
  };

  const handleDelete = (reviewId: string) => {
    Alert.alert("Delete Review", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const data = await api.remove(`/api/reviews/${reviewId}`);
          if (data.error) {
            Alert.alert("Error", data.error);
            return;
          }
          await fetchReviews();
          if (editingId === reviewId) resetForm();
        },
      },
    ]);
  };

  const getName = (review: Review) => {
    const p = review.profiles;
    if (!p) return "Unknown";
    if (p.first_name) return `${p.first_name} ${p.last_name || ""}`.trim();
    return p.username || "Unknown";
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        reviews.length
      : 0;

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reviews</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryRating}>
          {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} ★
        </Text>
        <Text style={styles.summaryText}>
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.formBox}>
        <Text style={styles.formTitle}>
          {editingId ? "Edit your review" : "Write a review"}
        </Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={styles.star}>{star <= rating ? "★" : "☆"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.choiceRow}>
          {["Easy", "Medium", "Hard"].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.choice,
                difficulty === level && styles.choiceActive,
              ]}
              onPress={() => setDifficulty(level)}
            >
              <Text
                style={[
                  styles.choiceText,
                  difficulty === level && styles.choiceTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.choiceRow}>
          <TouchableOpacity
            style={[styles.choice, isGood && styles.choiceActive]}
            onPress={() => setIsGood(true)}
          >
            <Text style={[styles.choiceText, isGood && styles.choiceTextActive]}>
              👍 Good
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choice, !isGood && styles.choiceActive]}
            onPress={() => setIsGood(false)}
          >
            <Text
              style={[styles.choiceText, !isGood && styles.choiceTextActive]}
            >
              👎 Not good
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Share your thoughts..."
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <View style={styles.formActions}>
          {editingId && (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.submitText}>
              {saving ? "Saving..." : editingId ? "Update Review" : "Submit Review"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>
      ) : (
        reviews.map((review) => {
          const isOwner = user?.id === review.user_id;

          return (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  {review.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: review.profiles.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {getName(review).charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{getName(review)}</Text>
                  <Text style={styles.reviewMeta}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)} · {review.difficulty} ·{" "}
                    {review.is_good ? "Good" : "Not good"}
                  </Text>
                </View>
              </View>

              <Text style={styles.reviewComment}>{review.comment}</Text>

              {isOwner && (
                <View style={styles.reviewActions}>
                  <TouchableOpacity onPress={() => handleEdit(review)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(review.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRating: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  formBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  star: {
    fontSize: 28,
    color: "#f59e0b",
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  choiceActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  choiceTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  commentInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    backgroundColor: colors.white,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  submitText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: 12,
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  reviewMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  editText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  deleteText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});