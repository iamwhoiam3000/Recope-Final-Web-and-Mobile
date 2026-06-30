import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StarRating from "./StarRating";

interface Review {
  id: string;
  rating: number;
  comment: string;
  difficulty: string;
  is_good: boolean | null;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    username: string;
    avatar_url: string;
  };
}

interface Props {
  recipeId: string;
}

const difficultyColors: Record<string, string> = {
  Easy: "#2e7d32",
  Medium: "#f59e0b",
  Hard: "#e53935",
};

export default function ReviewSection({ recipeId }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isGood, setIsGood] = useState<boolean | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editIsGood, setEditIsGood] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [recipeId]);

  const fetchReviews = async () => {
    const data = await api.get(`/api/reviews/${recipeId}`);
    if (Array.isArray(data)) setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setError("Please select a star rating");
    setSubmitting(true);
    setError("");

    const data = await api.post(`/api/reviews/${recipeId}`, {
      rating,
      comment,
      difficulty,
      is_good: isGood,
    });

    if (data.error) {
      setError(data.error);
    } else {
      setReviews((prev) => [data, ...prev]);
      setRating(0);
      setComment("");
      setDifficulty("");
      setIsGood(null);
    }
    setSubmitting(false);
  };

  const handleUpdate = async (id: string) => {
    const data = await api.put(`/api/reviews/${id}`, {
      rating: editRating,
      comment: editComment,
      difficulty: editDifficulty,
      is_good: editIsGood,
    });
    if (!data.error) {
      setReviews((prev) => prev.map((r) => (r.id === id ? data : r)));
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this review?")) return;
    await api.delete(`/api/reviews/${id}`);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditDifficulty(review.difficulty || "");
    setEditIsGood(review.is_good);
  };

  const getAuthorName = (profiles: Review["profiles"]) => {
    if (!profiles) return "Unknown";
    if (profiles.first_name)
      return `${profiles.first_name} ${profiles.last_name || ""}`.trim();
    return profiles.username || "Unknown";
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const goodCount = reviews.filter((r) => r.is_good === true).length;
  const notGoodCount = reviews.filter((r) => r.is_good === false).length;
  const easyCount = reviews.filter((r) => r.difficulty === "Easy").length;
  const mediumCount = reviews.filter((r) => r.difficulty === "Medium").length;
  const hardCount = reviews.filter((r) => r.difficulty === "Hard").length;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #eee",
    fontSize: 14,
    outline: "none",
    backgroundColor: "#fafaf8",
    resize: "vertical" as const,
  };

  const ThumbBtn = ({
    value,
    current,
    onChange,
  }: {
    value: boolean;
    current: boolean | null;
    onChange: (v: boolean | null) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(current === value ? null : value)}
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 18,
        cursor: "pointer",
        border: `1px solid ${current === value ? (value ? "#2e7d32" : "#e53935") : "#eee"}`,
        backgroundColor:
          current === value ? (value ? "#f1f8e9" : "#fff5f5") : "#fff",
        color: current === value ? (value ? "#2e7d32" : "#e53935") : "#666",
        fontWeight: current === value ? 700 : 400,
      }}
    >
      {value ? "👍" : "👎"}
    </button>
  );

  const DiffBtn = ({
    value,
    current,
    onChange,
  }: {
    value: string;
    current: string;
    onChange: (v: string) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(current === value ? "" : value)}
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        cursor: "pointer",
        border: `1px solid ${current === value ? difficultyColors[value] : "#eee"}`,
        backgroundColor:
          current === value ? `${difficultyColors[value]}15` : "#fff",
        color: current === value ? difficultyColors[value] : "#666",
        fontWeight: current === value ? 700 : 400,
      }}
    >
      {value === "Easy" ? "🟢" : value === "Medium" ? "🟡" : "🔴"} {value}
    </button>
  );

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 24,
        marginTop: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Reviews ({reviews.length})
        </h3>
        {reviews.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StarRating rating={Math.round(avgRating)} size={20} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>
              {avgRating.toFixed(1)}
            </span>
            <span style={{ fontSize: 13, color: "#999" }}>
              ({reviews.length})
            </span>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {reviews.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {(goodCount > 0 || notGoodCount > 0) && (
            <div
              style={{
                backgroundColor: "#fafaf8",
                borderRadius: 10,
                padding: "10px 16px",
                border: "1px solid #eee",
                display: "flex",
                gap: 16,
              }}
            >
              {goodCount > 0 && (
                <span
                  style={{ fontSize: 13, color: "#2e7d32", fontWeight: 600 }}
                >
                  👍 {goodCount} Recommended
                </span>
              )}
              {notGoodCount > 0 && (
                <span
                  style={{ fontSize: 13, color: "#e53935", fontWeight: 600 }}
                >
                  👎 {notGoodCount} Not Recommended
                </span>
              )}
            </div>
          )}
          {(easyCount > 0 || mediumCount > 0 || hardCount > 0) && (
            <div
              style={{
                backgroundColor: "#fafaf8",
                borderRadius: 10,
                padding: "10px 16px",
                border: "1px solid #eee",
                display: "flex",
                gap: 12,
              }}
            >
              {easyCount > 0 && (
                <span
                  style={{ fontSize: 13, color: "#2e7d32", fontWeight: 600 }}
                >
                  🟢 {easyCount} Easy
                </span>
              )}
              {mediumCount > 0 && (
                <span
                  style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}
                >
                  🟡 {mediumCount} Medium
                </span>
              )}
              {hardCount > 0 && (
                <span
                  style={{ fontSize: 13, color: "#e53935", fontWeight: 600 }}
                >
                  🔴 {hardCount} Hard
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Write a review form */}
      <div
        style={{
          backgroundColor: "#fafaf8",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          border: "1px solid #f0f0f0",
        }}
      >
        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          Write a Review
        </h4>

        {error && (
          <p
            style={{
              color: "#e53935",
              fontSize: 13,
              marginBottom: 12,
              backgroundColor: "#fff5f5",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ffcdd2",
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#444",
              marginBottom: 8,
            }}
          >
            Overall Rating *
          </p>
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  fontSize: 32,
                  cursor: "pointer",
                  color:
                    star <= (hoverRating || rating) ? "#f59e0b" : "#e5e7eb",
                  transition: "color 0.1s",
                }}
              >
                ★
              </span>
            ))}
            {rating > 0 && (
              <span style={{ fontSize: 13, color: "#999", marginLeft: 8 }}>
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#444",
              marginBottom: 8,
            }}
          >
            Would you recommend it?
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <ThumbBtn value={true} current={isGood} onChange={setIsGood} />
            <ThumbBtn value={false} current={isGood} onChange={setIsGood} />
            {isGood !== null && (
              <span
                style={{
                  fontSize: 13,
                  color: isGood ? "#2e7d32" : "#e53935",
                  fontWeight: 600,
                }}
              >
                {isGood ? "Yes, I recommend it!" : "Not recommended"}
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#444",
              marginBottom: 8,
            }}
          >
            Difficulty Level
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["Easy", "Medium", "Hard"].map((d) => (
              <DiffBtn
                key={d}
                value={d}
                current={difficulty}
                onChange={setDifficulty}
              />
            ))}
          </div>

          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#444",
              marginBottom: 8,
            }}
          >
            Your Review (optional)
          </p>
          <textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={submitting || rating === 0}
            style={{
              marginTop: 10,
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              backgroundColor:
                submitting || rating === 0 ? "#f0c080" : "#e67e22",
              color: "#fff",
              cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>

      {/* Reviews list */}
      {loading && <p style={{ color: "#999" }}>Loading reviews...</p>}
      {!loading && reviews.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
          <p style={{ fontSize: 15 }}>No reviews yet. Be the first!</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{ borderBottom: "1px solid #f5f5f5", paddingBottom: 16 }}
          >
            {editingId === review.id ? (
              <div
                style={{
                  backgroundColor: "#fdf3e7",
                  borderRadius: 10,
                  padding: 16,
                  border: "1px solid #f0c080",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Overall Rating
                </p>
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setEditRating(star)}
                      style={{
                        fontSize: 28,
                        cursor: "pointer",
                        color: star <= editRating ? "#f59e0b" : "#e5e7eb",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Recommend?
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <ThumbBtn
                    value={true}
                    current={editIsGood}
                    onChange={setEditIsGood}
                  />
                  <ThumbBtn
                    value={false}
                    current={editIsGood}
                    onChange={setEditIsGood}
                  />
                </div>

                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Difficulty
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <DiffBtn
                      key={d}
                      value={d}
                      current={editDifficulty}
                      onChange={setEditDifficulty}
                    />
                  ))}
                </div>

                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, marginBottom: 10 }}
                />

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      border: "1px solid #eee",
                      background: "#fff",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdate(review.id)}
                    style={{
                      backgroundColor: "#e67e22",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#fdf3e7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#e67e22",
                        overflow: "hidden",
                        border: "1px solid #eee",
                        flexShrink: 0,
                      }}
                    >
                      {review.profiles?.avatar_url ? (
                        <img
                          src={review.profiles.avatar_url}
                          alt="avatar"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        getAuthorName(review.profiles).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                        {getAuthorName(review.profiles)}
                      </p>
                      <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {user?.id === review.user_id && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => startEdit(review)}
                        style={{
                          border: "1px solid #eee",
                          background: "#fff",
                          padding: "5px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          color: "#666",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        style={{
                          border: "1px solid #ffcdd2",
                          background: "#fff5f5",
                          color: "#e53935",
                          padding: "5px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <StarRating rating={review.rating} size={16} />

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {review.is_good !== null && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "3px 10px",
                        borderRadius: 20,
                        backgroundColor: review.is_good ? "#f1f8e9" : "#fff5f5",
                        color: review.is_good ? "#2e7d32" : "#e53935",
                        fontWeight: 600,
                        border: `1px solid ${review.is_good ? "#c5e1a5" : "#ffcdd2"}`,
                      }}
                    >
                      {review.is_good ? "👍 Recommended" : "👎 Not Recommended"}
                    </span>
                  )}
                  {review.difficulty && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "3px 10px",
                        borderRadius: 20,
                        backgroundColor: `${difficultyColors[review.difficulty]}15`,
                        color: difficultyColors[review.difficulty],
                        fontWeight: 600,
                        border: `1px solid ${difficultyColors[review.difficulty]}40`,
                      }}
                    >
                      {review.difficulty === "Easy"
                        ? "🟢"
                        : review.difficulty === "Medium"
                          ? "🟡"
                          : "🔴"}{" "}
                      {review.difficulty}
                    </span>
                  )}
                </div>

                {review.comment && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "#444",
                      marginTop: 10,
                      lineHeight: 1.6,
                    }}
                  >
                    {review.comment}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
