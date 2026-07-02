import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AvatarUpload from "../pages/AvatarUpload";
import { supabase } from "../lib/supabase";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  image_url: string;
  created_at: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

const GREEN = {
  primary: "#2d6a4f",
  light: "#f0f7f4",
  mid: "#d0e8dc",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: `1px solid ${GREEN.mid}`,
  fontSize: 15,
  outline: "none",
  backgroundColor: GREEN.light,
  boxSizing: "border-box",
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    first_name: "",
    last_name: "",
    avatar_url: "",
  });
  const [form, setForm] = useState<UserProfile>({
    first_name: "",
    last_name: "",
    avatar_url: "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [recipesData, profileData] = await Promise.all([
        api.get("/api/recipes/my"),
        api.get("/api/profile"),
      ]);
      if (Array.isArray(recipesData)) setRecipes(recipesData);
      if (profileData && !profileData.error) {
        setProfile(profileData);
        setForm(profileData);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const data = await api.put("/api/profile", form);
    if (!data.error) {
      setProfile(form);
      setEditing(false);
      window.dispatchEvent(new Event("profile-updated"));
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to delete your account? This action cannot be undone."
  );

  if (!confirmed) return;

  const data = await api.delete("/api/profile");

  if (data.error) {
    alert(data.error);
    return;
  }

  await supabase.auth.signOut();
  window.location.href = "/login";
};

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    const confirmed = window.confirm(
      `Are you sure you want to change your email to "${newEmail}"?\n\nYou will be logged out and a confirmation email will be sent to your new address. Click the link in the email to confirm the change.`,
    );
    if (!confirmed) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) setEmailMessage(error.message);
    else await supabase.auth.signOut();
  };

  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Profile header */}
      <div
        style={{
          backgroundColor: "#fff",
          border: `1px solid ${GREEN.mid}`,
          borderRadius: 16,
          padding: 32,
          marginBottom: 32,
        }}
      >
        {!editing ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: GREEN.light,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: GREEN.primary,
                  border: `3px solid ${GREEN.mid}`,
                  flexShrink: 0,
                }}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  displayName?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  {displayName}
                </h2>
                <p style={{ color: "#999", fontSize: 14 }}>{user?.email}</p>
                <p style={{ color: "#bbb", fontSize: 13, marginTop: 4 }}>
                  {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}{" "}
                  created
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setEditing(true)}
                style={{
                  border: `1px solid ${GREEN.mid}`,
                  background: "#fff",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: GREEN.primary,
                  cursor: "pointer",
                }}
              >
                Edit Profile
              </button>
              <button
                onClick={signOut}
                style={{
                  border: "1px solid #ffcdd2",
                  backgroundColor: "#fff5f5",
                  color: "#e53935",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>

              <button
              onClick={handleDeleteAccount}
              style={{
                backgroundColor: "#ffe5e5",
                color: "#d32f2f",
                border: "1px solid #ffcdd2",
                padding: "10px 14px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
                }}
                >
                  Delete Account
                  </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
              Edit Profile
            </h3>

            <AvatarUpload
              currentAvatar={form.avatar_url}
              firstName={form.first_name}
              onUpload={(url) => setForm({ ...form, avatar_url: url })}
            />

            {/* Name fields */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#444",
                    marginBottom: 6,
                  }}
                >
                  First Name
                </label>
                <input
                  placeholder="First name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#444",
                    marginBottom: 6,
                  }}
                >
                  Last Name
                </label>
                <input
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email update */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#444",
                  marginBottom: 6,
                }}
              >
                Update Email
              </label>
              <p style={{ fontSize: 13, color: "#999", marginBottom: 8 }}>
                Current: {user?.email}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  placeholder="New email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleUpdateEmail}
                  style={{
                    backgroundColor: GREEN.primary,
                    color: "#fff",
                    border: "none",
                    padding: "11px 20px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  Update
                </button>
              </div>
              {emailMessage && (
                <p
                  style={{
                    fontSize: 13,
                    marginTop: 8,
                    color: emailMessage.includes("sent")
                      ? GREEN.primary
                      : "#e53935",
                    backgroundColor: emailMessage.includes("sent")
                      ? GREEN.light
                      : "#fff5f5",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${emailMessage.includes("sent") ? GREEN.mid : "#ffcdd2"}`,
                  }}
                >
                  {emailMessage}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setEditing(false);
                  setForm(profile);
                  setEmailMessage("");
                  setNewEmail("");
                }}
                style={{
                  border: `1px solid ${GREEN.mid}`,
                  background: "#fff",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: "pointer",
                  color: "#555",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  backgroundColor: GREEN.primary,
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My Recipes */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 20, fontWeight: 700 }}>My Recipes</h3>
        <button
          onClick={() => navigate("/create")}
          style={{
            backgroundColor: GREEN.primary,
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Create Recipe
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 80, color: "#999" }}>
          Loading...
        </div>
      )}

      {!loading && recipes.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            backgroundColor: "#fff",
            border: `1px solid ${GREEN.mid}`,
            borderRadius: 16,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No recipes yet
          </p>
          <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>
            Create your first recipe to get started
          </p>
          <button
            onClick={() => navigate("/create")}
            style={{
              backgroundColor: GREEN.primary,
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Create Recipe
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => navigate(`/recipe/${recipe.id}`)}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              cursor: "pointer",
              border: `1px solid ${GREEN.mid}`,
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                `0 4px 20px rgba(45,106,79,0.12)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: "100%",
                height: 140,
                backgroundColor: GREEN.light,
                borderRadius: 8,
                marginBottom: 14,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
              }}
            >
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "🍽️"
              )}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
              {recipe.title}
            </h3>
            <p
              style={{
                color: "#999",
                fontSize: 14,
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              {recipe.description?.slice(0, 80)}
              {recipe.description?.length > 80 ? "..." : ""}
            </p>
            <div
              style={{ display: "flex", gap: 12, fontSize: 13, color: "#bbb" }}
            >
              <span>⏱ {recipe.prep_time + recipe.cook_time}min</span>
              <span>👤 {recipe.servings} servings</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
