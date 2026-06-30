import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Analytics {
  totalUsers: number;
  totalRecipes: number;
  recipesPerMonth: Record<string, number>;
  recentUsers: any[];
  topRecipes: any[];
  mealTypeCount: Record<string, number>;
  cuisineTypeCount: Record<string, number>;
  durationCount: Record<string, number>;
}

const COLORS = [
  "#e67e22",
  "#3498db",
  "#2ecc71",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
];

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    const fetchData = async () => {
      const result = await api.get("/api/admin/analytics");
      if (!result.error) setData(result);
      setLoading(false);
    };
    fetchData();
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;
  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ color: "#999" }}>Loading analytics...</div>
      </div>
    );
  if (!data) return <p>Failed to load analytics.</p>;

  const StatCard = ({
    label,
    value,
    icon,
    color,
  }: {
    label: string;
    value: number;
    icon: string;
    color: string;
  }) => (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 24,
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: "#999" }}>{label}</div>
    </div>
  );

  const BarChart = ({
    data,
    title,
  }: {
    data: Record<string, number>;
    title: string;
  }) => {
    const max = Math.max(...Object.values(data), 1);
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          {title}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            height: 160,
          }}
        >
          {Object.entries(data).map(([key, value], i) => (
            <div
              key={key}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                {value}
              </span>
              <div
                style={{
                  width: "100%",
                  height: `${Math.max((value / max) * 120, 4)}px`,
                  backgroundColor: COLORS[i % COLORS.length],
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.3s",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "#999",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DonutChart = ({
    data,
    title,
  }: {
    data: Record<string, number>;
    title: string;
  }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {title}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(data).map(([key, value], i) => (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, color: "#444", fontWeight: 500 }}>
                  {key}
                </span>
                <span style={{ fontSize: 13, color: "#999" }}>
                  {value} ({total > 0 ? Math.round((value / total) * 100) : 0}%)
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${total > 0 ? (value / total) * 100 : 0}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                    borderRadius: 4,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          📊 Admin Dashboard
        </h2>
        <p style={{ color: "#999", fontSize: 15 }}>
          Overview of Recope analytics
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}
      >
        <StatCard
          label="Total Users"
          value={data.totalUsers || 0}
          icon="👥"
          color="#3498db"
        />
        <StatCard
          label="Total Recipes"
          value={data.totalRecipes || 0}
          icon="🍽️"
          color="#e67e22"
        />
        <StatCard
          label="Avg Views/Recipe"
          value={
            data.totalRecipes
              ? Math.round(
                  (data.topRecipes?.reduce(
                    (a: number, r: any) => a + (r.view_count || 0),
                    0,
                  ) || 0) / data.totalRecipes,
                )
              : 0
          }
          icon="👁"
          color="#2ecc71"
        />
        <StatCard
          label="This Month"
          value={Object.values(data.recipesPerMonth)[5] || 0}
          icon="📅"
          color="#9b59b6"
        />
      </div>

      {/* Recipes per month */}
      <BarChart
        data={data.recipesPerMonth}
        title="📈 Recipes Added per Month"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Meal type breakdown */}
        {Object.keys(data.mealTypeCount).length > 0 && (
          <DonutChart
            data={data.mealTypeCount}
            title="🍳 Recipes by Meal Type"
          />
        )}

        {/* Cuisine breakdown */}
        {Object.keys(data.cuisineTypeCount).length > 0 && (
          <DonutChart
            data={data.cuisineTypeCount}
            title="🥩 Recipes by Cuisine"
          />
        )}
      </div>

      {/* Duration breakdown */}
      {Object.keys(data.durationCount).length > 0 && (
        <DonutChart
          data={data.durationCount}
          title="⏱ Recipes by Cook Duration"
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top recipes */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            🔥 Most Viewed Recipes
          </h3>
          {data.topRecipes?.length === 0 && (
            <p style={{ color: "#999", fontSize: 14 }}>No recipes yet</p>
          )}
          {data.topRecipes?.map((recipe: any, i: number) => (
            <div
              key={recipe.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: i === 0 ? "#e67e22" : "#f0f0f0",
                  color: i === 0 ? "#fff" : "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                  {recipe.title}
                </p>
                <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
                  by{" "}
                  {recipe.profiles?.first_name ||
                    recipe.profiles?.username ||
                    "Unknown"}
                </p>
              </div>
              <span style={{ fontSize: 13, color: "#999" }}>
                👁 {recipe.view_count || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Recent users */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            👥 Recent Users
          </h3>
          {data.recentUsers?.length === 0 && (
            <p style={{ color: "#999", fontSize: 14 }}>No users yet</p>
          )}
          {data.recentUsers?.map((user: any) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#fdf3e7",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#e67e22",
                  flexShrink: 0,
                  border: "1px solid #eee",
                }}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  (user.first_name || user.username || "?")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                  {user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`.trim()
                    : user.username || "Unknown"}
                </p>
                <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
