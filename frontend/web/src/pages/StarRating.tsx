interface Props {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  max = 5,
  size = 18,
  interactive = false,
  onRate,
}: Props) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <span
          key={star}
          onClick={() => interactive && onRate?.(star)}
          style={{
            fontSize: size,
            cursor: interactive ? "pointer" : "default",
            color: star <= rating ? "#f59e0b" : "#e5e7eb",
            transition: "color 0.1s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
